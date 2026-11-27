import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router";
import type { Session } from "@supabase/supabase-js";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AuthContext } from "../../src/auth/auth-context";

const supabaseMocks = vi.hoisted(() => ({
    from: vi.fn(),
    assignmentsSelect: vi.fn(),
    headersSelect: vi.fn(),
    headersIn: vi.fn(),
}));

vi.mock("../../src/lib/supabase", () => ({
    supabase: { from: supabaseMocks.from },
}));

import App from "../../src/App";

describe("App routes", () => {
    beforeEach(() => {
        localStorage.removeItem("rt-radio-language");
        document.documentElement.lang = "en";
        document.documentElement.dir = "ltr";

        const headersQuery = {
            select: supabaseMocks.headersSelect,
            in: supabaseMocks.headersIn,
        };
        supabaseMocks.from.mockImplementation((table: string) =>
            table === "user_headers"
                ? { select: supabaseMocks.assignmentsSelect }
                : headersQuery,
        );
        supabaseMocks.assignmentsSelect.mockResolvedValue({
            data: [],
            error: null,
        });
        supabaseMocks.headersSelect.mockReturnValue(headersQuery);
        supabaseMocks.headersIn.mockReturnValue(headersQuery);
    });

    function renderAt(
        path: string,
        session: Session | null = null,
        authError = false,
    ) {
        return render(
            <AuthContext.Provider
                value={{ session, loading: false, authError }}
            >
                <MemoryRouter initialEntries={[path]}>
                    <App />
                </MemoryRouter>
            </AuthContext.Provider>,
        );
    }

    it.each([
        ["/login", "Login"],
        ["/sign-up", "Sign Up"],
        ["/forgot-password", "Forgot password"],
        ["/reset-password", "This reset link is invalid or expired. Request a new one."],
    ])("renders the route %s", (path, expectedText) => {
        renderAt(path);

        if (path === "/reset-password") {
            expect(screen.getByRole("alert")).toHaveTextContent(
                "This reset link is invalid or expired. Request a new one.",
            );
        } else {
            expect(
                screen.getByRole("heading", { name: expectedText }),
            ).toBeInTheDocument();
        }
    });

    it("redirects the root route to login when signed out", async () => {
        renderAt("/");

        expect(
            await screen.findByRole("heading", { name: "Login" }),
        ).toBeInTheDocument();
    });

    it("renders the protected home route when signed in", async () => {
        const user = userEvent.setup();
        renderAt("/", { user: { email: "user@example.com" } } as Session);

        expect(
            await screen.findByRole("heading", { name: "Your headers" }),
        ).toBeInTheDocument();
        expect(
            screen.queryByRole("link", { name: "RT-Radio" }),
        ).not.toBeInTheDocument();
        await user.click(screen.getByRole("button", { name: "Menu" }));
        expect(screen.getByRole("link", { name: "Downloads" })).toHaveAttribute(
            "href",
            "/",
        );
        expect(
            screen.getByRole("link", { name: "Account settings" }),
        ).toHaveAttribute("href", "/account");
        const [primaryDivider, secondaryDivider] =
            screen.getAllByRole("separator");
        expect(
            screen
                .getByRole("link", { name: "Downloads" })
                .compareDocumentPosition(primaryDivider),
        ).toBe(Node.DOCUMENT_POSITION_FOLLOWING);
        expect(
            primaryDivider.compareDocumentPosition(
                screen.getByRole("link", { name: "Account settings" }),
            ),
        ).toBe(Node.DOCUMENT_POSITION_FOLLOWING);
        expect(
            screen
                .getByRole("link", { name: "Account settings" })
                .compareDocumentPosition(secondaryDivider),
        ).toBe(Node.DOCUMENT_POSITION_FOLLOWING);
        expect(
            secondaryDivider.compareDocumentPosition(
                screen.getByRole("link", { name: "Guide" }),
            ),
        ).toBe(Node.DOCUMENT_POSITION_FOLLOWING);
        expect(screen.getByRole("link", { name: "Guide" })).toHaveAttribute(
            "href",
            "/guide/index.html",
        );
        expect(screen.getByRole("link", { name: "Contact" })).toHaveAttribute(
            "href",
            "/contact",
        );
        expect(screen.queryByRole("link", { name: "Login" })).not.toBeInTheDocument();
    });

    it("renders the protected account route when signed in", async () => {
        const user = userEvent.setup();
        renderAt(
            "/account",
            { user: { email: "user@example.com" } } as Session,
        );

        expect(
            screen.getByRole("heading", { name: "Account settings" }),
        ).toBeInTheDocument();
        expect(
            screen.queryByRole("link", { name: "RT-Radio" }),
        ).not.toBeInTheDocument();
        await user.click(screen.getByRole("button", { name: "Menu" }));
        expect(
            screen.getByRole("link", { name: "Downloads" }),
        ).toHaveAttribute("href", "/");
        expect(
            screen.getByRole("link", { name: "Account settings" }),
        ).toHaveAttribute("href", "/account");
        expect(screen.getByRole("link", { name: "Guide" })).toHaveAttribute(
            "href",
            "/guide/index.html",
        );
        expect(screen.getByRole("link", { name: "Contact" })).toHaveAttribute(
            "href",
            "/contact",
        );
    });

    it("shows a contact-admin message when session loading fails", () => {
        renderAt("/login", null, true);

        expect(screen.getByRole("alert")).toHaveTextContent(
            "We couldn't complete that request.",
        );
        expect(
            screen.getByRole("link", { name: "contact the site administrator." }),
        ).toHaveAttribute("href", "/contact");
    });

    it("allows access to contact information when session loading fails", async () => {
        const user = userEvent.setup();
        renderAt("/login", null, true);

        await user.click(
            screen.getByRole("link", {
                name: "contact the site administrator.",
            }),
        );

        expect(
            screen.getByRole("heading", { name: "Contact" }),
        ).toBeInTheDocument();
        await user.click(screen.getByRole("button", { name: "Menu" }));
        expect(screen.getByRole("link", { name: "Login" })).toHaveAttribute(
            "href",
            "/login",
        );
        expect(screen.getByRole("link", { name: "Sign Up" })).toHaveAttribute(
            "href",
            "/sign-up",
        );
        expect(
            screen.getByRole("link", { name: "Forgot password" }),
        ).toHaveAttribute("href", "/forgot-password");
        const divider = screen.getByRole("separator");
        expect(
            screen
                .getByRole("link", { name: "Forgot password" })
                .compareDocumentPosition(divider),
        ).toBe(Node.DOCUMENT_POSITION_FOLLOWING);
        expect(screen.getByRole("link", { name: "Guide" })).toHaveAttribute(
            "href",
            "/guide/index.html",
        );
        expect(
            divider.compareDocumentPosition(
                screen.getByRole("link", { name: "Guide" }),
            ),
        ).toBe(Node.DOCUMENT_POSITION_FOLLOWING);
        expect(screen.getByRole("link", { name: "Contact" })).toHaveAttribute(
            "href",
            "/contact",
        );
        expect(
            screen.queryByRole("link", { name: "Account settings" }),
        ).not.toBeInTheDocument();
        expect(
            screen.queryByRole("link", { name: "Downloads" }),
        ).not.toBeInTheDocument();
        expect(
            screen.getByRole("link", { name: "0534201812" }),
        ).toHaveAttribute("href", "tel:0534201812");
    });

    it("switches contact language and adjusts both name copies", async () => {
        const user = userEvent.setup();
        renderAt("/contact");

        expect(screen.getByText("Dan Krumkop")).toBeInTheDocument();
        expect(screen.getByText("(דן קרומקופ)")).toBeInTheDocument();
        expect(
            screen.getByRole("button", { name: "Switch to dark mode" }),
        ).toBeInTheDocument();

        await user.click(screen.getByRole("button", { name: "Language" }));
        await user.click(screen.getByRole("button", { name: "עברית" }));

        await user.click(screen.getByRole("button", { name: "תפריט" }));
        expect(
            screen.getByRole("link", { name: "מדריך" }),
        ).toHaveAttribute("href", "/guide/index.html");
        expect(screen.getByText("דן קרומקופ")).toBeInTheDocument();
        expect(screen.queryByText("(דן קרומקופ)")).not.toBeInTheDocument();
        expect(screen.queryByText("Dan Krumkop")).not.toBeInTheDocument();
        expect(document.documentElement).toHaveAttribute("dir", "rtl");
    });

    it.each([
        ["ru", "Дан Крумкоп", "ltr"],
        ["ar", "دان كرومكوب", "rtl"],
    ] as const)(
        "shows the %s contact name in the page direction",
        (language, localizedName, direction) => {
            localStorage.setItem("rt-radio-language", language);
            renderAt("/contact");

            expect(screen.getByText(localizedName)).toBeInTheDocument();
            expect(screen.getByText("(דן קרומקופ)")).toBeInTheDocument();
            expect(
                screen.getByText(localizedName).closest(".contact-name"),
            ).toHaveAttribute("dir", direction);
        },
    );

    it("navigates from the contact page with the public pages menu", async () => {
        const user = userEvent.setup();
        renderAt("/contact");

        await user.click(screen.getByRole("button", { name: "Menu" }));
        await user.click(screen.getByRole("link", { name: "Login" }));

        expect(
            await screen.findByRole("heading", { name: "Login" }),
        ).toBeInTheDocument();
    });

    it("switches translations and document direction for Hebrew", async () => {
        const user = userEvent.setup();
        renderAt("/login");

        await user.click(screen.getByRole("button", { name: "Language" }));
        await user.click(screen.getByRole("button", { name: "עברית" }));

        expect(
            screen.getByRole("button", { name: "שפה" }),
        ).toBeInTheDocument();
        expect(document.documentElement).toHaveAttribute("lang", "he");
        expect(document.documentElement).toHaveAttribute("dir", "rtl");
    });

    it("uses the browser language when there is no saved selection", () => {
        vi.stubGlobal("navigator", {
            languages: ["ar-EG"],
            language: "ar-EG",
        });
        renderAt("/login");

        expect(document.documentElement).toHaveAttribute("lang", "ar");
        expect(document.documentElement).toHaveAttribute("dir", "rtl");
        vi.unstubAllGlobals();
    });
});

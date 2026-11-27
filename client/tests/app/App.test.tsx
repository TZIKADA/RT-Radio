import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router";
import type { Session } from "@supabase/supabase-js";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AuthContext } from "../../src/scripts/auth-context";

const supabaseMocks = vi.hoisted(() => ({
    from: vi.fn(),
    assignmentsSelect: vi.fn(),
    headersSelect: vi.fn(),
    headersIn: vi.fn(),
    headersOrder: vi.fn(),
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
            order: supabaseMocks.headersOrder,
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
        supabaseMocks.headersOrder.mockResolvedValue({ data: [], error: null });
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
        ["/login", "RT-Radio"],
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
            await screen.findByRole("heading", { name: "RT-Radio" }),
        ).toBeInTheDocument();
    });

    it("renders the protected home route when signed in", async () => {
        renderAt("/", { user: { email: "user@example.com" } } as Session);

        expect(
            await screen.findByRole("heading", { name: "Your headers" }),
        ).toBeInTheDocument();
    });

    it("renders the protected account route when signed in", () => {
        renderAt(
            "/account",
            { user: { email: "user@example.com" } } as Session,
        );

        expect(
            screen.getByRole("heading", { name: "Account settings" }),
        ).toBeInTheDocument();
    });

    it("shows a contact-admin message when session loading fails", () => {
        renderAt("/login", null, true);

        expect(screen.getByRole("alert")).toHaveTextContent(
            "notify the site administrator: [Add administrator contact information]",
        );
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

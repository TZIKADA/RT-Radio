import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import type { Session } from "@supabase/supabase-js";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AuthContext } from "./scripts/auth-context";

const supabaseMocks = vi.hoisted(() => ({
    from: vi.fn(),
    select: vi.fn(),
}));

vi.mock("./lib/supabase", () => ({
    supabase: { from: supabaseMocks.from },
}));

import App from "./App";

describe("App routes", () => {
    beforeEach(() => {
        supabaseMocks.from.mockReturnValue({ select: supabaseMocks.select });
        supabaseMocks.select.mockResolvedValue({ data: [], error: null });
    });

    function renderAt(path: string, session: Session | null = null) {
        return render(
            <AuthContext.Provider value={{ session, loading: false }}>
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
        ["/reset-password", "This reset link is invalid or has expired."],
    ])("renders the route %s", (path, expectedText) => {
        renderAt(path);

        if (path === "/reset-password") {
            expect(screen.getByRole("alert")).toHaveTextContent(expectedText);
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
        renderAt("/", {} as Session);

        expect(
            await screen.findByRole("heading", { name: "Main Header File" }),
        ).toBeInTheDocument();
    });
});

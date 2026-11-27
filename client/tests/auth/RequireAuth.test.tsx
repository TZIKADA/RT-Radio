import { render, screen } from "@testing-library/react";
import type { Session } from "@supabase/supabase-js";
import { MemoryRouter, Route, Routes } from "react-router";
import { describe, expect, it } from "vitest";
import { AuthContext } from "../../src/auth/auth-context";
import RequireAuth from "../../src/auth/RequireAuth";

describe("RequireAuth", () => {
    function renderGuard(session: Session | null, loading: boolean) {
        return render(
            <AuthContext.Provider value={{ session, loading, authError: false }}>
                <MemoryRouter initialEntries={["/private"]}>
                    <Routes>
                        <Route element={<RequireAuth />}>
                            <Route
                                path="/private"
                                element={<p>Private content</p>}
                            />
                        </Route>
                        <Route path="/login" element={<p>Login page</p>} />
                    </Routes>
                </MemoryRouter>
            </AuthContext.Provider>,
        );
    }

    it("waits while the session is loading", () => {
        renderGuard(null, true);

        expect(screen.queryByText("Private content")).not.toBeInTheDocument();
        expect(screen.queryByText("Login page")).not.toBeInTheDocument();
    });

    it("redirects signed-out visitors to login", async () => {
        renderGuard(null, false);

        expect(await screen.findByText("Login page")).toBeInTheDocument();
    });

    it("renders protected content for an authenticated session", () => {
        renderGuard({} as Session, false);

        expect(screen.getByText("Private content")).toBeInTheDocument();
    });
});

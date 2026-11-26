import { act, render, screen, waitFor } from "@testing-library/react";
import type { Session } from "@supabase/supabase-js";
import { useAuth } from "../../src/scripts/useAuth";
import { beforeEach, describe, expect, it, vi } from "vitest";

const authMocks = vi.hoisted(() => ({
    getSession: vi.fn(),
    onAuthStateChange: vi.fn(),
    unsubscribe: vi.fn(),
}));

vi.mock("../../src/lib/supabase", () => ({
    supabase: {
        auth: {
            getSession: authMocks.getSession,
            onAuthStateChange: authMocks.onAuthStateChange,
        },
    },
}));

import AuthProvider from "../../src/components/AuthProvider";

function AuthStateProbe() {
    const { session, loading } = useAuth();
    return (
        <p>
            {loading ? "Loading session" : session ? "Signed in" : "Signed out"}
        </p>
    );
}

describe("AuthProvider", () => {
    beforeEach(() => {
        authMocks.getSession.mockResolvedValue({ data: { session: null } });
        authMocks.onAuthStateChange.mockReturnValue({
            data: { subscription: { unsubscribe: authMocks.unsubscribe } },
        });
    });

    it("loads the stored session and updates when auth changes", async () => {
        const { unmount } = render(
            <AuthProvider>
                <AuthStateProbe />
            </AuthProvider>,
        );

        expect(screen.getByText("Loading session")).toBeInTheDocument();
        await waitFor(() =>
            expect(screen.getByText("Signed out")).toBeInTheDocument(),
        );

        const listener = authMocks.onAuthStateChange.mock.calls[0][0] as (
            event: string,
            session: Session | null,
        ) => void;
        act(() => listener("SIGNED_IN", {} as Session));
        expect(screen.getByText("Signed in")).toBeInTheDocument();

        unmount();
        expect(authMocks.unsubscribe).toHaveBeenCalledOnce();
    });

    it("restores a session found during initial loading", async () => {
        authMocks.getSession.mockResolvedValue({
            data: { session: {} as Session },
        });
        render(
            <AuthProvider>
                <AuthStateProbe />
            </AuthProvider>,
        );

        expect(await screen.findByText("Signed in")).toBeInTheDocument();
    });
});

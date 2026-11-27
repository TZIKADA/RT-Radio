import { useEffect, useState, type ReactNode } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "../lib/supabase";
import { AuthContext } from "./auth-context";
import { logAppError } from "../lib/errors";

export default function AuthProvider({ children }: { children: ReactNode }) {
    const [session, setSession] = useState<Session | null>(null);
    const [loading, setLoading] = useState(true);
    const [authError, setAuthError] = useState(false);

    useEffect(() => {
        let mounted = true;

        async function loadSession() {
            try {
                const { data, error } = await supabase.auth.getSession();
                if (error) throw error;
                if (mounted) setSession(data.session);
            } catch (error) {
                logAppError("Loading authentication session failed", error);
                if (mounted) setAuthError(true);
            } finally {
                if (mounted) setLoading(false);
            }
        }

        void loadSession();

        let unsubscribe: (() => void) | undefined;
        try {
            const {
                data: { subscription },
            } = supabase.auth.onAuthStateChange((_event, newSession) => {
                setSession(newSession);
                setAuthError(false);
            });
            unsubscribe = () => subscription.unsubscribe();
        } catch (error) {
            logAppError("Subscribing to authentication changes failed", error);
            queueMicrotask(() => {
                if (mounted) {
                    setAuthError(true);
                    setLoading(false);
                }
            });
        }

        return () => {
            mounted = false;
            unsubscribe?.();
        };
    }, []);

    return (
        <AuthContext.Provider value={{ session, loading, authError }}>
            {children}
        </AuthContext.Provider>
    );
}

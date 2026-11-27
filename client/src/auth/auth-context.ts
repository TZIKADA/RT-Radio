import { createContext } from "react";
import type { Session } from "@supabase/supabase-js";

export type AuthState = {
    session: Session | null;
    loading: boolean;
    authError: boolean;
};

export const AuthContext = createContext<AuthState>({
    session: null,
    loading: true,
    authError: false,
});

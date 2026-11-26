import { Navigate, Outlet } from "react-router";
import { useAuth } from "../scripts/useAuth";

export default function RequireAuth() {
    const { session, loading } = useAuth();

    if (loading) return null; // avoids a redirect flash on page refresh
    return session ? <Outlet /> : <Navigate to="/login" replace />;
}

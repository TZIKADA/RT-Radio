import { Routes, Route } from "react-router";
import { Alert, Container } from "react-bootstrap";
import RequireAuth from "./components/RequireAuth";
import Login from "./pages/Login";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import SignUp from "./pages/SignUp";
import Home from "./pages/Home";
import Account from "./pages/Account";
import { LanguageProvider, useTranslation } from "./components/LanguageProvider";
import { useAuth } from "./scripts/useAuth";
import { withAdminContact } from "./lib/errors";

function AppRoutes() {
    const { authError } = useAuth();
    const { t } = useTranslation();

    if (authError) {
        return (
            <Container className="py-5">
                <Alert variant="danger" role="alert">
                    {withAdminContact(t("requestFailed"))}
                </Alert>
            </Container>
        );
    }

    return (
        <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/sign-up" element={<SignUp />} />

            <Route element={<RequireAuth />}>
                <Route path="/" element={<Home />} />
                <Route path="/account" element={<Account />} />
            </Route>
        </Routes>
    );
}

export default function App() {
    return (
        <LanguageProvider>
            <AppRoutes />
        </LanguageProvider>
    );
}

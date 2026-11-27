import { useState, type SubmitEvent } from "react";
import { Link, Navigate } from "react-router";
import { Button, Form } from "react-bootstrap";
import AuthCard from "../components/AuthCard";
import { useAuth } from "../scripts/useAuth";
import { supabase } from "../lib/supabase";
import { useTranslation } from "../components/LanguageProvider";
import AdminErrorAlert from "../components/AdminErrorAlert";
import { logAppError } from "../lib/errors";

export default function Login() {
    const { session, loading } = useAuth();
    const { t } = useTranslation();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [busy, setBusy] = useState(false);

    // Wait for the stored session to load, then send logged-in users home.
    // This also handles the redirect right after a successful sign-in:
    // signInWithPassword updates the session, which re-renders this page.
    if (loading) return null;
    if (session) return <Navigate to="/" replace />;

    async function handleSubmit(e: SubmitEvent<HTMLFormElement>) {
        e.preventDefault();
        setBusy(true);
        setError(null);

        try {
            const { error: signInError } =
                await supabase.auth.signInWithPassword({
                    email,
                    password,
                });

            if (signInError) {
                logAppError("Signing in failed", signInError);
                setError(t("signInFailed"));
            }
        } catch (signInError) {
            logAppError("Signing in failed", signInError);
            setError(t("signInFailed"));
        } finally {
            setBusy(false);
        }
    }

    return (
        <AuthCard title={t("login")}>
            <Form onSubmit={handleSubmit}>
                {error && <AdminErrorAlert message={error} />}

                <Form.Group className="mb-3" controlId="email">
                    <Form.Label>{t("email")}</Form.Label>
                    <Form.Control
                        type="email"
                        placeholder="email@example.com"
                        autoComplete="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                    />
                </Form.Group>

                <Form.Group className="mb-2" controlId="password">
                    <Form.Label>{t("password")}</Form.Label>
                    <Form.Control
                        type="password"
                        placeholder={t("enterPassword")}
                        autoComplete="current-password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                    />
                </Form.Group>

                <div className="text-end mb-4">
                    <Link to="/forgot-password" className="small">
                        {t("forgotYourPassword")}
                    </Link>
                </div>

                <div className="d-grid gap-2">
                    <Button type="submit" variant="primary" disabled={busy}>
                        {busy ? t("loggingIn") : t("login")}
                    </Button>
                    <Link to="/sign-up" className="btn btn-outline-secondary">
                        {t("signUp")}
                    </Link>
                </div>
            </Form>
        </AuthCard>
    );
}

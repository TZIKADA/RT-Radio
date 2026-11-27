import { useState, type SubmitEvent } from "react";
import { Link } from "react-router";
import { Alert, Button, Form } from "react-bootstrap";
import AuthCard from "../components/AuthCard";
import { supabase } from "../lib/supabase";
import { useTranslation } from "../components/LanguageProvider";
import { logAppError, withAdminContact } from "../lib/errors";

export default function ForgotPassword() {
    const { t } = useTranslation();
    const [email, setEmail] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [busy, setBusy] = useState(false);
    const [sent, setSent] = useState(false);

    async function handleSubmit(e: SubmitEvent<HTMLFormElement>) {
        e.preventDefault();
        setBusy(true);
        setError(null);

        try {
            const { error: resetError } =
                await supabase.auth.resetPasswordForEmail(email, {
                    redirectTo: `${window.location.origin}/reset-password`,
                });

            if (resetError) {
                logAppError("Requesting password reset failed", resetError);
                setError(withAdminContact(t("requestFailed")));
                return;
            }
            setSent(true);
        } catch (resetError) {
            logAppError("Requesting password reset failed", resetError);
            setError(withAdminContact(t("requestFailed")));
        } finally {
            setBusy(false);
        }
    }

    return (
        <AuthCard title={t("forgotPassword")}>
            {sent ? (
                <>
                    <Alert variant="success">
                        {t("confirmationSent").replace("{email}", email)}
                    </Alert>
                    <div className="d-grid">
                        <Link to="/login" className="btn btn-outline-secondary">
                            {t("backToLogin")}
                        </Link>
                    </div>
                </>
            ) : (
                <Form onSubmit={handleSubmit}>
                    <p className="text-body-secondary">
                        {t("enterEmailForReset")}
                    </p>

                    {error && <Alert variant="danger">{error}</Alert>}

                    <Form.Group className="mb-4" controlId="email">
                        <Form.Label>{t("email")}</Form.Label>
                        <Form.Control
                            type="email"
                            placeholder="yourmail@example.com"
                            autoComplete="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                    </Form.Group>

                    <div className="d-grid gap-2">
                        <Button type="submit" variant="primary" disabled={busy}>
                            {busy
                                ? t("sending")
                                : t("sendResetLink")}
                        </Button>
                        <Link to="/login" className="btn btn-outline-secondary">
                            {t("backToLogin")}
                        </Link>
                    </div>
                </Form>
            )}
        </AuthCard>
    );
}

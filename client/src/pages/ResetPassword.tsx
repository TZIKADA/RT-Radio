import { useState, type SubmitEvent } from "react";
import { Link, useNavigate } from "react-router";
import { Alert, Button, Form } from "react-bootstrap";
import AuthCard from "../components/AuthCard";
import { useAuth } from "../scripts/useAuth";
import { supabase } from "../lib/supabase";

import { MIN_PASSWORD_LENGTH } from "../scripts/auth";
import { useTranslation } from "../components/LanguageProvider";
import AdminErrorAlert from "../components/AdminErrorAlert";
import { logAppError } from "../lib/errors";

export default function ResetPassword() {
    // Opening the emailed link makes supabase-js create a temporary session,
    // so "has a session" means "the link was valid".
    const { session, loading } = useAuth();
    const { t } = useTranslation();
    const navigate = useNavigate();
    const [password, setPassword] = useState("");
    const [confirm, setConfirm] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [errorNeedsSupport, setErrorNeedsSupport] = useState(false);
    const [busy, setBusy] = useState(false);

    if (loading) return null;

    if (!session) {
        return (
            <AuthCard title={t("resetPassword")}>
                <Alert variant="warning">
                    {t("invalidResetLink")}
                </Alert>
                <div className="d-grid gap-2">
                    <Link to="/forgot-password" className="btn btn-primary">
                        {t("requestNewLink")}
                    </Link>
                    <Link to="/login" className="btn btn-outline-secondary">
                        {t("backToLogin")}
                    </Link>
                </div>
            </AuthCard>
        );
    }

    async function handleSubmit(e: SubmitEvent<HTMLFormElement>) {
        e.preventDefault();
        setError(null);
        setErrorNeedsSupport(false);

        if (password !== confirm) {
            setError(t("passwordsDoNotMatch"));
            return;
        }

        setBusy(true);
        try {
            const { error: updateError } = await supabase.auth.updateUser({
                password,
            });

            if (updateError) {
                logAppError("Resetting password failed", updateError);
                setErrorNeedsSupport(true);
                setError(t("requestFailed"));
                return;
            }
            navigate("/", { replace: true }); // already signed in by the reset link
        } catch (updateError) {
            logAppError("Resetting password failed", updateError);
            setErrorNeedsSupport(true);
            setError(t("requestFailed"));
        } finally {
            setBusy(false);
        }
    }

    return (
        <AuthCard title={t("resetPassword")}>
            <Form onSubmit={handleSubmit}>
                {error &&
                    (errorNeedsSupport ? (
                        <AdminErrorAlert message={error} />
                    ) : (
                        <Alert variant="danger">{error}</Alert>
                    ))}

                <Form.Group className="mb-3" controlId="password">
                    <Form.Label>{t("newPassword")}</Form.Label>
                    <Form.Control
                        type="password"
                        placeholder={t("enterNewPassword")}
                        autoComplete="new-password"
                        minLength={MIN_PASSWORD_LENGTH}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                    />
                    <Form.Text muted>
                        {t("atLeastCharacters").replace(
                            "{count}",
                            String(MIN_PASSWORD_LENGTH),
                        )}
                    </Form.Text>
                </Form.Group>

                <Form.Group className="mb-4" controlId="confirm">
                    <Form.Label>{t("confirmNewPassword")}</Form.Label>
                    <Form.Control
                        type="password"
                        placeholder={t("repeatNewPassword")}
                        autoComplete="new-password"
                        value={confirm}
                        onChange={(e) => setConfirm(e.target.value)}
                        required
                    />
                </Form.Group>

                <div className="d-grid">
                    <Button type="submit" variant="primary" disabled={busy}>
                        {busy ? t("saving") : t("setNewPassword")}
                    </Button>
                </div>
            </Form>
        </AuthCard>
    );
}

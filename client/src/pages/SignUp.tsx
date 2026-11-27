import { useState, type SubmitEvent } from "react";
import { Link, Navigate } from "react-router";
import { Alert, Button, Form } from "react-bootstrap";
import AuthCard from "../components/AuthCard";
import { useAuth } from "../scripts/useAuth";
import { supabase } from "../lib/supabase";
import { MIN_PASSWORD_LENGTH } from "../scripts/auth";
import { useTranslation } from "../components/LanguageProvider";
import AdminErrorAlert from "../components/AdminErrorAlert";
import { logAppError } from "../lib/errors";

export default function SignUp() {
    const { session, loading } = useAuth();
    const { t } = useTranslation();
    const [error, setError] = useState<string | null>(null);
    const [errorNeedsSupport, setErrorNeedsSupport] = useState(false);
    const [busy, setBusy] = useState(false);
    const [confirmEmail, setConfirmEmail] = useState<string | null>(null);

    // Signed-in users (including right after a successful sign-up when email
    // confirmation is turned off) go straight home.
    if (loading) return null;
    if (session) return <Navigate to="/" replace />;

    async function handleSubmit(e: SubmitEvent<HTMLFormElement>) {
        e.preventDefault();
        setError(null);
        setErrorNeedsSupport(false);

        const form = new FormData(e.currentTarget);
        const text = (key: string) => String(form.get(key) ?? "").trim();
        const email = text("email");
        const password = String(form.get("password") ?? "");

        if (password !== String(form.get("confirm") ?? "")) {
            setError(t("passwordsDoNotMatch"));
            return;
        }

        setBusy(true);
        try {
            const { data, error: signUpError } = await supabase.auth.signUp({
                email,
                password,
                options: {
                    emailRedirectTo: `${window.location.origin}/`,
                    data: {
                        phone: text("phone") || null,
                    },
                },
            });

            if (signUpError) {
                logAppError("Creating account failed", signUpError);
                setErrorNeedsSupport(true);
                setError(t("requestFailed"));
                return;
            }

            // With email confirmation on, Supabase doesn't return an error for an
            // address that is already registered; it returns a user with no identities.
            if (data.user?.identities?.length === 0) {
                setError(t("accountAlreadyExists"));
                return;
            }

            // Confirmation off: data.session is set, the auth context updates and
            // the <Navigate> above sends the user home.
            // Confirmation on: no session yet, so tell the user to check their email.
            if (!data.session) {
                setConfirmEmail(email);
            }
        } catch (signUpError) {
            logAppError("Creating account failed", signUpError);
            setErrorNeedsSupport(true);
            setError(t("requestFailed"));
        } finally {
            setBusy(false);
        }
    }

    if (confirmEmail) {
        const [messageBeforeEmail, messageAfterEmail] = t(
            "confirmationLinkSent",
        ).split("{email}");

        return (
            <AuthCard title={t("checkYourEmail")} width="32rem">
                <Alert variant="success">
                    {messageBeforeEmail}
                    <strong>{confirmEmail}</strong>
                    {messageAfterEmail}
                </Alert>
                <div className="d-grid">
                    <Link to="/login" className="btn btn-outline-secondary">
                        {t("backToLogin")}
                    </Link>
                </div>
            </AuthCard>
        );
    }

    return (
        <AuthCard title={t("signUpTitle")} width="32rem">
            <Form onSubmit={handleSubmit}>
                {error &&
                    (errorNeedsSupport ? (
                        <AdminErrorAlert message={error} />
                    ) : (
                        <Alert variant="danger">{error}</Alert>
                    ))}

                <Form.Group className="mb-3" controlId="email">
                    <Form.Label>{t("emailAddressLabel")}</Form.Label>
                    <Form.Control
                        type="email"
                        name="email"
                        placeholder="yourmail@example.com"
                        autoComplete="email"
                        required
                    />
                </Form.Group>

                <Form.Group className="mb-3" controlId="password">
                    <Form.Label>{t("password")}</Form.Label>
                    <Form.Control
                        type="password"
                        name="password"
                        placeholder={t("enterPassword")}
                        autoComplete="new-password"
                        minLength={MIN_PASSWORD_LENGTH}
                        required
                    />
                    <Form.Text muted>
                        {t("atLeastCharacters").replace(
                            "{count}",
                            String(MIN_PASSWORD_LENGTH),
                        )}
                    </Form.Text>
                </Form.Group>

                <Form.Group className="mb-3" controlId="confirm">
                    <Form.Label>{t("confirmPassword")}</Form.Label>
                    <Form.Control
                        type="password"
                        name="confirm"
                        placeholder={t("repeatPassword")}
                        autoComplete="new-password"
                        required
                    />
                </Form.Group>

                <hr className="mb-4" />

                <Form.Group className="mb-4" controlId="phone">
                    <Form.Label>{t("phoneNumberOptional")}</Form.Label>
                    <Form.Control
                        type="tel"
                        name="phone"
                        placeholder={t("enterPhoneNumber")}
                        autoComplete="tel"
                    />
                </Form.Group>

                <div className="d-grid gap-2">
                    <Button type="submit" variant="primary" disabled={busy}>
                        {busy ? t("creatingAccount") : t("signUp")}
                    </Button>
                    <Link
                        to="/login"
                        className="btn btn-outline-secondary text-center"
                    >
                        {t("backToLogin")}
                    </Link>
                </div>
            </Form>
        </AuthCard>
    );
}

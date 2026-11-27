import { useState, type SubmitEvent } from "react";
import { Alert, Button, Card, Container, Form } from "react-bootstrap";
import { MIN_PASSWORD_LENGTH } from "../scripts/auth";
import { supabase } from "../lib/supabase";
import { useAuth } from "../scripts/useAuth";
import AppControls from "../components/AppControls";
import AdminErrorAlert from "../components/AdminErrorAlert";
import { useTranslation } from "../components/LanguageProvider";
import { logAppError } from "../lib/errors";

export default function Account() {
    const { session } = useAuth();
    const { t } = useTranslation();
    const [email, setEmail] = useState(session?.user.email ?? "");
    const [emailError, setEmailError] = useState<string | null>(null);
    const [emailMessage, setEmailMessage] = useState<string | null>(null);
    const [emailBusy, setEmailBusy] = useState(false);
    const [passwordError, setPasswordError] = useState<string | null>(null);
    const [passwordErrorNeedsSupport, setPasswordErrorNeedsSupport] =
        useState(false);
    const [passwordMessage, setPasswordMessage] = useState<string | null>(null);
    const [passwordBusy, setPasswordBusy] = useState(false);

    async function updateEmail(event: SubmitEvent<HTMLFormElement>) {
        event.preventDefault();
        setEmailError(null);
        setEmailMessage(null);

        const nextEmail = email.trim();
        if (nextEmail === session?.user.email) {
            setEmailMessage(t("alreadyAccountEmail"));
            return;
        }

        setEmailBusy(true);
        try {
            const { error } = await supabase.auth.updateUser({
                email: nextEmail,
            });
            if (error) throw error;

            setEmailMessage(
                t("confirmEmailChange"),
            );
        } catch (updateError) {
            logAppError("Updating account email failed", updateError);
            setEmailError(t("requestFailed"));
        } finally {
            setEmailBusy(false);
        }
    }

    async function updatePassword(event: SubmitEvent<HTMLFormElement>) {
        event.preventDefault();
        setPasswordError(null);
        setPasswordErrorNeedsSupport(false);
        setPasswordMessage(null);

        const form = event.currentTarget;
        const formData = new FormData(form);
        const password = String(formData.get("password") ?? "");
        const confirmation = String(formData.get("confirm") ?? "");
        if (password !== confirmation) {
            setPasswordError(t("passwordsDoNotMatch"));
            return;
        }

        setPasswordBusy(true);
        try {
            const { error } = await supabase.auth.updateUser({ password });
            if (error) throw error;

            form.reset();
            setPasswordMessage(t("passwordUpdated"));
        } catch (updateError) {
            logAppError("Updating account password failed", updateError);
            setPasswordErrorNeedsSupport(true);
            setPasswordError(t("requestFailed"));
        } finally {
            setPasswordBusy(false);
        }
    }

    return (
        <Container className="py-5" style={{ maxWidth: "48rem" }}>
            <AppControls />

            <main className="pt-3">
                <h1 className="h2 mb-4">{t("accountSettings")}</h1>

                <Card className="shadow-sm mb-4">
                    <Card.Body className="p-4">
                        <Card.Title as="h2" className="h5 mb-3">
                            {t("emailAddress")}
                        </Card.Title>
                        <p className="text-muted mb-4">
                            {t("emailChangeHelp")}
                        </p>
                        <Form onSubmit={updateEmail}>
                            {emailError && (
                                <AdminErrorAlert message={emailError} />
                            )}
                            {emailMessage && (
                                <Alert variant="success" role="status">
                                    {emailMessage}
                                </Alert>
                            )}
                            <Form.Group className="mb-3" controlId="account-email">
                                <Form.Label>{t("email")}</Form.Label>
                                <Form.Control
                                    type="email"
                                    autoComplete="email"
                                    value={email}
                                    onChange={(event) =>
                                        setEmail(event.target.value)
                                    }
                                    required
                                />
                            </Form.Group>
                            <Button type="submit" disabled={emailBusy}>
                                {emailBusy
                                    ? t("saving")
                                    : t("updateEmail")}
                            </Button>
                        </Form>
                    </Card.Body>
                </Card>

                <Card className="shadow-sm">
                    <Card.Body className="p-4">
                        <Card.Title as="h2" className="h5 mb-3">
                            {t("password")}
                        </Card.Title>
                        <Form onSubmit={updatePassword}>
                            {passwordError &&
                                (passwordErrorNeedsSupport ? (
                                    <AdminErrorAlert message={passwordError} />
                                ) : (
                                    <Alert variant="danger" role="alert">
                                        {passwordError}
                                    </Alert>
                                ))}
                            {passwordMessage && (
                                <Alert variant="success" role="status">
                                    {passwordMessage}
                                </Alert>
                            )}
                            <Form.Group
                                className="mb-3"
                                controlId="account-password"
                            >
                                <Form.Label>{t("newPassword")}</Form.Label>
                                <Form.Control
                                    type="password"
                                    name="password"
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
                            <Form.Group
                                className="mb-4"
                                controlId="account-password-confirm"
                            >
                                <Form.Label>
                                    {t("confirmNewPassword")}
                                </Form.Label>
                                <Form.Control
                                    type="password"
                                    name="confirm"
                                    autoComplete="new-password"
                                    required
                                />
                            </Form.Group>
                            <Button type="submit" disabled={passwordBusy}>
                                {passwordBusy
                                    ? t("saving")
                                    : t("updatePassword")}
                            </Button>
                        </Form>
                    </Card.Body>
                </Card>
            </main>
        </Container>
    );
}

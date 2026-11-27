import { useState, type SubmitEvent } from "react";
import { Alert, Button, Card, Container, Form } from "react-bootstrap";
import { MIN_PASSWORD_LENGTH } from "../auth/auth";
import { supabase } from "../lib/supabase";
import { useAuth } from "../auth/useAuth";
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
    const [signOutError, setSignOutError] = useState<string | null>(null);
    const [signOutBusy, setSignOutBusy] = useState(false);
    const [confirmingDelete, setConfirmingDelete] = useState(false);
    const [deleteError, setDeleteError] = useState<string | null>(null);
    const [deleteBusy, setDeleteBusy] = useState(false);

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

    async function signOut() {
        setSignOutError(null);
        setSignOutBusy(true);
        try {
            // "local" ends only this device's session.
            const { error } = await supabase.auth.signOut({ scope: "local" });
            if (error) throw error;
        } catch (signOutFailure) {
            logAppError("Signing out failed", signOutFailure);
            setSignOutError(t("requestFailed"));
        } finally {
            setSignOutBusy(false);
        }
    }

    async function deleteAccount() {
        setDeleteError(null);
        setDeleteBusy(true);
        try {
            const { error } = await supabase.rpc("delete_own_account");
            if (error) throw error;

            // The account is gone; clear the local session so the app
            // returns to the login page.
            const { error: signOutFailure } = await supabase.auth.signOut({
                scope: "local",
            });
            if (signOutFailure) {
                logAppError(
                    "Clearing the session after account deletion failed",
                    signOutFailure,
                );
            }
        } catch (deleteFailure) {
            logAppError("Deleting account failed", deleteFailure);
            setDeleteError(t("requestFailed"));
            setConfirmingDelete(false);
        } finally {
            setDeleteBusy(false);
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

                <Card className="shadow-sm mb-4">
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

                <Card className="shadow-sm mb-4">
                    <Card.Body className="p-4">
                        <Card.Title as="h2" className="h5 mb-3">
                            {t("signOut")}
                        </Card.Title>
                        <p className="text-muted mb-4">{t("signOutHelp")}</p>
                        {signOutError && (
                            <AdminErrorAlert message={signOutError} />
                        )}
                        <Button
                            variant="outline-secondary"
                            onClick={() => void signOut()}
                            disabled={signOutBusy}
                        >
                            {signOutBusy ? t("signingOut") : t("signOut")}
                        </Button>
                    </Card.Body>
                </Card>

                <Card className="shadow-sm border-danger">
                    <Card.Body className="p-4">
                        <Card.Title as="h2" className="h5 mb-3 text-danger">
                            {t("deleteAccount")}
                        </Card.Title>
                        <p className="text-muted mb-4">
                            {t("deleteAccountWarning")}
                        </p>
                        {deleteError && (
                            <AdminErrorAlert message={deleteError} />
                        )}
                        {confirmingDelete ? (
                            <Alert variant="danger" role="alertdialog">
                                <p className="fw-semibold">
                                    {t("deleteAccountConfirm")}
                                </p>
                                <div className="d-flex flex-wrap gap-2">
                                    <Button
                                        variant="danger"
                                        onClick={() => void deleteAccount()}
                                        disabled={deleteBusy}
                                    >
                                        {deleteBusy
                                            ? t("deleting")
                                            : t("deleteAccount")}
                                    </Button>
                                    <Button
                                        variant="outline-secondary"
                                        onClick={() =>
                                            setConfirmingDelete(false)
                                        }
                                        disabled={deleteBusy}
                                    >
                                        {t("cancel")}
                                    </Button>
                                </div>
                            </Alert>
                        ) : (
                            <Button
                                variant="outline-danger"
                                onClick={() => setConfirmingDelete(true)}
                            >
                                {t("deleteAccount")}
                            </Button>
                        )}
                    </Card.Body>
                </Card>
            </main>
        </Container>
    );
}

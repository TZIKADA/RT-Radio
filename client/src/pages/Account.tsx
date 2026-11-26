import { useState, type SubmitEvent } from "react";
import { Alert, Button, Card, Container, Form } from "react-bootstrap";
import { Link } from "react-router";
import { MIN_PASSWORD_LENGTH } from "../lib/auth";
import { supabase } from "../lib/supabase";
import { useAuth } from "../scripts/useAuth";

export default function Account() {
    const { session } = useAuth();
    const [email, setEmail] = useState(session?.user.email ?? "");
    const [emailError, setEmailError] = useState<string | null>(null);
    const [emailMessage, setEmailMessage] = useState<string | null>(null);
    const [emailBusy, setEmailBusy] = useState(false);
    const [passwordError, setPasswordError] = useState<string | null>(null);
    const [passwordMessage, setPasswordMessage] = useState<string | null>(null);
    const [passwordBusy, setPasswordBusy] = useState(false);

    async function updateEmail(event: SubmitEvent<HTMLFormElement>) {
        event.preventDefault();
        setEmailError(null);
        setEmailMessage(null);

        const nextEmail = email.trim();
        if (nextEmail === session?.user.email) {
            setEmailMessage("That is already the email on your account.");
            return;
        }

        setEmailBusy(true);
        try {
            const { error } = await supabase.auth.updateUser({
                email: nextEmail,
            });
            if (error) throw error;

            setEmailMessage(
                "Check your inbox to confirm the email address change.",
            );
        } catch (updateError) {
            console.error(updateError);
            setEmailError(
                updateError instanceof Error
                    ? updateError.message
                    : "An unexpected error occurred while updating your email.",
            );
        } finally {
            setEmailBusy(false);
        }
    }

    async function updatePassword(event: SubmitEvent<HTMLFormElement>) {
        event.preventDefault();
        setPasswordError(null);
        setPasswordMessage(null);

        const form = event.currentTarget;
        const formData = new FormData(form);
        const password = String(formData.get("password") ?? "");
        const confirmation = String(formData.get("confirm") ?? "");
        if (password !== confirmation) {
            setPasswordError("Passwords do not match.");
            return;
        }

        setPasswordBusy(true);
        try {
            const { error } = await supabase.auth.updateUser({ password });
            if (error) throw error;

            form.reset();
            setPasswordMessage("Your password has been updated.");
        } catch (updateError) {
            console.error(updateError);
            setPasswordError(
                updateError instanceof Error
                    ? updateError.message
                    : "An unexpected error occurred while updating your password.",
            );
        } finally {
            setPasswordBusy(false);
        }
    }

    return (
        <Container className="py-5" style={{ maxWidth: "48rem" }}>
            <header className="d-flex justify-content-between align-items-center mb-5">
                <Link to="/" className="text-decoration-none text-dark">
                    <span className="h3 mb-0">RT-Radio</span>
                </Link>
                <Link to="/" className="btn btn-outline-secondary">
                    Back to downloads
                </Link>
            </header>

            <main>
                <h1 className="h2 mb-4">Account settings</h1>

                <Card className="shadow-sm mb-4">
                    <Card.Body className="p-4">
                        <Card.Title as="h2" className="h5 mb-3">
                            Email address
                        </Card.Title>
                        <p className="text-muted mb-4">
                            Supabase may require you to confirm the new address
                            by email before it takes effect.
                        </p>
                        <Form onSubmit={updateEmail}>
                            {emailError && (
                                <Alert variant="danger" role="alert">
                                    {emailError}
                                </Alert>
                            )}
                            {emailMessage && (
                                <Alert variant="success" role="status">
                                    {emailMessage}
                                </Alert>
                            )}
                            <Form.Group className="mb-3" controlId="account-email">
                                <Form.Label>Email</Form.Label>
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
                                {emailBusy ? "Saving…" : "Update email"}
                            </Button>
                        </Form>
                    </Card.Body>
                </Card>

                <Card className="shadow-sm">
                    <Card.Body className="p-4">
                        <Card.Title as="h2" className="h5 mb-3">
                            Password
                        </Card.Title>
                        <Form onSubmit={updatePassword}>
                            {passwordError && (
                                <Alert variant="danger" role="alert">
                                    {passwordError}
                                </Alert>
                            )}
                            {passwordMessage && (
                                <Alert variant="success" role="status">
                                    {passwordMessage}
                                </Alert>
                            )}
                            <Form.Group
                                className="mb-3"
                                controlId="account-password"
                            >
                                <Form.Label>New password</Form.Label>
                                <Form.Control
                                    type="password"
                                    name="password"
                                    autoComplete="new-password"
                                    minLength={MIN_PASSWORD_LENGTH}
                                    required
                                />
                                <Form.Text muted>
                                    At least {MIN_PASSWORD_LENGTH} characters.
                                </Form.Text>
                            </Form.Group>
                            <Form.Group
                                className="mb-4"
                                controlId="account-password-confirm"
                            >
                                <Form.Label>Confirm new password</Form.Label>
                                <Form.Control
                                    type="password"
                                    name="confirm"
                                    autoComplete="new-password"
                                    required
                                />
                            </Form.Group>
                            <Button type="submit" disabled={passwordBusy}>
                                {passwordBusy ? "Saving…" : "Update password"}
                            </Button>
                        </Form>
                    </Card.Body>
                </Card>
            </main>
        </Container>
    );
}

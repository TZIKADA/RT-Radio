import { useState, type SubmitEvent } from "react";
import { Link, Navigate } from "react-router";
import { Alert, Button, Form } from "react-bootstrap";
import AuthCard from "../components/AuthCard";
import { useAuth } from "../scripts/useAuth";
import { supabase } from "../lib/supabase";
import { MIN_PASSWORD_LENGTH } from "../scripts/auth";

export default function SignUp() {
    const { session, loading } = useAuth();
    const [error, setError] = useState<string | null>(null);
    const [busy, setBusy] = useState(false);
    const [confirmEmail, setConfirmEmail] = useState<string | null>(null);

    // Signed-in users (including right after a successful sign-up when email
    // confirmation is turned off) go straight home.
    if (loading) return null;
    if (session) return <Navigate to="/" replace />;

    async function handleSubmit(e: SubmitEvent<HTMLFormElement>) {
        e.preventDefault();
        setError(null);

        const form = new FormData(e.currentTarget);
        const text = (key: string) => String(form.get(key) ?? "").trim();
        const email = text("email");
        const password = String(form.get("password") ?? "");

        if (password !== String(form.get("confirm") ?? "")) {
            setError("Passwords do not match.");
            return;
        }

        setBusy(true);
        const { data, error: signUpError } = await supabase.auth.signUp({
            email,
            password,
            options: {
                emailRedirectTo: `${window.location.origin}/`,
                // Stored in user.user_metadata
                data: {
                    name: text("name"),
                    quest: text("quest"),
                    colour: text("colour"),
                    phone: text("phone") || null,
                },
            },
        });

        if (signUpError) {
            setError(signUpError.message);
            setBusy(false);
            return;
        }

        // With email confirmation on, Supabase doesn't return an error for an
        // address that is already registered; it returns a user with no identities.
        if (data.user?.identities?.length === 0) {
            setError("An account with this email already exists.");
            setBusy(false);
            return;
        }

        // Confirmation off: data.session is set, the auth context updates and
        // the <Navigate> above sends the user home.
        // Confirmation on: no session yet, so tell the user to check their email.
        if (!data.session) {
            setConfirmEmail(email);
            setBusy(false);
        }
    }

    if (confirmEmail) {
        return (
            <AuthCard title="Check your email" width="32rem">
                <Alert variant="success">
                    We sent a confirmation link to{" "}
                    <strong>{confirmEmail}</strong>. Open it to activate your
                    account, then log in.
                </Alert>
                <div className="d-grid">
                    <Link to="/login" className="btn btn-outline-secondary">
                        Back to Login
                    </Link>
                </div>
            </AuthCard>
        );
    }

    return (
        <AuthCard title="Sign Up" width="32rem">
            <Form onSubmit={handleSubmit}>
                {error && <Alert variant="danger">{error}</Alert>}

                <Form.Group className="mb-3" controlId="email">
                    <Form.Label>Email Address</Form.Label>
                    <Form.Control
                        type="email"
                        name="email"
                        placeholder="yourmail@example.com"
                        autoComplete="email"
                        required
                    />
                </Form.Group>

                <Form.Group className="mb-3" controlId="password">
                    <Form.Label>Password</Form.Label>
                    <Form.Control
                        type="password"
                        name="password"
                        placeholder="Enter password"
                        autoComplete="new-password"
                        minLength={MIN_PASSWORD_LENGTH}
                        required
                    />
                    <Form.Text muted>
                        At least {MIN_PASSWORD_LENGTH} characters.
                    </Form.Text>
                </Form.Group>

                <Form.Group className="mb-3" controlId="confirm">
                    <Form.Label>Confirm password</Form.Label>
                    <Form.Control
                        type="password"
                        name="confirm"
                        placeholder="Repeat password"
                        autoComplete="new-password"
                        required
                    />
                </Form.Group>

                <hr className="mb-4" />

                <Form.Group className="mb-4" controlId="phone">
                    <Form.Label>Phone Number (optional)</Form.Label>
                    <Form.Control
                        type="tel"
                        name="phone"
                        placeholder="Enter phone number"
                        autoComplete="tel"
                    />
                </Form.Group>

                <div className="d-grid gap-2">
                    <Button type="submit" variant="primary" disabled={busy}>
                        {busy ? "Creating account…" : "Sign Up"}
                    </Button>
                    <Link
                        to="/login"
                        className="btn btn-outline-secondary text-center"
                    >
                        Back to Login
                    </Link>
                </div>
            </Form>
        </AuthCard>
    );
}

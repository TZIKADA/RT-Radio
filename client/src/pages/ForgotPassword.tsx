import { useState, type SubmitEvent } from "react";
import { Link } from "react-router";
import { Alert, Button, Form } from "react-bootstrap";
import AuthCard from "../components/AuthCard";
import { supabase } from "../lib/supabase";

export default function ForgotPassword() {
    const [email, setEmail] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [busy, setBusy] = useState(false);
    const [sent, setSent] = useState(false);

    async function handleSubmit(e: SubmitEvent<HTMLFormElement>) {
        e.preventDefault();
        setBusy(true);
        setError(null);

        const { error: resetError } = await supabase.auth.resetPasswordForEmail(
            email,
            { redirectTo: `${window.location.origin}/reset-password` },
        );

        setBusy(false);
        if (resetError) {
            setError(resetError.message);
            return;
        }
        setSent(true);
    }

    return (
        <AuthCard title="Forgot password">
            {sent ? (
                <>
                    <Alert variant="success">
                        If an account exists for <strong>{email}</strong>, we
                        sent a link to reset your password. Check your inbox
                        (and spam folder).
                    </Alert>
                    <div className="d-grid">
                        <Link to="/login" className="btn btn-outline-secondary">
                            Back to Login
                        </Link>
                    </div>
                </>
            ) : (
                <Form onSubmit={handleSubmit}>
                    <p className="text-body-secondary">
                        Enter your email and we'll send you a link to choose a
                        new password.
                    </p>

                    {error && <Alert variant="danger">{error}</Alert>}

                    <Form.Group className="mb-4" controlId="email">
                        <Form.Label>Email</Form.Label>
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
                            {busy ? "Sending…" : "Send reset link"}
                        </Button>
                        <Link to="/login" className="btn btn-outline-secondary">
                            Back to Login
                        </Link>
                    </div>
                </Form>
            )}
        </AuthCard>
    );
}

import { useState, type SubmitEvent } from "react";
import { Link, useNavigate } from "react-router";
import { Alert, Button, Form } from "react-bootstrap";
import AuthCard from "../components/AuthCard";
import { useAuth } from "../scripts/useAuth";
import { supabase } from "../lib/supabase";

import { MIN_PASSWORD_LENGTH } from "../scripts/auth";

export default function ResetPassword() {
    // Opening the emailed link makes supabase-js create a temporary session,
    // so "has a session" means "the link was valid".
    const { session, loading } = useAuth();
    const navigate = useNavigate();
    const [password, setPassword] = useState("");
    const [confirm, setConfirm] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [busy, setBusy] = useState(false);

    if (loading) return null;

    if (!session) {
        return (
            <AuthCard title="Reset password">
                <Alert variant="warning">
                    This reset link is invalid or has expired.
                </Alert>
                <div className="d-grid gap-2">
                    <Link to="/forgot-password" className="btn btn-primary">
                        Request a new link
                    </Link>
                    <Link to="/login" className="btn btn-outline-secondary">
                        Back to Login
                    </Link>
                </div>
            </AuthCard>
        );
    }

    async function handleSubmit(e: SubmitEvent<HTMLFormElement>) {
        e.preventDefault();
        setError(null);

        if (password !== confirm) {
            setError("Passwords do not match.");
            return;
        }

        setBusy(true);
        const { error: updateError } = await supabase.auth.updateUser({
            password,
        });

        if (updateError) {
            setError(updateError.message);
            setBusy(false);
            return;
        }
        navigate("/", { replace: true }); // already signed in by the reset link
    }

    return (
        <AuthCard title="Reset password">
            <Form onSubmit={handleSubmit}>
                {error && <Alert variant="danger">{error}</Alert>}

                <Form.Group className="mb-3" controlId="password">
                    <Form.Label>New password</Form.Label>
                    <Form.Control
                        type="password"
                        placeholder="Enter new password"
                        autoComplete="new-password"
                        minLength={MIN_PASSWORD_LENGTH}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                    />
                    <Form.Text muted>
                        At least {MIN_PASSWORD_LENGTH} characters.
                    </Form.Text>
                </Form.Group>

                <Form.Group className="mb-4" controlId="confirm">
                    <Form.Label>Confirm new password</Form.Label>
                    <Form.Control
                        type="password"
                        placeholder="Repeat new password"
                        autoComplete="new-password"
                        value={confirm}
                        onChange={(e) => setConfirm(e.target.value)}
                        required
                    />
                </Form.Group>

                <div className="d-grid">
                    <Button type="submit" variant="primary" disabled={busy}>
                        {busy ? "Saving…" : "Set new password"}
                    </Button>
                </div>
            </Form>
        </AuthCard>
    );
}

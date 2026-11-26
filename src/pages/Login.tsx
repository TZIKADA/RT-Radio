import { useState, type SubmitEvent } from "react";
import { Link, Navigate } from "react-router";
import { Alert, Button, Form } from "react-bootstrap";
import AuthCard from "../components/AuthCard";
import { useAuth } from "../scripts/useAuth";
import { supabase } from "../lib/supabase";

export default function Login() {
    const { session, loading } = useAuth();
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

        const { error: signInError } = await supabase.auth.signInWithPassword({
            email,
            password,
        });

        if (signInError) {
            setError(signInError.message);
            setBusy(false);
        }
    }

    return (
        <AuthCard title="RT-Radio">
            <Form onSubmit={handleSubmit}>
                {error && <Alert variant="danger">{error}</Alert>}

                <Form.Group className="mb-3" controlId="email">
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

                <Form.Group className="mb-2" controlId="password">
                    <Form.Label>Password</Form.Label>
                    <Form.Control
                        type="password"
                        placeholder="Enter password"
                        autoComplete="current-password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                    />
                </Form.Group>

                <div className="text-end mb-4">
                    <Link to="/forgot-password" className="small">
                        Forgot your password?
                    </Link>
                </div>

                <div className="d-grid gap-2">
                    <Button type="submit" variant="primary" disabled={busy}>
                        {busy ? "Logging in…" : "Login"}
                    </Button>
                    <Link to="/sign-up" className="btn btn-outline-secondary">
                        Sign Up
                    </Link>
                </div>
            </Form>
        </AuthCard>
    );
}

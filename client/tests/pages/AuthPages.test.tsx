import { act, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { Session } from "@supabase/supabase-js";
import { MemoryRouter, Route, Routes } from "react-router";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AuthContext } from "../../src/scripts/auth-context";

const supabaseMocks = vi.hoisted(() => ({
    signInWithPassword: vi.fn(),
    signUp: vi.fn(),
    resetPasswordForEmail: vi.fn(),
    updateUser: vi.fn(),
    getSession: vi.fn(),
    onAuthStateChange: vi.fn(),
    unsubscribe: vi.fn(),
}));

vi.mock("../../src/lib/supabase", () => ({
    supabase: {
        auth: {
            signInWithPassword: supabaseMocks.signInWithPassword,
            signUp: supabaseMocks.signUp,
            resetPasswordForEmail: supabaseMocks.resetPasswordForEmail,
            updateUser: supabaseMocks.updateUser,
            getSession: supabaseMocks.getSession,
            onAuthStateChange: supabaseMocks.onAuthStateChange,
        },
    },
}));

import AuthProvider from "../../src/components/AuthProvider";
import ForgotPassword from "../../src/pages/ForgotPassword";
import Login from "../../src/pages/Login";
import ResetPassword from "../../src/pages/ResetPassword";
import SignUp from "../../src/pages/SignUp";

function renderWithAuth(
    page: React.ReactNode,
    session: Session | null = null,
    initialEntry = "/page",
    loading = false,
) {
    return render(
        <AuthContext.Provider value={{ session, loading, authError: false }}>
            <MemoryRouter initialEntries={[initialEntry]}>
                <Routes>
                    <Route path={initialEntry} element={page} />
                    <Route path="/" element={<p>Home page</p>} />
                </Routes>
            </MemoryRouter>
        </AuthContext.Provider>,
    );
}

function renderWithAuthProvider(page: React.ReactNode, initialEntry: string) {
    return render(
        <MemoryRouter initialEntries={[initialEntry]}>
            <AuthProvider>
                <Routes>
                    <Route path={initialEntry} element={page} />
                    <Route path="/" element={<p>Home page</p>} />
                </Routes>
            </AuthProvider>
        </MemoryRouter>,
    );
}

function emitAuthChange(session: Session) {
    const listener = supabaseMocks.onAuthStateChange.mock.calls[0][0] as (
        event: string,
        session: Session | null,
    ) => void;
    act(() => listener("SIGNED_IN", session));
}

beforeEach(() => {
    supabaseMocks.getSession.mockResolvedValue({ data: { session: null } });
    supabaseMocks.onAuthStateChange.mockReturnValue({
        data: { subscription: { unsubscribe: supabaseMocks.unsubscribe } },
    });
});

afterEach(() => {
    vi.restoreAllMocks();
});

describe("Login", () => {
    it("submits credentials and displays authentication errors", async () => {
        const user = userEvent.setup();
        const consoleError = vi
            .spyOn(console, "error")
            .mockImplementation(() => {});
        supabaseMocks.signInWithPassword.mockResolvedValue({
            error: { message: "Invalid credentials" },
        });
        renderWithAuth(<Login />);

        await user.type(screen.getByLabelText("Email"), "user@example.com");
        await user.type(screen.getByLabelText("Password"), "password123");
        await user.click(screen.getByRole("button", { name: "Login" }));

        expect(supabaseMocks.signInWithPassword).toHaveBeenCalledWith({
            email: "user@example.com",
            password: "password123",
        });
        expect(await screen.findByRole("alert")).toHaveTextContent(
            "We couldn't sign you in. Check your details and try again.",
        );
        expect(await screen.findByRole("alert")).toHaveTextContent(
            "If the issue persists, contact the site administrator.",
        );
        expect(consoleError).toHaveBeenCalledWith(
            "[RT-Radio] Signing in failed",
            { message: "Invalid credentials" },
        );
        expect(screen.getByRole("button", { name: "Login" })).toBeEnabled();
    });

    it("handles rejected sign-in requests without exposing the error details", async () => {
        const user = userEvent.setup();
        const consoleError = vi
            .spyOn(console, "error")
            .mockImplementation(() => {});
        const requestError = new Error("Network timeout");
        supabaseMocks.signInWithPassword.mockRejectedValue(requestError);
        renderWithAuth(<Login />);

        await user.type(screen.getByLabelText("Email"), "user@example.com");
        await user.type(screen.getByLabelText("Password"), "password123");
        await user.click(screen.getByRole("button", { name: "Login" }));

        expect(await screen.findByRole("alert")).toHaveTextContent(
            "We couldn't sign you in.",
        );
        expect(await screen.findByRole("alert")).not.toHaveTextContent(
            "Network timeout",
        );
        expect(consoleError).toHaveBeenCalledWith(
            "[RT-Radio] Signing in failed",
            requestError,
        );
        expect(screen.getByRole("button", { name: "Login" })).toBeEnabled();
    });

    it("waits for auth loading before rendering", () => {
        renderWithAuth(<Login />, null, "/login", true);

        expect(screen.queryByRole("button", { name: "Login" })).toBeNull();
    });

    it("redirects an existing session to the home page", async () => {
        renderWithAuth(<Login />, {} as Session, "/login");

        expect(await screen.findByText("Home page")).toBeInTheDocument();
    });

    it("redirects after Supabase reports a successful sign-in", async () => {
        const user = userEvent.setup();
        supabaseMocks.signInWithPassword.mockResolvedValue({ error: null });
        renderWithAuthProvider(<Login />, "/login");

        await screen.findByRole("button", { name: "Login" });
        await user.type(screen.getByLabelText("Email"), "user@example.com");
        await user.type(screen.getByLabelText("Password"), "password123");
        await user.click(screen.getByRole("button", { name: "Login" }));
        emitAuthChange({} as Session);

        expect(await screen.findByText("Home page")).toBeInTheDocument();
    });
});

describe("SignUp", () => {
    it("rejects mismatched passwords without sending a request", async () => {
        const user = userEvent.setup();
        renderWithAuth(<SignUp />);

        await user.type(
            screen.getByLabelText("Email Address"),
            "new@example.com",
        );
        await user.type(screen.getByLabelText("Password"), "password123");
        await user.type(
            screen.getByLabelText("Confirm password"),
            "different123",
        );
        await user.click(screen.getByRole("button", { name: "Sign Up" }));

        expect(screen.getByText("Passwords do not match.")).toBeInTheDocument();
        expect(supabaseMocks.signUp).not.toHaveBeenCalled();
    });

    it("sends trimmed profile data and shows the confirmation state", async () => {
        const user = userEvent.setup();
        supabaseMocks.signUp.mockResolvedValue({
            data: {
                user: { identities: [{ identity_id: "identity-1" }] },
                session: null,
            },
            error: null,
        });
        renderWithAuth(<SignUp />);

        await user.type(
            screen.getByLabelText("Email Address"),
            "new@example.com",
        );
        await user.type(screen.getByLabelText("Password"), "password123");
        await user.type(
            screen.getByLabelText("Confirm password"),
            "password123",
        );
        await user.type(screen.getByLabelText("Phone Number (optional)"), " ");
        await user.click(screen.getByRole("button", { name: "Sign Up" }));

        await waitFor(() =>
            expect(supabaseMocks.signUp).toHaveBeenCalledWith({
                email: "new@example.com",
                password: "password123",
                options: {
                    emailRedirectTo: `${window.location.origin}/`,
                    data: {
                        name: "",
                        quest: "",
                        colour: "",
                        phone: null,
                    },
                },
            }),
        );
        expect(
            await screen.findByText(/We sent a confirmation link to/),
        ).toBeInTheDocument();
        expect(screen.getByText("new@example.com")).toBeInTheDocument();
    });

    it("reports an already registered email", async () => {
        const user = userEvent.setup();
        supabaseMocks.signUp.mockResolvedValue({
            data: { user: { identities: [] }, session: null },
            error: null,
        });
        renderWithAuth(<SignUp />);

        await user.type(
            screen.getByLabelText("Email Address"),
            "existing@example.com",
        );
        await user.type(screen.getByLabelText("Password"), "password123");
        await user.type(
            screen.getByLabelText("Confirm password"),
            "password123",
        );
        await user.click(screen.getByRole("button", { name: "Sign Up" }));

        expect(
            await screen.findByText("An account with this email already exists."),
        ).toBeInTheDocument();
    });

    it("displays Supabase sign-up errors and re-enables the form", async () => {
        const user = userEvent.setup();
        const consoleError = vi
            .spyOn(console, "error")
            .mockImplementation(() => {});
        supabaseMocks.signUp.mockResolvedValue({
            data: { user: null, session: null },
            error: { message: "Sign-up unavailable" },
        });
        renderWithAuth(<SignUp />);

        await user.type(
            screen.getByLabelText("Email Address"),
            "new@example.com",
        );
        await user.type(screen.getByLabelText("Password"), "password123");
        await user.type(
            screen.getByLabelText("Confirm password"),
            "password123",
        );
        await user.click(screen.getByRole("button", { name: "Sign Up" }));

        expect(await screen.findByRole("alert")).toHaveTextContent(
            "We couldn't complete that request. Please try again.",
        );
        expect(
            screen.getByRole("link", { name: "contact the site administrator." }),
        ).toHaveAttribute("href", "/contact.html");
        expect(await screen.findByRole("alert")).not.toHaveTextContent(
            "Sign-up unavailable",
        );
        expect(consoleError).toHaveBeenCalledWith(
            "[RT-Radio] Creating account failed",
            { message: "Sign-up unavailable" },
        );
        expect(screen.getByRole("button", { name: "Sign Up" })).toBeEnabled();
    });

    it("redirects when sign-up creates an active session", async () => {
        const user = userEvent.setup();
        supabaseMocks.signUp.mockResolvedValue({
            data: {
                user: { identities: [{ identity_id: "identity-1" }] },
                session: {} as Session,
            },
            error: null,
        });
        renderWithAuthProvider(<SignUp />, "/sign-up");

        await screen.findByRole("button", { name: "Sign Up" });
        await user.type(
            screen.getByLabelText("Email Address"),
            "new@example.com",
        );
        await user.type(screen.getByLabelText("Password"), "password123");
        await user.type(
            screen.getByLabelText("Confirm password"),
            "password123",
        );
        await user.click(screen.getByRole("button", { name: "Sign Up" }));
        emitAuthChange({} as Session);

        expect(await screen.findByText("Home page")).toBeInTheDocument();
    });
});

describe("ForgotPassword", () => {
    it("requests a reset link and confirms the result", async () => {
        const user = userEvent.setup();
        supabaseMocks.resetPasswordForEmail.mockResolvedValue({ error: null });
        renderWithAuth(<ForgotPassword />);

        await user.type(screen.getByLabelText("Email"), "user@example.com");
        await user.click(
            screen.getByRole("button", { name: "Send reset link" }),
        );

        expect(supabaseMocks.resetPasswordForEmail).toHaveBeenCalledWith(
            "user@example.com",
            { redirectTo: `${window.location.origin}/reset-password` },
        );
        expect(
            await screen.findByText(/If an account exists for/),
        ).toBeInTheDocument();
    });

    it("displays reset request errors", async () => {
        const user = userEvent.setup();
        const consoleError = vi
            .spyOn(console, "error")
            .mockImplementation(() => {});
        supabaseMocks.resetPasswordForEmail.mockResolvedValue({
            error: { message: "Email service unavailable" },
        });
        renderWithAuth(<ForgotPassword />);

        await user.type(screen.getByLabelText("Email"), "user@example.com");
        await user.click(
            screen.getByRole("button", { name: "Send reset link" }),
        );

        expect(await screen.findByRole("alert")).toHaveTextContent(
            "We couldn't complete that request. Please try again.",
        );
        expect(
            screen.getByRole("link", { name: "contact the site administrator." }),
        ).toHaveAttribute("href", "/contact.html");
        expect(consoleError).toHaveBeenCalledWith(
            "[RT-Radio] Requesting password reset failed",
            { message: "Email service unavailable" },
        );
    });
});

describe("ResetPassword", () => {
    it("explains when a reset link has no valid session", () => {
        renderWithAuth(<ResetPassword />);

        expect(
            screen.getByText(
                "This reset link is invalid or expired. Request a new one.",
            ),
        ).toBeInTheDocument();
    });

    it("validates the confirmation and navigates after updating the password", async () => {
        const user = userEvent.setup();
        supabaseMocks.updateUser.mockResolvedValue({ error: null });
        renderWithAuth(<ResetPassword />, {} as Session, "/reset-password");

        await user.type(screen.getByLabelText("New password"), "newpassword");
        await user.type(
            screen.getByLabelText("Confirm new password"),
            "differentpass",
        );
        await user.click(
            screen.getByRole("button", { name: "Set new password" }),
        );
        expect(screen.getByText("Passwords do not match.")).toBeInTheDocument();
        expect(supabaseMocks.updateUser).not.toHaveBeenCalled();

        await user.clear(screen.getByLabelText("Confirm new password"));
        await user.type(
            screen.getByLabelText("Confirm new password"),
            "newpassword",
        );
        await user.click(
            screen.getByRole("button", { name: "Set new password" }),
        );

        expect(supabaseMocks.updateUser).toHaveBeenCalledWith({
            password: "newpassword",
        });
        expect(await screen.findByText("Home page")).toBeInTheDocument();
    });

    it("displays update errors and restores the submit button", async () => {
        const user = userEvent.setup();
        const consoleError = vi
            .spyOn(console, "error")
            .mockImplementation(() => {});
        supabaseMocks.updateUser.mockResolvedValue({
            error: { message: "Password update failed" },
        });
        renderWithAuth(<ResetPassword />, {} as Session, "/reset-password");

        await user.type(screen.getByLabelText("New password"), "newpassword");
        await user.type(
            screen.getByLabelText("Confirm new password"),
            "newpassword",
        );
        await user.click(
            screen.getByRole("button", { name: "Set new password" }),
        );

        expect(await screen.findByRole("alert")).toHaveTextContent(
            "We couldn't complete that request. Please try again.",
        );
        expect(
            screen.getByRole("link", { name: "contact the site administrator." }),
        ).toHaveAttribute("href", "/contact.html");
        expect(consoleError).toHaveBeenCalledWith(
            "[RT-Radio] Resetting password failed",
            { message: "Password update failed" },
        );
        expect(
            screen.getByRole("button", { name: "Set new password" }),
        ).toBeEnabled();
    });

    it("waits for auth loading before showing reset-link status", () => {
        renderWithAuth(<ResetPassword />, null, "/reset-password", true);

        expect(
            screen.queryByText(
                "This reset link is invalid or expired. Request a new one.",
            ),
        ).not.toBeInTheDocument();
        expect(
            screen.queryByRole("button", { name: "Set new password" }),
        ).not.toBeInTheDocument();
    });
});

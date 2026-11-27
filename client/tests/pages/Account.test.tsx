import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { Session } from "@supabase/supabase-js";
import { MemoryRouter } from "react-router";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import Account from "../../src/pages/Account";
import { AuthContext } from "../../src/auth/auth-context";

const supabaseMocks = vi.hoisted(() => ({
    updateUser: vi.fn(),
    signOut: vi.fn(),
    rpc: vi.fn(),
}));

vi.mock("../../src/lib/supabase", () => ({
    supabase: {
        auth: {
            updateUser: supabaseMocks.updateUser,
            signOut: supabaseMocks.signOut,
        },
        rpc: supabaseMocks.rpc,
    },
}));

describe("Account", () => {
    afterEach(() => {
        vi.restoreAllMocks();
    });

    beforeEach(() => {
        supabaseMocks.updateUser.mockResolvedValue({ error: null });
        supabaseMocks.signOut.mockResolvedValue({ error: null });
        supabaseMocks.rpc.mockResolvedValue({ error: null });
    });

    function renderAccount() {
        const session = {
            user: { email: "old@example.com" },
        } as Session;

        return render(
            <AuthContext.Provider
                value={{ session, loading: false, authError: false }}
            >
                <MemoryRouter>
                    <Account />
                </MemoryRouter>
            </AuthContext.Provider>,
        );
    }

    it("updates the account email and explains the confirmation step", async () => {
        const user = userEvent.setup();
        renderAccount();

        const emailInput = screen.getByLabelText("Email");
        await user.clear(emailInput);
        await user.type(emailInput, "new@example.com");
        await user.click(screen.getByRole("button", { name: "Update email" }));

        expect(supabaseMocks.updateUser).toHaveBeenCalledWith({
            email: "new@example.com",
        });
        expect(
            await screen.findByText(
                "Check your inbox to confirm the email address change.",
            ),
        ).toBeInTheDocument();
    });

    it("does not submit an unchanged email address", async () => {
        const user = userEvent.setup();
        renderAccount();

        await user.click(screen.getByRole("button", { name: "Update email" }));

        expect(supabaseMocks.updateUser).not.toHaveBeenCalled();
        expect(
            await screen.findByText("That is already the email on your account."),
        ).toBeInTheDocument();
    });

    it("validates password confirmation and updates the password", async () => {
        const user = userEvent.setup();
        renderAccount();

        await user.type(screen.getByLabelText("New password"), "newpassword");
        await user.type(
            screen.getByLabelText("Confirm new password"),
            "different",
        );
        await user.click(
            screen.getByRole("button", { name: "Update password" }),
        );

        expect(screen.getByText("Passwords do not match.")).toBeInTheDocument();
        expect(supabaseMocks.updateUser).not.toHaveBeenCalled();

        await user.clear(screen.getByLabelText("Confirm new password"));
        await user.type(
            screen.getByLabelText("Confirm new password"),
            "newpassword",
        );
        await user.click(
            screen.getByRole("button", { name: "Update password" }),
        );

        expect(supabaseMocks.updateUser).toHaveBeenCalledWith({
            password: "newpassword",
        });
        expect(
            await screen.findByText("Your password has been updated."),
        ).toBeInTheDocument();
    });

    it("displays Supabase errors when credential updates fail", async () => {
        const user = userEvent.setup();
        const consoleError = vi
            .spyOn(console, "error")
            .mockImplementation(() => {});
        const updateError = new Error("Email update failed");
        supabaseMocks.updateUser.mockResolvedValue({
            error: updateError,
        });
        renderAccount();

        const emailInput = screen.getByLabelText("Email");
        await user.clear(emailInput);
        await user.type(emailInput, "new@example.com");
        await user.click(screen.getByRole("button", { name: "Update email" }));

        expect(await screen.findByRole("alert")).toHaveTextContent(
            "We couldn't complete that request. Please try again.",
        );
        expect(
            screen.getByRole("link", { name: "contact the site administrator." }),
        ).toHaveAttribute("href", "/contact");
        expect(await screen.findByRole("alert")).not.toHaveTextContent(
            "Email update failed",
        );
        expect(consoleError).toHaveBeenCalledWith(
            "[RT-Radio] Updating account email failed",
            updateError,
        );
    });

    it("shows a support link when a password update fails", async () => {
        const user = userEvent.setup();
        const consoleError = vi
            .spyOn(console, "error")
            .mockImplementation(() => {});
        const updateError = new Error("Password update failed");
        supabaseMocks.updateUser.mockResolvedValue({ error: updateError });
        renderAccount();

        await user.type(screen.getByLabelText("New password"), "newpassword");
        await user.type(
            screen.getByLabelText("Confirm new password"),
            "newpassword",
        );
        await user.click(
            screen.getByRole("button", { name: "Update password" }),
        );

        expect(await screen.findByRole("alert")).toHaveTextContent(
            "We couldn't complete that request. Please try again.",
        );
        expect(
            screen.getByRole("link", { name: "contact the site administrator." }),
        ).toHaveAttribute("href", "/contact");
        expect(consoleError).toHaveBeenCalledWith(
            "[RT-Radio] Updating account password failed",
            updateError,
        );
    });
    it("signs out of the current device", async () => {
        const user = userEvent.setup();
        renderAccount();

        await user.click(screen.getByRole("button", { name: "Sign out" }));

        expect(supabaseMocks.signOut).toHaveBeenCalledWith({ scope: "local" });
    });

    it("shows an error when signing out fails", async () => {
        const user = userEvent.setup();
        supabaseMocks.signOut.mockResolvedValue({
            error: new Error("network"),
        });
        vi.spyOn(console, "error").mockImplementation(() => {});
        renderAccount();

        await user.click(screen.getByRole("button", { name: "Sign out" }));

        expect(await screen.findByRole("alert")).toHaveTextContent(
            "We couldn't complete that request.",
        );
    });

    it("asks for confirmation before deleting the account", async () => {
        const user = userEvent.setup();
        renderAccount();

        await user.click(
            screen.getByRole("button", { name: "Delete account" }),
        );

        expect(supabaseMocks.rpc).not.toHaveBeenCalled();
        expect(
            screen.getByText(
                "Delete your account permanently? This can't be undone.",
            ),
        ).toBeInTheDocument();

        await user.click(screen.getByRole("button", { name: "Cancel" }));

        expect(supabaseMocks.rpc).not.toHaveBeenCalled();
        expect(
            screen.queryByText(
                "Delete your account permanently? This can't be undone.",
            ),
        ).not.toBeInTheDocument();
    });

    it("deletes the account and clears the local session", async () => {
        const user = userEvent.setup();
        renderAccount();

        await user.click(
            screen.getByRole("button", { name: "Delete account" }),
        );
        await user.click(
            screen.getByRole("button", { name: "Delete account" }),
        );

        expect(supabaseMocks.rpc).toHaveBeenCalledWith("delete_own_account");
        await vi.waitFor(() =>
            expect(supabaseMocks.signOut).toHaveBeenCalledWith({
                scope: "local",
            }),
        );
    });

    it("keeps the session and shows an error when deletion fails", async () => {
        const user = userEvent.setup();
        supabaseMocks.rpc.mockResolvedValue({ error: new Error("denied") });
        vi.spyOn(console, "error").mockImplementation(() => {});
        renderAccount();

        await user.click(
            screen.getByRole("button", { name: "Delete account" }),
        );
        await user.click(
            screen.getByRole("button", { name: "Delete account" }),
        );

        expect(await screen.findByRole("alert")).toHaveTextContent(
            "We couldn't complete that request.",
        );
        expect(supabaseMocks.signOut).not.toHaveBeenCalled();
    });
});

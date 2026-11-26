import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { Session } from "@supabase/supabase-js";
import { MemoryRouter } from "react-router";
import { beforeEach, describe, expect, it, vi } from "vitest";
import Account from "../../src/pages/Account";
import { AuthContext } from "../../src/scripts/auth-context";

const supabaseMocks = vi.hoisted(() => ({
    updateUser: vi.fn(),
}));

vi.mock("../../src/lib/supabase", () => ({
    supabase: { auth: { updateUser: supabaseMocks.updateUser } },
}));

describe("Account", () => {
    beforeEach(() => {
        supabaseMocks.updateUser.mockResolvedValue({ error: null });
    });

    function renderAccount() {
        const session = {
            user: { email: "old@example.com" },
        } as Session;

        return render(
            <AuthContext.Provider value={{ session, loading: false }}>
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
        supabaseMocks.updateUser.mockResolvedValue({
            error: new Error("Email update failed"),
        });
        renderAccount();

        const emailInput = screen.getByLabelText("Email");
        await user.clear(emailInput);
        await user.type(emailInput, "new@example.com");
        await user.click(screen.getByRole("button", { name: "Update email" }));

        expect(await screen.findByRole("alert")).toHaveTextContent(
            "Email update failed",
        );
    });
});

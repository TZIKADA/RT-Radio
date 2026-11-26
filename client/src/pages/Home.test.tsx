import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

const supabaseMocks = vi.hoisted(() => ({
    from: vi.fn(),
    select: vi.fn(),
}));

vi.mock("../lib/supabase", () => ({
    supabase: { from: supabaseMocks.from },
}));

import Home from "./Home";

describe("Home", () => {
    beforeEach(() => {
        supabaseMocks.from.mockReturnValue({ select: supabaseMocks.select });
        supabaseMocks.select.mockResolvedValue({ data: [], error: null });
    });

    it("loads and displays todos, and shows the documentation dialog", async () => {
        const user = userEvent.setup();
        supabaseMocks.select.mockResolvedValue({
            data: [
                { id: 1, name: "Tune the radio" },
                { id: 2, name: "Install the header" },
            ],
            error: null,
        });
        render(<Home />);

        expect(screen.getByText("Loading…")).toBeInTheDocument();
        expect(await screen.findByText("Tune the radio")).toBeInTheDocument();
        expect(screen.getByText("Install the header")).toBeInTheDocument();
        expect(supabaseMocks.from).toHaveBeenCalledWith("todos");
        expect(supabaseMocks.select).toHaveBeenCalledOnce();

        await user.click(screen.getByRole("button", { name: "Documentation" }));
        expect(
            screen.getByRole("heading", { name: "Documentation" }),
        ).toBeInTheDocument();
        await user.click(
            within(screen.getByRole("dialog"))
                .getAllByRole("button", { name: "Close" })
                .at(-1)!,
        );
        await waitFor(() =>
            expect(
                screen.queryByRole("heading", { name: "Documentation" }),
            ).not.toBeInTheDocument(),
        );
    });

    it("shows an empty state when there are no todos", async () => {
        render(<Home />);

        expect(await screen.findByText("No todos yet.")).toBeInTheDocument();
    });

    it("shows a clear error state when loading todos fails", async () => {
        const consoleError = vi
            .spyOn(console, "error")
            .mockImplementation(() => {});
        supabaseMocks.select.mockResolvedValue({
            data: null,
            error: { message: "Database unavailable" },
        });
        render(<Home />);

        expect(
            await screen.findByText("Failed to load todos: Database unavailable"),
        ).toBeInTheDocument();
        expect(consoleError).toHaveBeenCalledOnce();
    });
});

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { MemoryRouter } from "react-router";

const supabaseMocks = vi.hoisted(() => ({
    from: vi.fn(),
    assignmentsSelect: vi.fn(),
    headersSelect: vi.fn(),
    headersIn: vi.fn(),
    headersOrder: vi.fn(),
    storageFrom: vi.fn(),
    createSignedUrl: vi.fn(),
}));

vi.mock("../../src/lib/supabase", () => ({
    supabase: {
        from: supabaseMocks.from,
        storage: { from: supabaseMocks.storageFrom },
    },
}));

import Home from "../../src/pages/Home";

describe("Home", () => {
    beforeEach(() => {
        const headersQuery = {
            select: supabaseMocks.headersSelect,
            in: supabaseMocks.headersIn,
            order: supabaseMocks.headersOrder,
        };
        supabaseMocks.from.mockImplementation((table: string) =>
            table === "user_headers"
                ? { select: supabaseMocks.assignmentsSelect }
                : headersQuery,
        );
        supabaseMocks.assignmentsSelect.mockResolvedValue({
            data: [],
            error: null,
        });
        supabaseMocks.headersSelect.mockReturnValue(headersQuery);
        supabaseMocks.headersIn.mockReturnValue(headersQuery);
        supabaseMocks.headersOrder.mockResolvedValue({
            data: [],
            error: null,
        });
        supabaseMocks.storageFrom.mockReturnValue({
            createSignedUrl: supabaseMocks.createSignedUrl,
        });
    });

    function renderHome() {
        return render(
            <MemoryRouter>
                <Home />
            </MemoryRouter>,
        );
    }

    it("loads assigned headers and displays their download cards", async () => {
        supabaseMocks.assignmentsSelect.mockResolvedValue({
            data: [{ header_id: "header-1" }, { header_id: "header-2" }],
            error: null,
        });
        supabaseMocks.headersOrder.mockResolvedValue({
            data: [
                {
                    id: "header-1",
                    name: "Main Header File",
                    description: "Primary header",
                    storage_path: "main/header.zip",
                },
                {
                    id: "header-2",
                    name: "Alternate Header",
                    description: null,
                    storage_path: "alternate/header.zip",
                },
            ],
            error: null,
        });
        renderHome();

        expect(
            await screen.findByRole("heading", { name: "Main Header File" }),
        ).toBeInTheDocument();
        expect(
            screen.getByRole("heading", { name: "Alternate Header" }),
        ).toBeInTheDocument();
        expect(screen.getByText("Primary header")).toBeInTheDocument();
        expect(supabaseMocks.from).toHaveBeenNthCalledWith(1, "user_headers");
        expect(supabaseMocks.assignmentsSelect).toHaveBeenCalledWith(
            "header_id",
        );
        expect(supabaseMocks.from).toHaveBeenNthCalledWith(2, "headers");
        expect(supabaseMocks.headersSelect).toHaveBeenCalledWith(
            "id,name,description,storage_path",
        );
        expect(supabaseMocks.headersIn).toHaveBeenCalledWith("id", [
            "header-1",
            "header-2",
        ]);
        expect(
            screen.getAllByRole("button", { name: "Download" }),
        ).toHaveLength(2);
    });

    it("does not fetch header rows when the user has no assignments", async () => {
        renderHome();

        expect(
            await screen.findByText(
                "No downloadable headers are assigned to your account yet. Ask an administrator to add them to your user_headers list.",
            ),
        ).toBeInTheDocument();
        expect(supabaseMocks.from).toHaveBeenCalledOnce();
    });

    it("shows a clear error state when assignments cannot be loaded", async () => {
        const consoleError = vi
            .spyOn(console, "error")
            .mockImplementation(() => {});
        supabaseMocks.assignmentsSelect.mockResolvedValue({
            data: null,
            error: {
                code: "PGRST116",
                message: "Database unavailable",
            },
        });
        renderHome();

        expect(
            await screen.findByText(
                "Failed to load headers: Database unavailable",
            ),
        ).toBeInTheDocument();
        expect(consoleError).toHaveBeenCalledOnce();
        consoleError.mockRestore();
    });

    it("shows errors when a private file cannot be signed", async () => {
        const user = userEvent.setup();
        const consoleError = vi
            .spyOn(console, "error")
            .mockImplementation(() => {});
        supabaseMocks.assignmentsSelect.mockResolvedValue({
            data: [{ header_id: "header-1" }],
            error: null,
        });
        supabaseMocks.headersOrder.mockResolvedValue({
            data: [
                {
                    id: "header-1",
                    name: "Main Header File",
                    description: null,
                    storage_path: "main/header.zip",
                },
            ],
            error: null,
        });
        supabaseMocks.createSignedUrl.mockResolvedValue({
            data: null,
            error: { message: "Storage unavailable" },
        });
        renderHome();

        await user.click(
            await screen.findByRole("button", { name: "Download" }),
        );

        expect(await screen.findByRole("alert")).toHaveTextContent(
            "Storage unavailable",
        );
        expect(supabaseMocks.storageFrom).toHaveBeenCalledWith("headers");
        expect(supabaseMocks.createSignedUrl).toHaveBeenCalledWith(
            "main/header.zip",
            60,
            { download: true },
        );
        expect(consoleError).toHaveBeenCalledOnce();
        consoleError.mockRestore();
    });
});

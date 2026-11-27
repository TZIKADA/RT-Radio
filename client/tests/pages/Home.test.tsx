import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { MemoryRouter } from "react-router";

const supabaseMocks = vi.hoisted(() => ({
    from: vi.fn(),
    assignmentsSelect: vi.fn(),
    headersSelect: vi.fn(),
    headersIn: vi.fn(),
    githubFetch: vi.fn(),
}));

vi.mock("../../src/lib/supabase", () => ({
    supabase: { from: supabaseMocks.from },
}));

import Home from "../../src/pages/Home";

const API_URL = "https://api.github.com/repos/example/main-header/releases/latest";

function releaseResponse(overrides: Record<string, unknown> = {}) {
    return {
        ok: true,
        status: 200,
        json: async () => ({
            name: "Main Header Release",
            tag_name: "v1.2.0",
            body: "Fixes\n- updates the main header",
            published_at: "2025-03-01T10:00:00Z",
            zipball_url:
                "https://api.github.com/repos/example/main-header/zipball/v1.2.0",
            assets: [
                {
                    name: "main-header.bin",
                    size: 2048,
                    content_type: "application/octet-stream",
                    browser_download_url:
                        "https://github.com/example/main-header/releases/download/v1.2.0/main-header.bin",
                },
            ],
            ...overrides,
        }),
    };
}

describe("Home", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.stubGlobal("fetch", supabaseMocks.githubFetch);

        const headersQuery = {
            select: supabaseMocks.headersSelect,
            in: supabaseMocks.headersIn,
        };
        supabaseMocks.from.mockImplementation((table: string) =>
            table === "user_headers"
                ? { select: supabaseMocks.assignmentsSelect }
                : headersQuery,
        );
        supabaseMocks.assignmentsSelect.mockResolvedValue({
            data: [{ header_id: "header-1" }],
            error: null,
        });
        supabaseMocks.headersSelect.mockReturnValue(headersQuery);
        supabaseMocks.headersIn.mockResolvedValue({
            data: [{ id: "header-1", github_api: API_URL }],
            error: null,
        });
        supabaseMocks.githubFetch.mockResolvedValue(releaseResponse());
    });

    afterEach(() => {
        vi.unstubAllGlobals();
        vi.restoreAllMocks();
    });

    function renderHome() {
        return render(
            <MemoryRouter>
                <Home />
            </MemoryRouter>,
        );
    }

    it("loads assigned releases and shows release information and downloads", async () => {
        const user = userEvent.setup();
        supabaseMocks.assignmentsSelect.mockResolvedValue({
            data: [{ header_id: "header-1" }, { header_id: "header-2" }],
            error: null,
        });
        supabaseMocks.headersIn.mockResolvedValue({
            data: [
                { id: "header-1", github_api: API_URL },
                {
                    id: "header-2",
                    github_api:
                        "https://api.github.com/repos/example/alternate/releases/latest",
                },
            ],
            error: null,
        });
        supabaseMocks.githubFetch
            .mockResolvedValueOnce(releaseResponse())
            .mockResolvedValueOnce(
                releaseResponse({
                    name: "Alternate Header Release",
                    tag_name: "v2.0.0",
                    zipball_url:
                        "https://api.github.com/repos/example/alternate/zipball/v2.0.0",
                    assets: [],
                }),
            );
        renderHome();

        expect(
            await screen.findByRole("heading", {
                name: "Main Header Release",
            }),
        ).toBeInTheDocument();
        expect(
            screen.getByRole("heading", { name: "Alternate Header Release" }),
        ).toBeInTheDocument();
        expect(supabaseMocks.from).toHaveBeenNthCalledWith(1, "user_headers");
        expect(supabaseMocks.assignmentsSelect).toHaveBeenCalledWith(
            "header_id",
        );
        expect(supabaseMocks.from).toHaveBeenNthCalledWith(2, "headers");
        expect(supabaseMocks.headersSelect).toHaveBeenCalledWith(
            "id,github_api",
        );
        expect(supabaseMocks.headersIn).toHaveBeenCalledWith("id", [
            "header-1",
            "header-2",
        ]);
        expect(supabaseMocks.githubFetch).toHaveBeenCalledWith(
            new URL(API_URL),
            expect.objectContaining({
                headers: { Accept: "application/vnd.github+json" },
            }),
        );

        const downloadButtons = screen.getAllByRole("button", {
            name: "Download",
        });
        expect(downloadButtons).toHaveLength(2);
        expect(downloadButtons[0]).toHaveAttribute(
            "href",
            "https://api.github.com/repos/example/alternate/zipball/v2.0.0",
        );
        expect(downloadButtons[1]).toHaveAttribute(
            "href",
            "https://api.github.com/repos/example/main-header/zipball/v1.2.0",
        );

        await user.click(
            screen.getByRole("button", {
                name: "Release details: Main Header Release",
            }),
        );
        const dialog = screen.getByRole("dialog");
        expect(within(dialog).getByText(/Fixes[\s\S]+updates the main header/))
            .toBeInTheDocument();
        expect(within(dialog).getByText("v1.2.0")).toBeInTheDocument();
        expect(within(dialog).getByText("main-header.bin")).toBeInTheDocument();
        expect(dialog.querySelector("time")).toHaveAttribute(
            "datetime",
            "2025-03-01T10:00:00Z",
        );
        expect(
            within(dialog).getByRole("link", { name: "Download file" }),
        ).toHaveAttribute(
            "href",
            "https://github.com/example/main-header/releases/download/v1.2.0/main-header.bin",
        );
    });

    it("does not fetch release rows when the user has no assignments", async () => {
        supabaseMocks.assignmentsSelect.mockResolvedValue({
            data: [],
            error: null,
        });
        renderHome();

        expect(
            await screen.findByText(
                "No downloadable headers are assigned to your account yet. Ask an administrator to add them to your user_headers list.",
            ),
        ).toBeInTheDocument();
        expect(supabaseMocks.from).toHaveBeenCalledOnce();
        expect(supabaseMocks.headersIn).not.toHaveBeenCalled();
        expect(supabaseMocks.githubFetch).not.toHaveBeenCalled();
    });

    it("reuses release metadata when assigned headers share an API URL", async () => {
        supabaseMocks.assignmentsSelect.mockResolvedValue({
            data: [{ header_id: "header-1" }, { header_id: "header-2" }],
            error: null,
        });
        supabaseMocks.headersIn.mockResolvedValue({
            data: [
                { id: "header-1", github_api: API_URL },
                { id: "header-2", github_api: API_URL },
            ],
            error: null,
        });
        renderHome();

        expect(
            await screen.findAllByRole("heading", {
                name: "Main Header Release",
            }),
        ).toHaveLength(2);
        expect(supabaseMocks.githubFetch).toHaveBeenCalledOnce();
    });

    it("shows a clear error state when assignments cannot be loaded", async () => {
        const consoleError = vi
            .spyOn(console, "error")
            .mockImplementation(() => {});
        const assignmentError = {
            code: "PGRST116",
            message: "Database unavailable",
        };
        supabaseMocks.assignmentsSelect.mockResolvedValue({
            data: null,
            error: assignmentError,
        });
        renderHome();

        expect(await screen.findByRole("alert")).toHaveTextContent(
            "We couldn't load your files. If the issue persists, contact the site administrator.",
        );
        expect(consoleError).toHaveBeenCalledWith(
            "[RT-Radio] Loading assigned header releases failed",
            assignmentError,
        );
        expect(supabaseMocks.githubFetch).not.toHaveBeenCalled();
    });

    it("shows an error when header records cannot be loaded", async () => {
        const consoleError = vi
            .spyOn(console, "error")
            .mockImplementation(() => {});
        const headersError = {
            code: "PGRST116",
            message: "Header records unavailable",
        };
        supabaseMocks.headersIn.mockResolvedValue({
            data: null,
            error: headersError,
        });
        renderHome();

        expect(await screen.findByRole("alert")).toHaveTextContent(
            "We couldn't load your files.",
        );
        expect(consoleError).toHaveBeenCalledWith(
            "[RT-Radio] Loading assigned header releases failed",
            headersError,
        );
        expect(supabaseMocks.githubFetch).not.toHaveBeenCalled();
    });

    it("treats a missing assignments response as an empty list", async () => {
        supabaseMocks.assignmentsSelect.mockResolvedValue({
            data: null,
            error: null,
        });
        renderHome();

        expect(
            await screen.findByText(
                "No downloadable headers are assigned to your account yet. Ask an administrator to add them to your user_headers list.",
            ),
        ).toBeInTheDocument();
        expect(supabaseMocks.headersIn).not.toHaveBeenCalled();
    });

    it("shows an error when GitHub cannot return a release", async () => {
        const consoleError = vi
            .spyOn(console, "error")
            .mockImplementation(() => {});
        supabaseMocks.githubFetch.mockResolvedValue({
            ok: false,
            status: 403,
        });
        renderHome();

        expect(await screen.findByRole("alert")).toHaveTextContent(
            "We couldn't load your files. If the issue persists, contact the site administrator.",
        );
        expect(consoleError).toHaveBeenCalledWith(
            "[RT-Radio] Loading assigned header releases failed",
            new Error("GitHub API request failed with status 403."),
        );
    });

    it("reports invalid header rows instead of requesting their releases", async () => {
        const consoleError = vi
            .spyOn(console, "error")
            .mockImplementation(() => {});
        supabaseMocks.headersIn.mockResolvedValue({
            data: [{ id: 7, github_api: API_URL }],
            error: null,
        });
        renderHome();

        expect(await screen.findByRole("alert")).toHaveTextContent(
            "We couldn't load your files.",
        );
        expect(consoleError).toHaveBeenCalledWith(
            "[RT-Radio] Loading assigned header releases failed",
            new Error("Assigned header has invalid GitHub release metadata."),
        );
        expect(supabaseMocks.githubFetch).not.toHaveBeenCalled();
    });

    it("shows fallbacks when release notes, dates, and assets are unavailable", async () => {
        const user = userEvent.setup();
        supabaseMocks.githubFetch.mockResolvedValue(
            releaseResponse({
                name: "Bare Header Release",
                body: "   ",
                published_at: "not-a-date",
                assets: [],
            }),
        );
        renderHome();

        await user.click(
            await screen.findByRole("button", {
                name: "Release details: Bare Header Release",
            }),
        );

        const dialog = screen.getByRole("dialog");
        expect(within(dialog).getByText("No release notes were provided."))
            .toBeInTheDocument();
        expect(within(dialog).getByText("No files are attached to this release."))
            .toBeInTheDocument();
        expect(dialog.querySelector("time")).toBeNull();

        await user.click(within(dialog).getByRole("button", { name: "Close" }));
        await waitFor(() =>
            expect(screen.queryByRole("dialog")).not.toBeInTheDocument(),
        );
    });
});

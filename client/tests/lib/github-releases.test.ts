import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { fetchGitHubRelease } from "../../src/lib/github-releases";

const API_URL = "https://api.github.com/repos/example/header/releases/latest";
const TAG_API_URL =
    "https://api.github.com/repos/example/header/releases/tags/default-v1.2.3";

const releasePayload = {
    name: "Header v1",
    tag_name: "v1.0.0",
    body: "First release",
    published_at: "2025-03-01T10:00:00Z",
    zipball_url: "https://api.github.com/repos/example/header/zipball/v1.0.0",
    assets: [
        {
            name: "header.bin",
            size: 128,
            content_type: "application/octet-stream",
            browser_download_url:
                "https://github.com/example/header/releases/download/v1.0.0/header.bin",
        },
    ],
};

const fetchMock = vi.fn();

describe("fetchGitHubRelease", () => {
    beforeEach(() => {
        vi.stubGlobal("fetch", fetchMock);
        fetchMock.mockReset();
    });

    afterEach(() => {
        vi.unstubAllGlobals();
    });

    it("parses release details and asset metadata from the GitHub API", async () => {
        fetchMock.mockResolvedValue({
            ok: true,
            json: async () => releasePayload,
        });

        await expect(fetchGitHubRelease(API_URL)).resolves.toEqual({
            title: "Header v1",
            description: "First release",
            tag: "v1.0.0",
            publishedAt: "2025-03-01T10:00:00Z",
            zipballUrl:
                "https://api.github.com/repos/example/header/zipball/v1.0.0",
            assets: [
                {
                    name: "header.bin",
                    size: 128,
                    contentType: "application/octet-stream",
                    downloadUrl:
                        "https://github.com/example/header/releases/download/v1.0.0/header.bin",
                },
            ],
        });
        expect(fetchMock).toHaveBeenCalledWith(
            new URL(API_URL),
            expect.objectContaining({
                headers: { Accept: "application/vnd.github+json" },
            }),
        );
    });

    it("accepts API URLs for a specific tagged release", async () => {
        fetchMock.mockResolvedValue({
            ok: true,
            json: async () => releasePayload,
        });

        await expect(fetchGitHubRelease(TAG_API_URL)).resolves.toMatchObject({
            tag: "v1.0.0",
        });
        expect(fetchMock).toHaveBeenCalledWith(
            new URL(TAG_API_URL),
            expect.objectContaining({
                headers: { Accept: "application/vnd.github+json" },
            }),
        );
    });

    it("uses the tag as title and handles releases without optional details", async () => {
        fetchMock.mockResolvedValue({
            ok: true,
            json: async () => ({
                ...releasePayload,
                name: " ",
                body: null,
                published_at: null,
                assets: [
                    {
                        name: "empty.bin",
                        size: 0,
                        content_type: null,
                        browser_download_url:
                            "https://codeload.github.com/example/header/empty.bin",
                    },
                ],
            }),
        });

        await expect(fetchGitHubRelease(API_URL)).resolves.toMatchObject({
            title: "v1.0.0",
            description: null,
            publishedAt: null,
            assets: [{ contentType: null, size: 0 }],
        });
    });

    it("removes generated release metadata while preserving the description", async () => {
        fetchMock.mockResolvedValue({
            ok: true,
            json: async () => ({
                ...releasePayload,
                body: "A useful description.\n\n---\n\nCommit: 292ca1c6abad3100a496a9976195d9900a945794\n\nIncluded headers:\n- `hardware/slaves/default/rt-radio-default.h`",
            }),
        });

        await expect(fetchGitHubRelease(API_URL)).resolves.toMatchObject({
            description: "A useful description.",
        });
    });

    it("returns null for release notes containing only generated metadata", async () => {
        fetchMock.mockResolvedValue({
            ok: true,
            json: async () => ({
                ...releasePayload,
                body: "\n\n---\n\nCommit: 292ca1c6abad3100a496a9976195d9900a945794\n\nIncluded headers:\n- `hardware/slaves/default/rt-radio-default.h`",
            }),
        });

        await expect(fetchGitHubRelease(API_URL)).resolves.toMatchObject({
            description: null,
        });
    });

    it("rejects failed responses and malformed release metadata", async () => {
        fetchMock.mockResolvedValueOnce({ ok: false, status: 503 });
        await expect(fetchGitHubRelease(API_URL)).rejects.toThrow(
            "GitHub API request failed with status 503.",
        );

        fetchMock.mockResolvedValueOnce({
            ok: true,
            json: async () => null,
        });
        await expect(fetchGitHubRelease(API_URL)).rejects.toThrow(
            "GitHub API returned invalid release metadata.",
        );

        fetchMock.mockResolvedValueOnce({
            ok: true,
            json: async () => ({
                ...releasePayload,
                assets: [{ ...releasePayload.assets[0], size: -1 }],
            }),
        });
        await expect(fetchGitHubRelease(API_URL)).rejects.toThrow(
            "GitHub release contains invalid asset metadata.",
        );

        fetchMock.mockResolvedValueOnce({
            ok: true,
            json: async () => ({
                ...releasePayload,
                assets: [{ ...releasePayload.assets[0], content_type: 42 }],
            }),
        });
        await expect(fetchGitHubRelease(API_URL)).rejects.toThrow(
            "GitHub release contains invalid asset metadata.",
        );
    });

    it("rejects untrusted asset and archive download URLs", async () => {
        fetchMock.mockResolvedValueOnce({
            ok: true,
            json: async () => ({
                ...releasePayload,
                assets: [
                    {
                        ...releasePayload.assets[0],
                        browser_download_url:
                            "http://github.com/example/header/download",
                    },
                ],
            }),
        });
        await expect(fetchGitHubRelease(API_URL)).rejects.toThrow(
            "GitHub release contains an invalid asset download URL.",
        );

        fetchMock.mockResolvedValueOnce({
            ok: true,
            json: async () => ({
                ...releasePayload,
                assets: [
                    {
                        ...releasePayload.assets[0],
                        browser_download_url: null,
                    },
                ],
            }),
        });
        await expect(fetchGitHubRelease(API_URL)).rejects.toThrow(
            "GitHub release is missing asset download URL.",
        );

        fetchMock.mockResolvedValueOnce({
            ok: true,
            json: async () => ({
                ...releasePayload,
                zipball_url: "https://example.com/archive.zip",
            }),
        });
        await expect(fetchGitHubRelease(API_URL)).rejects.toThrow(
            "GitHub release contains an invalid source archive URL.",
        );
    });

    it("rejects a missing API URL and missing asset download URL", async () => {
        fetchMock.mockResolvedValue({
            ok: true,
            json: async () => ({
                ...releasePayload,
                assets: [
                    {
                        ...releasePayload.assets[0],
                        browser_download_url: null,
                    },
                ],
            }),
        });

        await expect(fetchGitHubRelease(API_URL)).rejects.toThrow(
            "GitHub release is missing asset download URL.",
        );
    });

    it("rejects API URLs that do not point to a supported GitHub release", async () => {
        await expect(
            fetchGitHubRelease("https://example.com/releases/latest"),
        ).rejects.toThrow("Header has an invalid GitHub release API URL.");
        await expect(
            fetchGitHubRelease(
                "https://api.github.com/repos/example/header/releases/tags/v1.2.3",
            ),
        ).rejects.toThrow("Header has an invalid GitHub release API URL.");
        // @ts-expect-error Verify the runtime guard for untyped database input.
        await expect(fetchGitHubRelease(null)).rejects.toThrow(
            "Header is missing its GitHub API URL.",
        );
        expect(fetchMock).not.toHaveBeenCalled();
    });
});

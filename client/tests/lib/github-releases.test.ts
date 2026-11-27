import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { fetchLatestGitHubRelease } from "../../src/lib/github-releases";

const API_URL = "https://api.github.com/repos/example/header/releases/latest";

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

describe("fetchLatestGitHubRelease", () => {
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

        await expect(fetchLatestGitHubRelease(API_URL)).resolves.toEqual({
            title: "Header v1",
            notes: "First release",
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

    it("rejects API URLs that do not point to a GitHub latest release", async () => {
        await expect(
            fetchLatestGitHubRelease("https://example.com/releases/latest"),
        ).rejects.toThrow("Header has an invalid GitHub latest-release URL.");
        expect(fetchMock).not.toHaveBeenCalled();
    });
});

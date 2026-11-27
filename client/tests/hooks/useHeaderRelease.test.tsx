import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { GitHubRelease } from "../../src/lib/github-releases";

const cacheMocks = vi.hoisted(() => ({
    readCachedRelease: vi.fn(),
    writeCachedRelease: vi.fn(),
    isCacheFresh: vi.fn(),
}));

const githubMocks = vi.hoisted(() => ({
    fetchGitHubRelease: vi.fn(),
}));

vi.mock("../../src/lib/release-cache", () => cacheMocks);
vi.mock("../../src/lib/github-releases", () => ({
    fetchGitHubRelease: githubMocks.fetchGitHubRelease,
}));

import {
    RELEASE_CACHE_TTL_MS,
    useHeaderRelease,
} from "../../src/hooks/useHeaderRelease";

const API_URL = "https://api.github.com/repos/example/header/releases/latest";

function makeRelease(tag: string): GitHubRelease {
    return {
        title: `Header ${tag}`,
        description: null,
        tag,
        publishedAt: null,
        zipballUrl: "https://api.github.com/repos/example/header/zipball",
        assets: [],
    };
}

function staleCache(tag: string) {
    cacheMocks.readCachedRelease.mockReturnValue({
        release: makeRelease(tag),
        fetchedAt: Date.now() - RELEASE_CACHE_TTL_MS - 1,
    });
    cacheMocks.isCacheFresh.mockReturnValue(false);
}

describe("useHeaderRelease", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("hydrates from a fresh cache without hitting GitHub", async () => {
        cacheMocks.readCachedRelease.mockReturnValue({
            release: makeRelease("v1.0.0"),
            fetchedAt: Date.now(),
        });
        cacheMocks.isCacheFresh.mockReturnValue(true);

        const { result } = renderHook(() => useHeaderRelease(API_URL));

        await waitFor(() => expect(result.current.loading).toBe(false));
        expect(result.current.release?.tag).toBe("v1.0.0");
        expect(result.current.updateAvailable).toBe(false);
        expect(githubMocks.fetchGitHubRelease).not.toHaveBeenCalled();
    });

    it("fetches and caches the release when nothing is cached", async () => {
        cacheMocks.readCachedRelease.mockReturnValue(null);
        githubMocks.fetchGitHubRelease.mockResolvedValue(makeRelease("v1.0.0"));

        const { result } = renderHook(() => useHeaderRelease(API_URL));

        expect(result.current.loading).toBe(true);
        await waitFor(() => expect(result.current.loading).toBe(false));
        expect(result.current.release?.tag).toBe("v1.0.0");
        expect(result.current.updateAvailable).toBe(false);
        expect(githubMocks.fetchGitHubRelease).toHaveBeenCalledWith(
            API_URL,
            undefined,
            { writeCache: true },
        );
    });

    it("refreshes the cache when the stale entry matches the latest release", async () => {
        staleCache("v1.0.0");
        githubMocks.fetchGitHubRelease.mockResolvedValue(makeRelease("v1.0.0"));

        const { result } = renderHook(() => useHeaderRelease(API_URL));
        await waitFor(() => expect(result.current.checking).toBe(false));

        expect(result.current.updateAvailable).toBe(false);
        expect(cacheMocks.writeCachedRelease).toHaveBeenCalledWith(
            API_URL,
            expect.objectContaining({ tag: "v1.0.0" }),
        );
    });

    it("surfaces the refetch control when a newer release is found", async () => {
        staleCache("v1.0.0");
        githubMocks.fetchGitHubRelease.mockResolvedValue(makeRelease("v1.1.0"));

        const { result } = renderHook(() => useHeaderRelease(API_URL));
        await waitFor(() => expect(result.current.checking).toBe(false));

        expect(result.current.release?.tag).toBe("v1.0.0"); // still old
        expect(result.current.updateAvailable).toBe(true);
        expect(githubMocks.fetchGitHubRelease).toHaveBeenCalledWith(
            API_URL,
            undefined,
            { writeCache: false },
        );
        // Never overwrite the cached release while a prompt is pending.
        expect(cacheMocks.writeCachedRelease).not.toHaveBeenCalled();
    });

    it("refetch applies the latest release and hides the control", async () => {
        staleCache("v1.0.0");
        const newest = makeRelease("v1.1.0");
        githubMocks.fetchGitHubRelease
            .mockResolvedValueOnce(newest) // background check
            .mockResolvedValueOnce(newest); // manual refetch

        const { result } = renderHook(() => useHeaderRelease(API_URL));
        await waitFor(() => expect(result.current.updateAvailable).toBe(true));

        act(() => result.current.refetch());
        await waitFor(() => expect(result.current.checking).toBe(false));

        expect(result.current.release?.tag).toBe("v1.1.0");
        expect(result.current.updateAvailable).toBe(false);
    });

    it("refetch failures surface an error and keep the control visible", async () => {
        staleCache("v1.0.0");
        githubMocks.fetchGitHubRelease
            .mockResolvedValueOnce(makeRelease("v1.1.0"))
            .mockRejectedValueOnce(new Error("network down"));

        const { result } = renderHook(() => useHeaderRelease(API_URL));
        await waitFor(() => expect(result.current.updateAvailable).toBe(true));

        act(() => result.current.refetch());
        await waitFor(() => expect(result.current.checking).toBe(false));

        expect(result.current.error).toBe("network down");
        expect(result.current.updateAvailable).toBe(true);
    });

    it("ignores background check failures when cached data exists", async () => {
        staleCache("v1.0.0");
        githubMocks.fetchGitHubRelease.mockRejectedValue(new Error("boom"));

        const { result } = renderHook(() => useHeaderRelease(API_URL));
        await waitFor(() => expect(result.current.checking).toBe(false));

        expect(result.current.release?.tag).toBe("v1.0.0");
        expect(result.current.error).toBeNull();
    });

    it("surfaces background errors when nothing is cached", async () => {
        cacheMocks.readCachedRelease.mockReturnValue(null);
        githubMocks.fetchGitHubRelease.mockRejectedValue(new Error("boom"));

        const { result } = renderHook(() => useHeaderRelease(API_URL));
        await waitFor(() => expect(result.current.loading).toBe(false));

        expect(result.current.error).toBe("boom");
    });
});

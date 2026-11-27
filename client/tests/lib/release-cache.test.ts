import { beforeEach, describe, expect, it } from "vitest";
import type { GitHubRelease } from "../../src/lib/github-releases";
import {
    clearCachedRelease,
    readCachedRelease,
    writeCachedRelease,
} from "../../src/lib/release-cache";

const API_URL = "https://api.github.com/repos/example/header/releases/latest";

const release: GitHubRelease = {
    title: "Header v1",
    description: "First release",
    tag: "v1.0.0",
    publishedAt: "2025-03-01T10:00:00Z",
    zipballUrl: "https://api.github.com/repos/example/header/zipball/v1.0.0",
    assets: [],
};

describe("release cache", () => {
    beforeEach(() => {
        localStorage.clear();
    });

    it("stores and reads a fetched release", () => {
        writeCachedRelease(API_URL, release);

        const cached = readCachedRelease(API_URL);
        expect(cached?.release).toEqual(release);
        expect(typeof cached?.fetchedAt).toBe("number");
    });

    it("returns null when nothing is cached", () => {
        expect(readCachedRelease(API_URL)).toBeNull();
    });

    it("returns null for corrupted cache entries", () => {
        localStorage.setItem(`rt-radio-release:${API_URL}`, "not json");
        expect(readCachedRelease(API_URL)).toBeNull();
    });

    it("clears a cached release", () => {
        writeCachedRelease(API_URL, release);
        clearCachedRelease(API_URL);
        expect(readCachedRelease(API_URL)).toBeNull();
    });
});

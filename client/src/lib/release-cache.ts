import type { GitHubRelease } from "./github-releases";

const CACHE_KEY_PREFIX = "rt-radio-release:";

export type CachedRelease = {
    release: GitHubRelease;
    fetchedAt: number;
};

function getStorage(): Storage | null {
    try {
        // localStorage is unavailable in SSR and can throw in some
        // privacy-restricted browser contexts.
        if (typeof localStorage === "undefined") return null;
        return localStorage;
    } catch {
        return null;
    }
}

function cacheKey(apiUrl: string): string {
    return `${CACHE_KEY_PREFIX}${apiUrl}`;
}

export function readCachedRelease(apiUrl: string): CachedRelease | null {
    const storage = getStorage();
    if (!storage) return null;

    try {
        const raw = storage.getItem(cacheKey(apiUrl));
        if (!raw) return null;

        const parsed: unknown = JSON.parse(raw);
        if (
            typeof parsed !== "object" ||
            parsed === null ||
            typeof (parsed as CachedRelease).fetchedAt !== "number" ||
            typeof (parsed as CachedRelease).release !== "object" ||
            (parsed as CachedRelease).release === null
        ) {
            return null;
        }

        return parsed as CachedRelease;
    } catch {
        return null;
    }
}

export function writeCachedRelease(
    apiUrl: string,
    release: GitHubRelease,
): void {
    const storage = getStorage();
    if (!storage) return;

    const entry: CachedRelease = { release, fetchedAt: Date.now() };
    try {
        storage.setItem(cacheKey(apiUrl), JSON.stringify(entry));
    } catch {
        // Best-effort cache: ignore quota or privacy-mode failures.
    }
}

export function clearCachedRelease(apiUrl: string): void {
    const storage = getStorage();
    if (!storage) return;
    try {
        storage.removeItem(cacheKey(apiUrl));
    } catch {
        // ignore
    }
}

export function isCacheFresh(cached: CachedRelease, ttlMs: number): boolean {
    return Date.now() - cached.fetchedAt < ttlMs;
}

import { useCallback, useEffect, useRef, useState } from "react";
import {
    fetchGitHubRelease,
    type GitHubRelease,
} from "../lib/github-releases";
import {
    isCacheFresh,
    readCachedRelease,
    writeCachedRelease,
} from "../lib/release-cache";

// How long cached release metadata is trusted before the app revalidates
// against GitHub. Raise to spend fewer API calls, lower for fresher data.
export const RELEASE_CACHE_TTL_MS = 1000 * 60 * 60 * 6; // 6 hours

export type HeaderReleaseState = {
    /** The release currently displayed (from cache or network). */
    release: GitHubRelease | null;
    /** True until we have *something* to show (cache hit or first fetch). */
    loading: boolean;
    /** True while a network request is in flight. */
    checking: boolean;
    /** Set only when a user-initiated refetch fails. */
    error: string | null;
    /** True when a newer release exists than the one displayed. */
    updateAvailable: boolean;
    /** Fetch the latest release and make it the displayed one. */
    refetch: () => void;
};

function toMessage(error: unknown): string {
    return error instanceof Error ? error.message : String(error);
}

export function useHeaderRelease(githubApi: string): HeaderReleaseState {
    const [release, setRelease] = useState<GitHubRelease | null>(null);
    const [loading, setLoading] = useState(true);
    const [checking, setChecking] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [updateAvailable, setUpdateAvailable] = useState(false);

    // Guards against an older network response clobbering a newer one.
    const requestSeq = useRef(0);

    useEffect(() => {
        requestSeq.current += 1;
        const seq = requestSeq.current;
        let cancelled = false;
        const isCurrent = () => !cancelled && seq === requestSeq.current;

        const cached = readCachedRelease(githubApi);

        // 1. Hydrate from the cache immediately (zero API calls).
        if (cached) {
            setRelease(cached.release);
            setLoading(false);
        } else {
            setRelease(null);
            setLoading(true);
        }
        setUpdateAvailable(false);
        setError(null);

        if (cached && isCacheFresh(cached, RELEASE_CACHE_TTL_MS)) {
            setChecking(false);
            return () => {
                cancelled = true;
            };
        }

        // 2. Cache is missing or stale — validate against GitHub.
        setChecking(true);
        fetchGitHubRelease(githubApi, undefined, { writeCache: !cached })
            .then((fetched) => {
                if (!isCurrent()) return;
                if (cached) {
                    if (fetched.tag === cached.release.tag) {
                        // Same version: bump the TTL so we don't re-check.
                        writeCachedRelease(githubApi, fetched);
                        setUpdateAvailable(false);
                    } else {
                        // Newer version exists: surface the refetch control.
                        // Leave the cache pointing at the old release so the
                        // prompt survives reloads until the user accepts it.
                        setUpdateAvailable(true);
                    }
                } else {
                    setRelease(fetched);
                    setUpdateAvailable(false);
                }
            })
            .catch((err: unknown) => {
                if (!isCurrent()) return;
                // Background failures are silent when we have cached data.
                if (!cached) setError(toMessage(err));
            })
            .finally(() => {
                if (!isCurrent()) return;
                setChecking(false);
                setLoading(false);
            });

        return () => {
            cancelled = true;
        };
    }, [githubApi]);

    const refetch = useCallback(() => {
        requestSeq.current += 1;
        const seq = requestSeq.current;
        setChecking(true);
        setError(null);

        // Default `writeCache: true`: accepting an update also refreshes the cache.
        fetchGitHubRelease(githubApi)
            .then((fetched) => {
                if (seq !== requestSeq.current) return;
                setRelease(fetched);
                setUpdateAvailable(false);
            })
            .catch((err: unknown) => {
                if (seq !== requestSeq.current) return;
                setError(toMessage(err));
            })
            .finally(() => {
                if (seq !== requestSeq.current) return;
                setChecking(false);
                setLoading(false);
            });
    }, [githubApi]);

    return { release, loading, checking, error, updateAvailable, refetch };
}

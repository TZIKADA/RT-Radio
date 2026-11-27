import { writeCachedRelease } from "./release-cache";

export type GitHubReleaseAsset = {
    name: string;
    size: number;
    contentType: string | null;
    downloadUrl: string;
};

export type GitHubRelease = {
    title: string;
    description: string | null;
    tag: string;
    publishedAt: string | null;
    zipballUrl: string;
    assets: GitHubReleaseAsset[];
};

export type FetchReleaseOptions = { writeCache?: boolean };

const GITHUB_DOWNLOAD_HOSTS = new Set([
    "api.github.com",
    "github.com",
    "codeload.github.com",
]);

const RELEASE_METADATA_MARKER = /\r?\n\r?\n---\r?\n\r?\nCommit: [0-9a-f]{40}\b/i;

function extractReleaseDescription(body: string | null): string | null {
    if (body === null) return null;

    const marker = RELEASE_METADATA_MARKER.exec(body);
    const description = (marker ? body.slice(0, marker.index) : body).trim();
    return description.length > 0 ? description : null;
}

function isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === "object" && value !== null;
}

function parseGitHubDownloadUrl(value: unknown, field: string): string {
    if (typeof value !== "string") {
        throw new Error(`GitHub release is missing ${field}.`);
    }

    const url = new URL(value);
    if (url.protocol !== "https:" || !GITHUB_DOWNLOAD_HOSTS.has(url.hostname)) {
        throw new Error(`GitHub release contains an invalid ${field}.`);
    }

    return url.href;
}

function parseAsset(value: unknown): GitHubReleaseAsset {
    if (
        !isRecord(value) ||
        typeof value.name !== "string" ||
        typeof value.size !== "number" ||
        !Number.isFinite(value.size) ||
        value.size < 0 ||
        (value.content_type !== null &&
            typeof value.content_type !== "string")
    ) {
        throw new Error("GitHub release contains invalid asset metadata.");
    }

    return {
        name: value.name,
        size: value.size,
        contentType: value.content_type,
        downloadUrl: parseGitHubDownloadUrl(
            value.browser_download_url,
            "asset download URL",
        ),
    };
}

export async function fetchGitHubRelease(
    githubApi: string,
    signal?: AbortSignal,
    options: FetchReleaseOptions = {},
): Promise<GitHubRelease> {
    const { writeCache = true } = options;
    if (typeof githubApi !== "string") {
        throw new Error("Header is missing its GitHub API URL.");
    }

    const apiUrl = new URL(githubApi);
    if (
        apiUrl.origin !== "https://api.github.com" ||
        !/^\/repos\/[^/]+\/[^/]+\/releases\/(?:latest|tags\/[A-Za-z0-9_-]+-v\d+\.\d+\.\d+)\/?$/.test(
            apiUrl.pathname,
        )
    ) {
        throw new Error("Header has an invalid GitHub release API URL.");
    }

    const response = await fetch(apiUrl, {
        cache: "no-cache",
        headers: { Accept: "application/vnd.github+json" },
        signal,
    });
    if (!response.ok) {
        throw new Error(`GitHub API request failed with status ${response.status}.`);
    }

    const data: unknown = await response.json();
    if (
        !isRecord(data) ||
        typeof data.tag_name !== "string" ||
        (data.name !== null && typeof data.name !== "string") ||
        (data.body !== null && typeof data.body !== "string") ||
        (data.published_at !== null &&
            typeof data.published_at !== "string") ||
        !Array.isArray(data.assets)
    ) {
        throw new Error("GitHub API returned invalid release metadata.");
    }

    const tag = data.tag_name;
    const description = extractReleaseDescription(data.body);
    const release: GitHubRelease = {
        title:
            typeof data.name === "string" && data.name.trim()
                ? data.name
                : tag,
        description,
        tag,
        publishedAt: data.published_at,
        zipballUrl: parseGitHubDownloadUrl(
            data.zipball_url,
            "source archive URL",
        ),
        assets: data.assets.map(parseAsset),
    };

    // Cache the parsed release so later reads can avoid the GitHub API.
    if (writeCache) writeCachedRelease(githubApi, release);
    return release;
}

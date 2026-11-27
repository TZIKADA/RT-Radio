import { useEffect, useMemo, useRef, useState } from "react";
import { Button, Card, Col, Container, Modal, Row } from "react-bootstrap";
import AppControls from "../components/AppControls";
import AdminErrorAlert from "../components/AdminErrorAlert";
import { useTranslation } from "../components/LanguageProvider";
import { fetchGitHubRelease, type GitHubRelease } from "../lib/github-releases";
import { logAppError } from "../lib/errors";
import { supabase } from "../lib/supabase";
import RefetchButton from "../components/RefetchButton";
import { useHeaderRelease } from "../hooks/useHeaderRelease";

type HeaderRecord = {
    id: string;
    github_api: string;
};

type AssignedHeader = HeaderRecord & {
    release: GitHubRelease;
};

function parseHeaderRecord(value: unknown): HeaderRecord {
    if (
        typeof value !== "object" ||
        value === null ||
        !("id" in value) ||
        typeof value.id !== "string" ||
        !("github_api" in value) ||
        typeof value.github_api !== "string"
    ) {
        throw new Error("Assigned header has invalid GitHub release metadata.");
    }

    return { id: value.id, github_api: value.github_api };
}

function formatFileSize(size: number, language: string) {
    const units = ["B", "KB", "MB", "GB", "TB"];
    let value = size;
    let unitIndex = 0;

    while (value >= 1024 && unitIndex < units.length - 1) {
        value /= 1024;
        unitIndex += 1;
    }

    return `${new Intl.NumberFormat(language, {
        maximumFractionDigits: 1,
    }).format(value)} ${units[unitIndex]}`;
}

function formatReleaseDate(date: string | null, language: string) {
    if (!date) return null;

    const parsedDate = new Date(date);
    if (Number.isNaN(parsedDate.getTime())) return null;

    return new Intl.DateTimeFormat(language, { dateStyle: "medium" }).format(
        parsedDate,
    );
}

function HeaderRelease({ githubApi }: { githubApi: string }) {
    const { release, loading, checking, error, updateAvailable, refetch } =
        useHeaderRelease(githubApi);

    if (loading) return <p>…</p>;
    if (!release) return error ? <p>{error}</p> : null;

    return (
        <div>
            <h3>{release.title}</h3>
            <p>{release.tag}</p>

            <RefetchButton
                updateAvailable={updateAvailable}
                checking={checking}
                onClick={refetch}
            />

            {error && <p className="text-danger">{error}</p>}
        </div>
    );
}

export default function Home() {
    const { language, t } = useTranslation();
    const [headers, setHeaders] = useState<AssignedHeader[]>([]);
    const [loading, setLoading] = useState(false);
    const [hasFetched, setHasFetched] = useState(false);
    const [error, setError] = useState(false);
    const controllerRef = useRef<AbortController | null>(null);
    const [selectedHeader, setSelectedHeader] = useState<AssignedHeader | null>(
        null,
    );

    const sortedHeaders = useMemo(
        () =>
            [...headers].sort((left, right) =>
                left.release.title.localeCompare(right.release.title, language),
            ),
        [headers, language],
    );

    // Cancel any request still in flight when the page is left.
    useEffect(() => () => controllerRef.current?.abort(), []);

    async function loadHeaders() {
        controllerRef.current?.abort();
        const controller = new AbortController();
        controllerRef.current = controller;

        setLoading(true);
        setError(false);

        try {
            const { data: assignments, error: assignmentsError } =
                await supabase.from("user_headers").select("header_id");

            if (assignmentsError) throw assignmentsError;

            const headerIds = (assignments ?? []).map(
                (assignment) => assignment.header_id,
            );
            if (headerIds.length === 0) {
                setHeaders([]);
                return;
            }

            const { data: headerRows, error: headersError } = await supabase
                .from("headers")
                .select("id,github_api")
                .in("id", headerIds);

            if (headersError) throw headersError;

            const releasesByApi = new Map<string, Promise<GitHubRelease>>();
            const assignedHeaders = await Promise.all(
                (headerRows ?? []).map(async (record) => {
                    const header = parseHeaderRecord(record);
                    let releaseRequest = releasesByApi.get(header.github_api);
                    if (!releaseRequest) {
                        releaseRequest = fetchGitHubRelease(
                            header.github_api,
                            controller.signal,
                        );
                        releasesByApi.set(header.github_api, releaseRequest);
                    }

                    return {
                        ...header,
                        release: await releaseRequest,
                    };
                }),
            );

            if (!controller.signal.aborted) setHeaders(assignedHeaders);
        } catch (loadError) {
            if (controller.signal.aborted) return;

            logAppError("Loading assigned header releases failed", loadError);
            setHeaders([]);
            setError(true);
        } finally {
            if (!controller.signal.aborted) {
                setLoading(false);
                setHasFetched(true);
            }
        }
    }

    const releaseDate = selectedHeader
        ? formatReleaseDate(selectedHeader.release.publishedAt, language)
        : null;

    return (
        <Container className="py-5 min-vh-100 d-flex flex-column">
            <AppControls />

            <main className="my-auto pt-5">
                <h1 className="visually-hidden">{t("yourHeaders")}</h1>

                <Card className="shadow-sm">
                    <Card.Body className="p-4">
                        {error && (
                            <AdminErrorAlert message={t("headersLoadFailed")} />
                        )}
                        {hasFetched &&
                            !loading &&
                            !error &&
                            sortedHeaders.length === 0 && (
                                <p className="text-muted text-center">
                                    {t("noHeadersAssigned")}
                                </p>
                            )}

                        {!error && sortedHeaders.length > 0 && (
                            <Row xs={1} sm={2} md={3} xl={4} className="g-4">
                                {sortedHeaders.map((header) => (
                                    <Col key={header.id}>
                                        <Card className="h-100">
                                            <Card.Body className="d-flex flex-column gap-3 p-3">
                                                <Card.Title
                                                    as="h2"
                                                    className="h5 mb-0 text-break"
                                                >
                                                <HeaderRelease githubApi={header.github_api}
                                                /></Card.Title>
                                                <div className="mt-auto d-grid gap-2">
                                                    <Button
                                                        variant="outline-secondary"
                                                        className="d-flex align-items-center justify-content-center gap-2"
                                                        aria-label={`${t("releaseInfo")}: ${header.release.title}`}
                                                        onClick={() =>
                                                            setSelectedHeader(
                                                                header,
                                                            )
                                                        }
                                                    >
                                                        <i
                                                            className="bi bi-info-circle"
                                                            aria-hidden="true"
                                                        />
                                                        <span aria-hidden="true">
                                                            {t("releaseInfo")}
                                                        </span>
                                                    </Button>
                                                    <Button
                                                        as="a"
                                                        href={
                                                            header.release
                                                                .zipballUrl
                                                        }
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                    >
                                                        {t("download")}
                                                    </Button>
                                                </div>
                                            </Card.Body>
                                        </Card>
                                    </Col>
                                ))}
                            </Row>
                        )}

                        <div
                            className={`text-center${sortedHeaders.length > 0 ? " mt-4" : ""}`}
                        >
                            {hasFetched ? (
                                <Button
                                    variant="outline-secondary"
                                    className="d-inline-flex align-items-center gap-2"
                                    onClick={() => void loadHeaders()}
                                    disabled={loading}
                                >
                                    <i
                                        className="bi bi-arrow-repeat"
                                        aria-hidden="true"
                                    />
                                    {loading
                                        ? t("loadingHeaders")
                                        : t("refetchFiles")}
                                </Button>
                            ) : (
                                <Button
                                    size="lg"
                                    className="px-5 py-4 fs-4 d-inline-flex align-items-center gap-3"
                                    onClick={() => void loadHeaders()}
                                    disabled={loading}
                                >
                                    <i
                                        className="bi bi-cloud-download"
                                        aria-hidden="true"
                                    />
                                    {loading
                                        ? t("loadingHeaders")
                                        : t("fetchFiles")}
                                </Button>
                            )}
                        </div>
                    </Card.Body>
                </Card>
            </main>

            <Modal
                show={selectedHeader !== null}
                onHide={() => setSelectedHeader(null)}
                centered
                size="lg"
            >
                {selectedHeader && (
                    <>
                        <Modal.Header closeButton dir="ltr">
                            <Modal.Title>
                                {selectedHeader.release.title}
                            </Modal.Title>
                        </Modal.Header>
                        <Modal.Body>
                            <dl className="release-details mb-4">
                                <dt>{t("releaseTag")}</dt>
                                <dd>
                                    <code dir="ltr">
                                        {selectedHeader.release.tag}
                                    </code>
                                </dd>
                                {releaseDate && (
                                    <>
                                        <dt>{t("releaseDate")}</dt>
                                        <dd>
                                            <time
                                                dateTime={
                                                    selectedHeader.release
                                                        .publishedAt ??
                                                    undefined
                                                }
                                            >
                                                {releaseDate}
                                            </time>
                                        </dd>
                                    </>
                                )}
                            </dl>

                            <h3 className="h6 fw-bold">{t("description")}</h3>
                            <div
                                className="release-description mb-4"
                                dir="auto"
                            >
                                {selectedHeader.release.description ||
                                    t("noReleaseDescription")}
                            </div>

                            <h3 className="h6 fw-bold">{t("releaseFiles")}</h3>
                            {selectedHeader.release.assets.length > 0 ? (
                                <ul className="list-unstyled mb-0">
                                    {selectedHeader.release.assets.map(
                                        (asset) => (
                                            <li
                                                key={asset.downloadUrl}
                                                className="d-flex flex-wrap justify-content-between align-items-center gap-2 py-2 border-bottom"
                                            >
                                                <span dir="ltr">
                                                    <span className="fw-semibold">
                                                        {asset.name}
                                                    </span>
                                                    <small className="d-block text-muted">
                                                        {formatFileSize(
                                                            asset.size,
                                                            language,
                                                        )}
                                                        {asset.contentType &&
                                                            ` · ${asset.contentType}`}
                                                    </small>
                                                </span>
                                                <a
                                                    href={asset.downloadUrl}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                >
                                                    {t("downloadAsset")}
                                                </a>
                                            </li>
                                        ),
                                    )}
                                </ul>
                            ) : (
                                <p className="text-muted mb-0">
                                    {t("noReleaseAssets")}
                                </p>
                            )}
                        </Modal.Body>
                    </>
                )}
            </Modal>
        </Container>
    );
}

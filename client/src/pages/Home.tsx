import { useEffect, useMemo, useState } from "react";
import { Button, Card, Col, Container, Modal, Row } from "react-bootstrap";
import AppControls from "../components/AppControls";
import AdminErrorAlert from "../components/AdminErrorAlert";
import { useTranslation } from "../components/LanguageProvider";
import { fetchGitHubRelease, type GitHubRelease } from "../lib/github-releases";
import { logAppError } from "../lib/errors";
import { supabase } from "../lib/supabase";

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

export default function Home() {
    const { language, t } = useTranslation();
    const [headers, setHeaders] = useState<AssignedHeader[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);
    const [selectedHeader, setSelectedHeader] =
        useState<AssignedHeader | null>(null);

    const sortedHeaders = useMemo(
        () =>
            [...headers].sort((left, right) =>
                left.release.title.localeCompare(
                    right.release.title,
                    language,
                ),
            ),
        [headers, language],
    );

    useEffect(() => {
        const controller = new AbortController();
        let active = true;

        async function loadHeaders() {
            setLoading(true);
            setError(false);
            setHeaders([]);

            try {
                const { data: assignments, error: assignmentsError } =
                    await supabase.from("user_headers").select("header_id");

                if (assignmentsError) throw assignmentsError;

                const headerIds = (assignments ?? []).map(
                    (assignment) => assignment.header_id,
                );
                if (headerIds.length === 0) return;

                const { data: headerRows, error: headersError } = await supabase
                    .from("headers")
                    .select("id,github_api")
                    .in("id", headerIds);

                if (headersError) throw headersError;

                const releasesByApi = new Map<
                    string,
                    Promise<GitHubRelease>
                >();
                const assignedHeaders = await Promise.all(
                    (headerRows ?? []).map(async (record) => {
                        const header = parseHeaderRecord(record);
                        let releaseRequest = releasesByApi.get(
                            header.github_api,
                        );
                        if (!releaseRequest) {
                            releaseRequest = fetchGitHubRelease(
                                header.github_api,
                                controller.signal,
                            );
                            releasesByApi.set(
                                header.github_api,
                                releaseRequest,
                            );
                        }

                        return {
                            ...header,
                            release: await releaseRequest,
                        };
                    }),
                );

                if (active) setHeaders(assignedHeaders);
            } catch (loadError) {
                if (controller.signal.aborted) return;

                logAppError(
                    "Loading assigned header releases failed",
                    loadError,
                );
                if (active) setError(true);
            } finally {
                if (active) setLoading(false);
            }
        }

        void loadHeaders();
        return () => {
            active = false;
            controller.abort();
        };
    }, []);

    const releaseDate = selectedHeader
        ? formatReleaseDate(selectedHeader.release.publishedAt, language)
        : null;

    return (
        <Container className="py-5">
            <AppControls />

            <main className="pt-3">
                <div className="mb-4">
                    <h1 className="h2 mb-2">{t("yourHeaders")}</h1>
                    <p className="text-muted">
                        {t("downloadAssignedHeaders")}
                    </p>
                </div>

                {error && <AdminErrorAlert message={t("headersLoadFailed")} />}
                {loading && <p className="text-muted">{t("loadingHeaders")}</p>}
                {!loading && !error && sortedHeaders.length === 0 && (
                    <p className="text-muted">{t("noHeadersAssigned")}</p>
                )}

                {!loading && !error && sortedHeaders.length > 0 && (
                    <Row xs={1} md={2} lg={3} className="g-4">
                        {sortedHeaders.map((header) => (
                            <Col key={header.id}>
                                <Card className="h-100 shadow-sm">
                                    <Card.Body className="d-flex flex-column p-4">
                                        <Card.Title as="h2" className="h5">
                                            {header.release.title}
                                        </Card.Title>
                                        <div className="mt-auto d-flex flex-wrap gap-2">
                                            <Button
                                                variant="outline-secondary"
                                                aria-label={`${t("releaseInfo")}: ${header.release.title}`}
                                                onClick={() =>
                                                    setSelectedHeader(header)
                                                }
                                            >
                                                <i
                                                    className="bi bi-info-circle"
                                                    aria-hidden="true"
                                                />
                                            </Button>
                                            <Button
                                                as="a"
                                                href={header.release.zipballUrl}
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
            </main>

            <Modal
                show={selectedHeader !== null}
                onHide={() => setSelectedHeader(null)}
                centered
                size="lg"
            >
                {selectedHeader && (
                    <>
                        <Modal.Header closeButton>
                            <Modal.Title>
                                {selectedHeader.release.title}
                            </Modal.Title>
                        </Modal.Header>
                        <Modal.Body>
                            <dl className="row mb-4">
                                <dt className="col-sm-3">
                                    {t("releaseTag")}
                                </dt>
                                <dd className="col-sm-9">
                                    <code>{selectedHeader.release.tag}</code>
                                </dd>
                                {releaseDate && (
                                    <>
                                        <dt className="col-sm-3">
                                            {t("releaseDate")}
                                        </dt>
                                        <dd className="col-sm-9">
                                            <time
                                                dateTime={
                                                    selectedHeader.release
                                                        .publishedAt ?? undefined
                                                }
                                            >
                                                {releaseDate}
                                            </time>
                                        </dd>
                                    </>
                                )}
                            </dl>

                            <h3 className="h6">{t("releaseNotes")}</h3>
                            <div className="release-notes mb-4">
                                {selectedHeader.release.notes?.trim() ||
                                    t("noReleaseNotes")}
                            </div>

                            <h3 className="h6">{t("releaseFiles")}</h3>
                            {selectedHeader.release.assets.length > 0 ? (
                                <ul className="list-unstyled mb-0">
                                    {selectedHeader.release.assets.map(
                                        (asset) => (
                                            <li
                                                key={asset.downloadUrl}
                                                className="d-flex flex-wrap justify-content-between align-items-center gap-2 py-2 border-bottom"
                                            >
                                                <span>
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

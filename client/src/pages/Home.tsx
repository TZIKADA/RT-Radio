import { useEffect, useState } from "react";
import { Alert, Button, Card, Container, Row, Col } from "react-bootstrap";
import { Link } from "react-router";
import ThemeToggle from "../components/ToggleTheme";
import { supabase } from "../lib/supabase";

type HeaderRecord = {
    id: string;
    name: string;
    description: string | null;
    storage_path: string;
};

function getErrorMessage(error: unknown, fallback: string) {
    if (error instanceof Error) return error.message;
    if (
        typeof error === "object" &&
        error !== null &&
        "message" in error &&
        typeof error.message === "string"
    ) {
        return error.message;
    }
    return fallback;
}

export default function Home() {
    const [headers, setHeaders] = useState<HeaderRecord[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [downloadError, setDownloadError] = useState<string | null>(null);
    const [downloadingId, setDownloadingId] = useState<string | null>(null);

    useEffect(() => {
        async function loadHeaders() {
            setLoading(true);
            setError(null);

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

                const { data, error: headersError } = await supabase
                    .from("headers")
                    .select("id,name,description,storage_path")
                    .in("id", headerIds)
                    .order("name");

                if (headersError) throw headersError;
                setHeaders(data ?? []);
            } catch (loadError) {
                console.error(loadError);
                setError(
                    getErrorMessage(
                        loadError,
                        "Could not read your header assignments. Check the user_headers table and its SELECT policy.",
                    ),
                );
            } finally {
                setLoading(false);
            }
        }

        void loadHeaders();
    }, []);

    async function downloadHeader(header: HeaderRecord) {
        setDownloadingId(header.id);
        setDownloadError(null);

        try {
            const { data, error: signedUrlError } = await supabase.storage
                .from("headers")
                .createSignedUrl(header.storage_path, 60, { download: true });

            if (signedUrlError) throw signedUrlError;
            window.location.assign(data.signedUrl);
        } catch (downloadError) {
            console.error(downloadError);
            setDownloadError(
                getErrorMessage(
                    downloadError,
                    `Failed to prepare the download for ${header.name}.`,
                ),
            );
        } finally {
            setDownloadingId(null);
        }
    }

    return (
        <Container className="py-5">
            <header className="d-flex justify-content-between align-items-center mb-5">
                <Link to="/" className="text-decoration-none text-body">
                    <span className="h3 mb-0">RT-Radio</span>
                </Link>
                <div className="d-flex align-items-center gap-2">
                    <Link to="/account" className="btn btn-outline-secondary">
                        Account
                    </Link>
                    <ThemeToggle />
                </div>
            </header>

            <main>
                <div className="mb-4">
                    <h1 className="h2 mb-2">Your headers</h1>
                    <p className="text-muted">
                        Download the header files assigned to your account.
                    </p>
                </div>

                {error && (
                    <Alert variant="danger">
                        Failed to load headers: {error}
                    </Alert>
                )}
                {downloadError && (
                    <Alert variant="danger" role="alert">
                        {downloadError}
                    </Alert>
                )}
                {loading && <p className="text-muted">Loading headers…</p>}
                {!loading && !error && headers.length === 0 && (
                    <p className="text-muted">
                        No downloadable headers are assigned to your account
                        yet. Ask an administrator to add them to your
                        user_headers list.
                    </p>
                )}

                {!loading && !error && headers.length > 0 && (
                    <Row xs={1} md={2} lg={3} className="g-4">
                        {headers.map((header) => (
                            <Col key={header.id}>
                                <Card className="h-100 shadow-sm">
                                    <Card.Body className="d-flex flex-column p-4">
                                        <Card.Title as="h2" className="h5">
                                            {header.name}
                                        </Card.Title>
                                        {header.description && (
                                            <Card.Text className="text-muted">
                                                {header.description}
                                            </Card.Text>
                                        )}
                                        <Button
                                            className="mt-auto"
                                            onClick={() =>
                                                void downloadHeader(header)
                                            }
                                            disabled={downloadingId !== null}
                                        >
                                            {downloadingId === header.id
                                                ? "Preparing download…"
                                                : "Download"}
                                        </Button>
                                    </Card.Body>
                                </Card>
                            </Col>
                        ))}
                    </Row>
                )}
            </main>
        </Container>
    );
}

import { useEffect, useState } from "react";
import { Button, Card, Container, Row, Col } from "react-bootstrap";
import { Link } from "react-router";
import AppControls from "../components/AppControls";
import AdminErrorAlert from "../components/AdminErrorAlert";
import { useTranslation } from "../components/LanguageProvider";
import { logAppError } from "../lib/errors";
import { supabase } from "../lib/supabase";

type HeaderRecord = {
    id: string;
    name: string;
    description: string | null;
    storage_path: string;
};

export default function Home() {
    const { t } = useTranslation();
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
                logAppError("Loading assigned header files failed", loadError);
                setError(t("headersLoadFailed"));
            } finally {
                setLoading(false);
            }
        }

        void loadHeaders();
    }, [t]);

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
            logAppError(`Preparing download for header ${header.id} failed`, downloadError);
            setDownloadError(t("downloadFailed"));
        } finally {
            setDownloadingId(null);
        }
    }

    return (
        <Container className="py-5">
            <header className="d-flex flex-wrap justify-content-between align-items-center gap-3 mb-5">
                <Link to="/" className="text-decoration-none text-body">
                    <span className="h3 mb-0">RT-Radio</span>
                </Link>
                <AppControls showAccount />
            </header>

            <main>
                <div className="mb-4">
                    <h1 className="h2 mb-2">{t("yourHeaders")}</h1>
                    <p className="text-muted">
                        {t("downloadAssignedHeaders")}
                    </p>
                </div>

                {error && (
                    <AdminErrorAlert message={error} />
                )}
                {downloadError && (
                    <AdminErrorAlert message={downloadError} />
                )}
                {loading && (
                    <p className="text-muted">{t("loadingHeaders")}</p>
                )}
                {!loading && !error && headers.length === 0 && (
                    <p className="text-muted">
                        {t("noHeadersAssigned")}
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
                                                ? t("preparingDownload")
                                                : t("download")}
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

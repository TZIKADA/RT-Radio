import { Button } from "react-bootstrap";
import { useTranslation } from "./LanguageProvider";

export default function RefetchButton({
    updateAvailable,
    checking,
    onClick,
}: {
    updateAvailable: boolean;
    checking: boolean;
    onClick: () => void;
}) {
    const { t } = useTranslation();

    // Nothing to do when the displayed release is already the latest.
    if (!updateAvailable) return null;

    return (
        <Button
            variant="primary"
            size="sm"
            className="app-control-button"
            onClick={onClick}
            disabled={checking}
        >
            <i className="bi bi-arrow-clockwise me-1"></i>
            {checking ? t("refetching") : t("refetch")}
        </Button>
    );
}

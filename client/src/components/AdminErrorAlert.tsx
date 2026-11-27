import { Alert } from "react-bootstrap";
import { Link } from "react-router";
import { useTranslation } from "./LanguageProvider";

export default function AdminErrorAlert({ message }: { message: string }) {
    const { t } = useTranslation();

    return (
        <Alert variant="danger" role="alert">
            {message} {t("contactPrompt")}
            <Link to="/contact">{t("contactAdministrator")}</Link>
        </Alert>
    );
}

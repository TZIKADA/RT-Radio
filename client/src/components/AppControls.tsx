import { Dropdown } from "react-bootstrap";
import { Link } from "react-router";
import { useTranslation, type Language } from "./LanguageProvider";
import ThemeToggle from "./ToggleTheme";

const languages: Language[] = ["en", "he", "ru", "ar"];

export default function AppControls({
    showContact = true,
    showAccount = false,
    showDownloads = false,
}: {
    showContact?: boolean;
    showAccount?: boolean;
    showDownloads?: boolean;
} = {}) {
    const { language, languageNames, setLanguage, t } = useTranslation();

    return (
        <div className="d-flex flex-wrap align-items-center gap-2">
            <Dropdown>
                <Dropdown.Toggle
                    variant="outline-secondary"
                    className="d-inline-flex align-items-center gap-1"
                    aria-label={t("language")}
                >
                    <i className="bi bi-translate" aria-hidden="true" />
                    {language.toUpperCase()}
                </Dropdown.Toggle>
                <Dropdown.Menu align="end">
                    {languages.map((option) => (
                        <Dropdown.Item
                            key={option}
                            active={option === language}
                            lang={option}
                            onClick={() => setLanguage(option)}
                        >
                            {languageNames[option]}
                        </Dropdown.Item>
                    ))}
                </Dropdown.Menu>
            </Dropdown>
            <Dropdown className="app-menu-dropdown">
                <Dropdown.Toggle
                    variant="outline-secondary"
                    className="d-inline-flex align-items-center justify-content-center"
                    aria-label={t("menu")}
                >
                    <i className="bi bi-list fs-4" aria-hidden="true" />
                </Dropdown.Toggle>
                <Dropdown.Menu align="end">
                    <Dropdown.Item
                        as="a"
                        href={
                            import.meta.env.VITE_GUIDE_URL ||
                            "/guide/index.html"
                        }
                        target="_blank"
                        rel="noreferrer"
                    >
                        <i className="bi bi-journal-text me-2" aria-hidden="true" />
                        {t("guide")}
                    </Dropdown.Item>
                    {showAccount && (
                        <Dropdown.Item as={Link} to="/account">
                            <i
                                className="bi bi-person-gear me-2"
                                aria-hidden="true"
                            />
                            {t("accountSettings")}
                        </Dropdown.Item>
                    )}
                    {showDownloads && (
                        <Dropdown.Item as={Link} to="/">
                            <i
                                className="bi bi-download me-2"
                                aria-hidden="true"
                            />
                            {t("backToDownloads")}
                        </Dropdown.Item>
                    )}
                    {showContact && (
                        <Dropdown.Item as={Link} to="/contact">
                            <i
                                className="bi bi-person-lines-fill me-2"
                                aria-hidden="true"
                            />
                            {t("contact")}
                        </Dropdown.Item>
                    )}
                </Dropdown.Menu>
            </Dropdown>
            <ThemeToggle />
        </div>
    );
}

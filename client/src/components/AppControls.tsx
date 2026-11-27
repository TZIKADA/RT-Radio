import { Button, Dropdown } from "react-bootstrap";
import { Link } from "react-router";
import { useTranslation, type Language } from "./LanguageProvider";
import ThemeToggle from "./ToggleTheme";

const languages: Language[] = ["en", "he", "ru", "ar"];

export default function AppControls({
    showContact = true,
}: {
    showContact?: boolean;
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
            <Button
                as="a"
                href={
                    import.meta.env.VITE_DOCUMENTATION_URL ||
                    "/docs/index.html"
                }
                target="_blank"
                rel="noreferrer"
                variant="outline-secondary"
                className="d-inline-flex align-items-center gap-1"
            >
                <i className="bi bi-journal-text" aria-hidden="true" />
                {t("guide")}
            </Button>
            {showContact && (
                <Link
                    to="/contact"
                    className="btn btn-outline-secondary d-inline-flex align-items-center gap-1"
                >
                    <i
                        className="bi bi-person-lines-fill"
                        aria-hidden="true"
                    />
                    {t("contact")}
                </Link>
            )}
            <ThemeToggle />
        </div>
    );
}

import { Dropdown } from "react-bootstrap";
import { Link } from "react-router";
import { useAuth } from "../auth/useAuth";
import { useTranslation, type Language } from "./LanguageProvider";
import ThemeToggle from "./ToggleTheme";

const languages: Language[] = ["en", "he", "ru", "ar"];

export default function AppControls() {
    const { session } = useAuth();
    const { language, languageNames, setLanguage, t } = useTranslation();
    const textDirection =
        language === "he" || language === "ar" ? "rtl" : "ltr";
    const pageLinks = session
        ? [
              {
                  path: "/",
                  label: t("downloads"),
                  icon: "bi-download",
              },
          ]
        : [
              {
                  path: "/login",
                  label: t("login"),
                  icon: "bi-box-arrow-in-right",
              },
              {
                  path: "/sign-up",
                  label: t("signUp"),
                  icon: "bi-person-plus",
              },
              {
                  path: "/forgot-password",
                  label: t("forgotPassword"),
                  icon: "bi-question-circle",
              },
          ];

    return (
        <div className="app-controls d-flex flex-wrap align-items-center gap-2">
            <Dropdown>
                <Dropdown.Toggle
                    variant="outline-secondary"
                    className="app-control-button d-inline-flex align-items-center justify-content-center"
                    aria-label={t("menu")}
                >
                    <i className="bi bi-list fs-4" aria-hidden="true" />
                </Dropdown.Toggle>
                <Dropdown.Menu align="end">
                    {pageLinks.map(({ path, label, icon }) => (
                        <Dropdown.Item
                            key={path}
                            as={Link}
                            to={path}
                            className="app-menu-item"
                        >
                            <i
                                className={`bi ${icon} app-menu-item-icon`}
                                aria-hidden="true"
                            />
                            <span
                                className="app-menu-item-label"
                                dir={textDirection}
                            >
                                {label}
                            </span>
                        </Dropdown.Item>
                    ))}
                    <Dropdown.Divider />
                    {session && (
                        <Dropdown.Item
                            as={Link}
                            to="/account"
                            className="app-menu-item"
                        >
                            <i
                                className="bi bi-person-gear app-menu-item-icon"
                                aria-hidden="true"
                            />
                            <span
                                className="app-menu-item-label"
                                dir={textDirection}
                            >
                                {t("accountSettings")}
                            </span>
                        </Dropdown.Item>
                    )}
                    {session && <Dropdown.Divider />}
                    <Dropdown.Item
                        as="a"
                        className="app-menu-item"
                        href={
                            import.meta.env.VITE_GUIDE_URL ||
                            "/guide/index.html"
                        }
                        target="_blank"
                        rel="noreferrer"
                    >
                        <i
                            className="bi bi-journal-text app-menu-item-icon"
                            aria-hidden="true"
                        />
                        <span
                            className="app-menu-item-label"
                            dir={textDirection}
                        >
                            {t("guide")}
                        </span>
                    </Dropdown.Item>
                    <Dropdown.Item
                        as={Link}
                        to="/contact"
                        className="app-menu-item"
                    >
                        <i
                            className="bi bi-person-lines-fill app-menu-item-icon"
                            aria-hidden="true"
                        />
                        <span
                            className="app-menu-item-label"
                            dir={textDirection}
                        >
                            {t("contact")}
                        </span>
                    </Dropdown.Item>
                </Dropdown.Menu>
            </Dropdown>
            <Dropdown>
                <Dropdown.Toggle
                    variant="outline-secondary"
                    className="app-control-button d-inline-flex align-items-center gap-1"
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
            <ThemeToggle />
        </div>
    );
}

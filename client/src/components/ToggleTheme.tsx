import { useEffect, useState } from "react";
import { Button } from "react-bootstrap";
import { useTranslation } from "./LanguageProvider";

function getCurrentTheme() {
    const theme = document.documentElement.getAttribute("data-bs-theme");
    if (theme === "dark" || theme === "light") return theme;

    return typeof window.matchMedia === "function" &&
        window.matchMedia("(prefers-color-scheme: dark)").matches
        ? "dark"
        : "light";
}

export default function ThemeToggle() {
    const [theme, setTheme] = useState(getCurrentTheme);
    const { t } = useTranslation();

    useEffect(() => {
        function syncTheme() {
            setTheme(getCurrentTheme());
        }

        window.addEventListener("system-theme-change", syncTheme);
        return () =>
            window.removeEventListener("system-theme-change", syncTheme);
    }, []);

    function toggle() {
        const next = theme === "dark" ? "light" : "dark";
        localStorage.setItem("rt-radio-theme", next);
        document.documentElement.setAttribute("data-bs-theme", next);
        document.documentElement.dataset.themeOverride = "true";
        setTheme(next);
    }

    return (
        <Button
            variant="outline-secondary"
            className="app-control-button"
            aria-label={t(theme === "dark" ? "switchToLight" : "switchToDark")}
            onClick={toggle}
        >
            <i className={`bi ${theme === "dark" ? "bi-sun" : "bi-moon"}`}></i>
        </Button>
    );
}

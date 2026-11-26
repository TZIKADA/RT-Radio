import { useEffect, useState } from "react";
import { Button } from "react-bootstrap";

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
        document.documentElement.setAttribute("data-bs-theme", next);
        document.documentElement.dataset.themeOverride = "true";
        setTheme(next);
    }

    return (
        <Button
            variant="outline-secondary"
            size="sm"
            aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
            onClick={toggle}
        >
            <i className={`bi ${theme === "dark" ? "bi-sun" : "bi-moon"}`}></i>
        </Button>
    );
}

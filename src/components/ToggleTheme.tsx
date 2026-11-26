import { useState } from "react";
import { Button } from "react-bootstrap";

export default function ThemeToggle() {
    const [theme, setTheme] = useState<string>(
        document.documentElement.getAttribute("data-bs-theme") ?? "dark",
    );

    function toggle() {
        const next = theme === "dark" ? "light" : "dark";
        document.documentElement.setAttribute("data-bs-theme", next);
        setTheme(next);
    }

    return (
        <Button variant="outline-secondary" size="sm" onClick={toggle}>
            <i className={`bi ${theme === "dark" ? "bi-sun" : "bi-moon"}`}></i>
        </Button>
    );
}

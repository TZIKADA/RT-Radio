import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router";
import { describe, expect, it, vi } from "vitest";
import AuthCard from "../../src/components/AuthCard";
import ThemeToggle from "../../src/components/ToggleTheme";

describe("AuthCard", () => {
    it("renders its title and child content", () => {
        const { container } = render(
            <MemoryRouter>
                <AuthCard title="Test card">
                    <p>Card content</p>
                </AuthCard>
            </MemoryRouter>,
        );

        expect(
            screen.getByRole("heading", { name: "Test card" }),
        ).toBeInTheDocument();
        expect(screen.getByText("Card content")).toBeInTheDocument();
        const card = container.querySelector<HTMLElement>(".card");
        expect(card?.style.width).toBe("25rem");
        expect(card?.style.maxWidth).toBe("100%");
    });
    it("respects a custom width without overflowing its container", () => {
        const { container } = render(
            <MemoryRouter>
                <AuthCard title="Wide card" width="32rem">
                    Content
                </AuthCard>
            </MemoryRouter>,
        );

        const card = container.querySelector<HTMLElement>(".card");
        expect(card?.style.width).toBe("32rem");
        expect(card?.style.maxWidth).toBe("100%");
    });
});

describe("ThemeToggle", () => {
    it("uses the system preference when no theme has been selected", () => {
        document.documentElement.removeAttribute("data-bs-theme");
        vi.stubGlobal(
            "matchMedia",
            vi.fn().mockReturnValue({ matches: true }),
        );
        render(<ThemeToggle />);

        expect(
            screen.getByRole("button", { name: "Switch to light mode" }),
        ).toBeInTheDocument();

        vi.unstubAllGlobals();
    });

    it("uses the same default button size as the page navigation", () => {
        render(<ThemeToggle />);

        const button = screen.getByRole("button");
        expect(button).toHaveClass("btn");
        expect(button).not.toHaveClass("btn-sm");
    });

    it("updates the toggle when the system theme changes", () => {
        document.documentElement.setAttribute("data-bs-theme", "dark");
        render(<ThemeToggle />);

        document.documentElement.setAttribute("data-bs-theme", "light");
        act(() => window.dispatchEvent(new Event("system-theme-change")));

        expect(
            screen.getByRole("button", { name: "Switch to dark mode" }),
        ).toBeInTheDocument();
    });

    it("switches the document theme and its icon", async () => {
        const user = userEvent.setup();
        document.documentElement.setAttribute("data-bs-theme", "dark");
        render(<ThemeToggle />);

        const button = screen.getByRole("button");
        expect(button.querySelector(".bi-sun")).toBeInTheDocument();

        await user.click(button);
        expect(document.documentElement).toHaveAttribute(
            "data-bs-theme",
            "light",
        );
        expect(localStorage.getItem("rt-radio-theme")).toBe("light");
        expect(button.querySelector(".bi-moon")).toBeInTheDocument();
    });

    it("switches from a light theme back to dark", async () => {
        const user = userEvent.setup();
        document.documentElement.setAttribute("data-bs-theme", "light");
        render(<ThemeToggle />);

        const button = screen.getByRole("button");
        expect(button.querySelector(".bi-moon")).toBeInTheDocument();

        await user.click(button);
        expect(document.documentElement).toHaveAttribute(
            "data-bs-theme",
            "dark",
        );
        expect(button.querySelector(".bi-sun")).toBeInTheDocument();
    });
});

import { act, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
    LanguageProvider,
    useTranslation,
} from "../../src/components/LanguageProvider";

function LanguageProbe() {
    const { language, t } = useTranslation();
    return <p>{`${language}: ${t("contact")}`}</p>;
}

describe("LanguageProvider", () => {
    let browserLanguages: string[];

    beforeEach(() => {
        localStorage.removeItem("rt-radio-language");
        browserLanguages = ["fr-FR", "ru-RU"];
        vi.stubGlobal("navigator", {
            get languages() {
                return browserLanguages;
            },
            get language() {
                return browserLanguages[0] ?? "en";
            },
        });
    });

    afterEach(() => {
        vi.unstubAllGlobals();
        localStorage.removeItem("rt-radio-language");
    });

    it("provides the English fallback when used without a provider", () => {
        render(<LanguageProbe />);

        expect(screen.getByText("en: Contact")).toBeInTheDocument();
    });

    it("uses the first supported browser language and follows later changes", () => {
        render(
            <LanguageProvider>
                <LanguageProbe />
            </LanguageProvider>,
        );

        expect(screen.getByText("ru: Контакты")).toBeInTheDocument();

        browserLanguages = ["he-IL"];
        act(() => window.dispatchEvent(new Event("languagechange")));

        expect(screen.getByText("he: יצירת קשר")).toBeInTheDocument();
        expect(document.documentElement).toHaveAttribute("dir", "rtl");
    });

    it("keeps a saved language instead of following browser changes", () => {
        localStorage.setItem("rt-radio-language", "ar");
        render(
            <LanguageProvider>
                <LanguageProbe />
            </LanguageProvider>,
        );

        expect(screen.getByText("ar: اتصل بنا")).toBeInTheDocument();

        browserLanguages = ["he-IL"];
        act(() => window.dispatchEvent(new Event("languagechange")));

        expect(screen.getByText("ar: اتصل بنا")).toBeInTheDocument();
    });

    it("falls back to English when browser preferences are unsupported", () => {
        browserLanguages = ["fr-FR", "de-DE"];
        localStorage.setItem("rt-radio-language", "unsupported");

        render(
            <LanguageProvider>
                <LanguageProbe />
            </LanguageProvider>,
        );

        expect(screen.getByText("en: Contact")).toBeInTheDocument();
        expect(document.documentElement).toHaveAttribute("dir", "ltr");
    });

    it("follows a new system language when the saved preference is invalid", () => {
        localStorage.setItem("rt-radio-language", "fr");
        browserLanguages = ["ru-RU"];

        render(
            <LanguageProvider>
                <LanguageProbe />
            </LanguageProvider>,
        );
        expect(screen.getByText("ru: Контакты")).toBeInTheDocument();

        browserLanguages = ["ar-EG"];
        act(() => window.dispatchEvent(new Event("languagechange")));

        expect(screen.getByText("ar: اتصل بنا")).toBeInTheDocument();
        expect(document.documentElement).toHaveAttribute("dir", "rtl");
    });

    it("uses English when browser language APIs are unavailable", () => {
        vi.stubGlobal("navigator", undefined);

        render(
            <LanguageProvider>
                <LanguageProbe />
            </LanguageProvider>,
        );

        expect(screen.getByText("en: Contact")).toBeInTheDocument();
    });

    it("uses browser preferences when local storage is unavailable", () => {
        vi.stubGlobal("localStorage", undefined);
        browserLanguages = ["ru-RU"];

        render(
            <LanguageProvider>
                <LanguageProbe />
            </LanguageProvider>,
        );

        expect(screen.getByText("ru: Контакты")).toBeInTheDocument();
    });

    it("removes the system language listener when unmounted", () => {
        const removeListener = vi.spyOn(window, "removeEventListener");
        const { unmount } = render(
            <LanguageProvider>
                <LanguageProbe />
            </LanguageProvider>,
        );

        unmount();

        expect(removeListener).toHaveBeenCalledWith(
            "languagechange",
            expect.any(Function),
        );
    });
});

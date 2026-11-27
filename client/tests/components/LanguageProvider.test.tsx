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
});

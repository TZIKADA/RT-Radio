import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const rootMocks = vi.hoisted(() => ({
    createRoot: vi.fn(),
    render: vi.fn(),
}));

vi.mock("react-dom/client", () => ({
    createRoot: rootMocks.createRoot,
}));
vi.mock("../../src/App", () => ({ default: () => null }));
vi.mock("../../src/auth/AuthProvider", () => ({ default: () => null }));
vi.mock("bootstrap-icons/font/bootstrap-icons.css", () => ({}));
vi.mock("../../src/styles/main.scss", () => ({}));

describe("application entry point", () => {
    beforeEach(() => {
        vi.resetModules();
        vi.stubEnv("VITE_SUPABASE_URL", "");
        vi.stubEnv("VITE_SUPABASE_PUBLISHABLE_KEY", "");
        document.body.innerHTML = '<div id="root"></div>';
        rootMocks.createRoot.mockClear();
        rootMocks.render.mockClear();
        rootMocks.createRoot.mockReturnValue({ render: rootMocks.render });
    });

    afterEach(() => {
        vi.unstubAllEnvs();
        vi.restoreAllMocks();
    });

    it("shows a generic startup error and logs missing Supabase configuration", async () => {
        const consoleError = vi
            .spyOn(console, "error")
            .mockImplementation(() => {});
        await import("../../src/main");

        expect(rootMocks.createRoot).toHaveBeenCalledWith(
            document.getElementById("root"),
        );
        expect(rootMocks.render).toHaveBeenCalledOnce();
        const markup = renderToStaticMarkup(rootMocks.render.mock.calls[0][0]);
        expect(markup).toContain("Unable to start RT-Radio");
        expect(markup).toContain("Contact information");
        expect(markup).not.toContain("VITE_SUPABASE_URL");
        expect(consoleError).toHaveBeenCalledWith(
            "[RT-Radio] Missing Supabase configuration",
            {
                supabaseUrlConfigured: false,
                supabasePublishableKeyConfigured: false,
            },
        );
    });

    it("logs and throws when the application root element is missing", async () => {
        const consoleError = vi
            .spyOn(console, "error")
            .mockImplementation(() => {});
        document.body.innerHTML = "";

        await expect(import("../../src/main")).rejects.toThrow(
            "Missing application root element.",
        );

        expect(rootMocks.createRoot).not.toHaveBeenCalled();
        expect(consoleError).toHaveBeenCalledWith(
            "[RT-Radio] Application root element is missing",
            expect.any(Error),
        );
    });

    it("loads the application when Supabase configuration is present", async () => {
        vi.stubEnv("VITE_SUPABASE_URL", "https://example.supabase.co");
        vi.stubEnv("VITE_SUPABASE_PUBLISHABLE_KEY", "test-publishable-key");

        await import("../../src/main");
        await new Promise((resolve) => setTimeout(resolve, 0));

        expect(rootMocks.render).toHaveBeenCalledOnce();
        const markup = renderToStaticMarkup(rootMocks.render.mock.calls[0][0]);
        expect(markup).not.toContain("Unable to start RT-Radio");
    });

    it("shows a generic startup error when lazy application loading fails", async () => {
        vi.stubEnv("VITE_SUPABASE_URL", "https://example.supabase.co");
        vi.stubEnv("VITE_SUPABASE_PUBLISHABLE_KEY", "test-publishable-key");
        const startupError = new Error("App module failed to load");
        const consoleError = vi
            .spyOn(console, "error")
            .mockImplementation(() => {});
        vi.doMock("../../src/App", () => {
            throw startupError;
        });

        try {
            await import("../../src/main");
            await vi.waitFor(() =>
                expect(consoleError).toHaveBeenCalledWith(
                    "[RT-Radio] Application failed to start",
                    expect.objectContaining({ cause: startupError }),
                ),
            );

            const lastRender = rootMocks.render.mock.calls.at(-1)?.[0];
            if (!lastRender) {
                throw new Error("Startup fallback was not rendered.");
            }
            const markup = renderToStaticMarkup(lastRender);
            expect(markup).toContain("Unable to start RT-Radio");
        } finally {
            vi.doUnmock("../../src/App");
        }
    });
});

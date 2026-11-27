import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const supabaseMocks = vi.hoisted(() => ({
    createClient: vi.fn(),
}));

vi.mock("@supabase/supabase-js", () => ({
    createClient: supabaseMocks.createClient,
}));

describe("Supabase client configuration", () => {
    beforeEach(() => {
        vi.resetModules();
        supabaseMocks.createClient.mockReturnValue({});
        vi.stubEnv("VITE_SUPABASE_URL", "https://example.supabase.co");
        vi.stubEnv("VITE_SUPABASE_PUBLISHABLE_KEY", "publishable-key");
    });

    afterEach(() => {
        vi.unstubAllEnvs();
    });

    it.each([
        ["VITE_SUPABASE_URL", ""],
        ["VITE_SUPABASE_PUBLISHABLE_KEY", ""],
    ])("requires %s to be configured", async (variable, value) => {
        vi.stubEnv(variable, value);

        await expect(import("../../src/lib/supabase")).rejects.toThrow(
            `Missing Supabase configuration. Set VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY.`,
        );
        expect(supabaseMocks.createClient).not.toHaveBeenCalled();
    });

    it("trims configuration values and creates the client", async () => {
        vi.stubEnv("VITE_SUPABASE_URL", " https://example.supabase.co ");
        vi.stubEnv("VITE_SUPABASE_PUBLISHABLE_KEY", " publishable-key ");

        await import("../../src/lib/supabase");

        expect(supabaseMocks.createClient).toHaveBeenCalledWith(
            "https://example.supabase.co",
            "publishable-key",
        );
    });
});

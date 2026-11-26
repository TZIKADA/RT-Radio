import type { ReactElement, ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const rootMocks = vi.hoisted(() => ({
    createRoot: vi.fn(),
    render: vi.fn(),
}));

vi.mock("react-dom/client", () => ({
    createRoot: rootMocks.createRoot,
}));
vi.mock("./App", () => ({ default: () => null }));
vi.mock("./components/AuthProvider", () => ({
    default: ({ children }: { children: ReactNode }) => children,
}));
vi.mock("bootstrap-icons/font/bootstrap-icons.css", () => ({}));
vi.mock("./styles/main.scss", () => ({}));

describe("application entry point", () => {
    beforeEach(() => {
        document.body.innerHTML = '<div id="root"></div>';
        rootMocks.createRoot.mockReturnValue({ render: rootMocks.render });
    });

    it("mounts the React application into the root element", async () => {
        await import("./main");

        expect(rootMocks.createRoot).toHaveBeenCalledWith(
            document.getElementById("root"),
        );
        expect(rootMocks.render).toHaveBeenCalledOnce();

        const element = rootMocks.render.mock.calls[0][0] as ReactElement<{
            children: ReactNode;
        }>;
        expect(element.type).toBe((await import("react")).StrictMode);
    });
});

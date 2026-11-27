import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import RefetchButton from "../../src/components/RefetchButton";

describe("RefetchButton", () => {
    it("renders nothing when no update is available", () => {
        const { container } = render(
            <RefetchButton
                updateAvailable={false}
                checking={false}
                onClick={() => {}}
            />,
        );
        expect(container).toBeEmptyDOMElement();
    });

    it("renders the control and calls onClick when an update is available", async () => {
        const onClick = vi.fn();
        render(
            <RefetchButton
                updateAvailable
                checking={false}
                onClick={onClick}
            />,
        );

        const button = screen.getByRole("button");
        await userEvent.click(button);
        expect(onClick).toHaveBeenCalledOnce();
    });

    it("disables the control while refetching", () => {
        render(
            <RefetchButton updateAvailable checking onClick={() => {}} />,
        );
        expect(screen.getByRole("button")).toBeDisabled();
    });
});

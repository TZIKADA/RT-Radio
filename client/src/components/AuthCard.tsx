import type { ReactNode } from "react";
import { Card, Container } from "react-bootstrap";
import AppControls from "./AppControls";

export default function AuthCard({
    title,
    width = "25rem",
    children,
}: {
    title: string;
    width?: string;
    children: ReactNode;
}) {
    return (
        <Container
            fluid
            className="d-flex align-items-center justify-content-center min-vh-100 py-5"
        >
            <Card className="shadow" style={{ width, maxWidth: "100%" }}>
                <Card.Body className="p-4">
                    <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-4">
                        <Card.Title as="h1" className="h3 mb-0">
                            {title}
                        </Card.Title>
                        <AppControls />
                    </div>
                    {children}
                </Card.Body>
            </Card>
        </Container>
    );
}

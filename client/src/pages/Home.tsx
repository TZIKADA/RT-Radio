import { useEffect, useState } from "react";
import { Button, Card, Container, Modal } from "react-bootstrap";
import { supabase } from "../lib/supabase";

type Todo = {
    id: string | number;
    name: string;
};

export default function Home() {
    const [showDocs, setShowDocs] = useState(false);
    const [todos, setTodos] = useState<Todo[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        async function getTodos() {
            const { data, error } = await supabase.from("todos").select();

            if (error) {
                console.error(error);
                setError(error.message);
            } else {
                setTodos(data ?? []);
            }
            setLoading(false);
        }

        getTodos();
    }, []);

    return (
        <>
            {/* <Header /> */}

            <Container fluid className="d-flex align-items-center py-5">
                <Card className="shadow" style={{ width: "25rem" }}>
                    <Card.Body className="p-4">
                        <Card.Title as="h5">Main Header File</Card.Title>
                        <Card.Text>
                            Please follow the guide in the doc. Non-linux guides
                            offer pictures with examples.
                        </Card.Text>
                        <div className="d-flex align-items-center justify-content-center gap-4 p-3">
                            <Button
                                variant="secondary"
                                onClick={() => setShowDocs(true)}
                            >
                                Documentation
                            </Button>
                            <Button variant="primary" href="#">
                                Download
                            </Button>
                        </div>

                        {/* Todos section */}
                        <hr />
                        <Card.Subtitle as="h6" className="mb-2">
                            Todos
                        </Card.Subtitle>

                        {loading && <p className="text-muted mb-0">Loading…</p>}

                        {error && (
                            <p className="text-danger mb-0">
                                Failed to load todos: {error}
                            </p>
                        )}

                        {!loading && !error && todos.length === 0 && (
                            <p className="text-muted mb-0">No todos yet.</p>
                        )}

                        {!loading && !error && todos.length > 0 && (
                            <ul className="mb-0 ps-3">
                                {todos.map((todo) => (
                                    <li key={todo.id}>{todo.name}</li>
                                ))}
                            </ul>
                        )}
                    </Card.Body>
                </Card>
            </Container>

            <Modal show={showDocs} onHide={() => setShowDocs(false)}>
                <Modal.Header closeButton>
                    <Modal.Title as="h1" className="fs-5">
                        Documentation
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body>TBA</Modal.Body>
                <Modal.Footer>
                    <Button
                        variant="secondary"
                        onClick={() => setShowDocs(false)}
                    >
                        Close
                    </Button>
                </Modal.Footer>
            </Modal>

            {/* <Footer /> */}
        </>
    );
}

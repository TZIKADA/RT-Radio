import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router";

import "bootstrap-icons/font/bootstrap-icons.css";
import "./styles/main.scss";

const rootElement = document.getElementById("root");
if (!rootElement) throw new Error("Missing application root element.");

const root = createRoot(rootElement);

function showStartupError(title: string, message: string) {
    root.render(
        <StrictMode>
            <main className="container py-5">
                <div className="alert alert-warning" role="alert">
                    <h1 className="h3">{title}</h1>
                    <p>{message}</p>
                </div>
            </main>
        </StrictMode>,
    );
}

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL?.trim();
const supabasePublishableKey =
    import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY?.trim();

if (!supabaseUrl || !supabasePublishableKey) {
    showStartupError(
        "RT-Radio setup required",
        "Copy .env.example to .env.local, set VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY to your Supabase project values, then restart the dev server.",
    );
} else {
    void Promise.all([import("./App"), import("./components/AuthProvider")])
        .then(([{ default: App }, { default: AuthProvider }]) => {
            root.render(
                <StrictMode>
                    <BrowserRouter>
                        <AuthProvider>
                            <App />
                        </AuthProvider>
                    </BrowserRouter>
                </StrictMode>,
            );
        })
        .catch((error: unknown) => {
            console.error("RT-Radio failed to start.", error);
            showStartupError(
                "RT-Radio failed to start",
                error instanceof Error ? error.message : "Unknown startup error.",
            );
        });
}

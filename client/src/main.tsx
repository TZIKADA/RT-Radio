import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router";
import { logAppError } from "./lib/errors";

import "bootstrap-icons/font/bootstrap-icons.css";
import "./styles/main.scss";

const rootElement = document.getElementById("root");
if (!rootElement) {
    const error = new Error("Missing application root element.");
    logAppError("Application root element is missing", error);
    throw error;
}

const root = createRoot(rootElement);

function showStartupError() {
    root.render(
        <StrictMode>
            <main className="container py-5">
                <div className="alert alert-warning" role="alert">
                    <h1 className="h3">Unable to start RT-Radio</h1>
                    <p>
                        The service is unavailable. Please contact the site
                        administrator.
                    </p>
                    <a href="/contact.html">Contact information</a>
                </div>
            </main>
        </StrictMode>,
    );
}

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL?.trim();
const supabasePublishableKey =
    import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY?.trim();

if (!supabaseUrl || !supabasePublishableKey) {
    logAppError("Missing Supabase configuration", {
        supabaseUrlConfigured: Boolean(supabaseUrl),
        supabasePublishableKeyConfigured: Boolean(supabasePublishableKey),
    });
    showStartupError();
} else {
    void Promise.all([import("./App"), import("./auth/AuthProvider")])
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
            logAppError("Application failed to start", error);
            showStartupError();
        });
}

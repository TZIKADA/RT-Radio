import { Routes, Route } from "react-router";
import RequireAuth from "./components/RequireAuth";
import Login from "./pages/Login";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import SignUp from "./pages/SignUp";
import Home from "./pages/Home";

export default function App() {
    return (
        <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/sign-up" element={<SignUp />} />

            <Route element={<RequireAuth />}>
                <Route path="/" element={<Home />} />
            </Route>
        </Routes>
    );
}

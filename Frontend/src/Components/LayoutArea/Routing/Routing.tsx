import { Navigate, Route, Routes } from "react-router-dom";
import { About } from "../../PagesArea/About/About";
import { Home } from "../../PagesArea/Home/Home";
import { Page404 } from "../../PagesArea/Page404/Page404";

export function Routing() {
    return (
        <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/c/:conversationId" element={<Home />} />
            <Route path="/home" element={<Navigate to="/" replace />} />
            <Route path="/about" element={<About />} />
            <Route path="*" element={<Page404 />} />
        </Routes>
    );
}

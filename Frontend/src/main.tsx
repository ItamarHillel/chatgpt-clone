// The global styles are imported first, so each component's own CSS can override them.
import "./index.css";

import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { Layout } from "./Components/LayoutArea/Layout/Layout";
import { ChatProvider } from "./Context/ChatProvider";

createRoot(document.getElementById("root")!).render(
    <StrictMode>
        <BrowserRouter>
            <ChatProvider>
                <Layout />
            </ChatProvider>
        </BrowserRouter>
    </StrictMode>,
);

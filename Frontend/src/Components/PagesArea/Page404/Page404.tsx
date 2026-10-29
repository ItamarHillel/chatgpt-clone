import { useEffect } from "react";
import { Link } from "react-router-dom";
import { appConfig } from "../../../Utils/AppConfig";
import "./Page404.css";

export function Page404() {
    useEffect(() => {
        document.title = `Page not found | ${appConfig.appName}`;
    }, []);

    return (
        <div className="Page404">
            <p className="Page404-code">404</p>
            <h1>Page not found</h1>
            <p>The page you are looking for doesn't exist.</p>
            <Link to="/" className="button">Back to the chat</Link>
        </div>
    );
}

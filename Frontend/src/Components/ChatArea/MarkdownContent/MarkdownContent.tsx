import "highlight.js/styles/github-dark.css";
import { memo, useRef, type ReactNode } from "react";
import Markdown, { type Components } from "react-markdown";
import rehypeHighlight from "rehype-highlight";
import remarkGfm from "remark-gfm";
import { getTextDirection } from "../../../Utils/TextUtils";
import { CopyButton } from "../../SharedArea/CopyButton/CopyButton";
import "./MarkdownContent.css";

function CodeBlock({ language, children }: { language?: string; children: ReactNode }) {
    const preRef = useRef<HTMLPreElement>(null);
    return (
        <div className="CodeBlock">
            <div className="CodeBlock-header">
                <span>{language ?? "code"}</span>
                <CopyButton getText={() => preRef.current?.innerText ?? ""} showLabel />
            </div>
            <pre ref={preRef}>{children}</pre>
        </div>
    );
}

const components: Components = {
    pre({ node, children }) {
        // The language comes from the code fence (```python) as a "language-python" class on <code>.
        const code = node?.children[0];
        const classNames = code?.type === "element" ? code.properties.className : undefined;
        const language = Array.isArray(classNames)
            ? classNames.map(String).find(name => name.startsWith("language-"))?.slice("language-".length)
            : undefined;
        return <CodeBlock language={language}>{children}</CodeBlock>;
    },
    a({ href, children }) {
        return <a href={href} target="_blank" rel="noopener noreferrer">{children}</a>;
    },
    table({ children }) {
        return <div className="MarkdownContent-table"><table>{children}</table></div>;
    },
};

interface MarkdownContentProps {
    content: string;
    isStreaming?: boolean;
}

/** Renders an AI reply written in Markdown (GitHub flavor) with syntax highlighted code. Raw HTML is not rendered. */
export const MarkdownContent = memo(function MarkdownContent({ content, isStreaming }: MarkdownContentProps) {
    return (
        <div className={`MarkdownContent ${isStreaming ? "streaming" : ""}`} dir={getTextDirection(content)}>
            <Markdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeHighlight]} components={components}>
                {content}
            </Markdown>
        </div>
    );
});

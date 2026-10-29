const TITLE_MAX_LENGTH = 60;

/** Same rule the server uses (make_title in conversations_logic.py): the first user message becomes the title. */
export function makeTitle(content: string): string {
    const title = content.split(/\s+/).filter(Boolean).join(" ");
    if (title.length <= TITLE_MAX_LENGTH) return title;
    let cut = title.slice(0, TITLE_MAX_LENGTH - 1);
    const lastSpace = cut.lastIndexOf(" ");
    if (lastSpace > TITLE_MAX_LENGTH / 2) cut = cut.slice(0, lastSpace);
    return cut.replace(/[ ,.;:-]+$/, "") + "…";
}

const RTL_LETTERS = /[֐-׿؀-ۿ]/g;
const LTR_LETTERS = /[A-Za-z]/g;
const CODE = /```[\s\S]*?(```|$)|`[^`]*`/g;

/**
 * The direction of a whole message, by the language most of it is written in (code is ignored).
 * Unlike dir="auto" (first letter only), a Hebrew reply that starts with an English word such as "SQL" is still right-to-left.
 */
export function getTextDirection(text: string): "rtl" | "ltr" {
    const prose = text.replace(CODE, " ");
    const rtl = prose.match(RTL_LETTERS)?.length ?? 0;
    const ltr = prose.match(LTR_LETTERS)?.length ?? 0;
    return rtl > ltr ? "rtl" : "ltr";
}

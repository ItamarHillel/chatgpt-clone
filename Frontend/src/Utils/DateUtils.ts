import type { ConversationModel } from "../Models/ConversationModel";

export interface ConversationGroup {
    label: string;
    conversations: ConversationModel[];
}

const DAY = 24 * 60 * 60 * 1000;

/** Groups conversations (already sorted newest first) like ChatGPT: Today, Yesterday, Previous 7 days... */
export function groupByDate(conversations: ConversationModel[]): ConversationGroup[] {
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    const today = startOfToday.getTime();

    const groups: ConversationGroup[] = [
        { label: "Today", conversations: [] },
        { label: "Yesterday", conversations: [] },
        { label: "Previous 7 days", conversations: [] },
        { label: "Previous 30 days", conversations: [] },
        { label: "Older", conversations: [] },
    ];

    for (const conversation of conversations) {
        const time = new Date(conversation.updatedAt).getTime();
        const index = time >= today ? 0 : time >= today - DAY ? 1 : time >= today - 7 * DAY ? 2 : time >= today - 30 * DAY ? 3 : 4;
        groups[index].conversations.push(conversation);
    }
    return groups.filter(group => group.conversations.length > 0);
}

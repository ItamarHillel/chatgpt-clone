import axios from "axios";
import type { ConversationDetailsModel, ConversationModel } from "../Models/ConversationModel";
import { appConfig } from "../Utils/AppConfig";

class ConversationsService {

    public async getAllConversations(): Promise<ConversationModel[]> {
        const response = await axios.get<ConversationModel[]>(appConfig.conversationsUrl);
        return response.data;
    }

    public async getConversation(conversationId: string, signal?: AbortSignal): Promise<ConversationDetailsModel> {
        const response = await axios.get<ConversationDetailsModel>(`${appConfig.conversationsUrl}/${conversationId}`, { signal });
        return response.data;
    }

    public async addConversation(signal?: AbortSignal): Promise<ConversationModel> {
        const response = await axios.post<ConversationModel>(appConfig.conversationsUrl, undefined, { signal });
        return response.data;
    }

    public async deleteConversation(conversationId: string): Promise<void> {
        await axios.delete(`${appConfig.conversationsUrl}/${conversationId}`);
    }
}

export const conversationsService = new ConversationsService();

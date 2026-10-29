import axios from "axios";
import type { HealthModel } from "../Models/HealthModel";
import { appConfig } from "../Utils/AppConfig";

class HealthService {

    public async getHealth(): Promise<HealthModel> {
        const response = await axios.get<HealthModel>(appConfig.healthUrl);
        return response.data;
    }
}

export const healthService = new HealthService();

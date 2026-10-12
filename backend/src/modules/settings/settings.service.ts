import { env } from "../../config/env";
import { SettingsRepository, settingsRepository } from "./settings.repository";

export const SETTING_KEYS = {
  COMMISSION_PERCENT: "commission_percent",
} as const;

export interface CommissionSettingResponse {
  commissionPercent: number;
  updatedAt?: Date;
}

export class SettingsService {
  constructor(
    private readonly settingsRepo: SettingsRepository = settingsRepository,
  ) {}

  async getCommissionPercent(): Promise<number> {
    const setting = await this.settingsRepo.findByKey(
      SETTING_KEYS.COMMISSION_PERCENT,
    );

    const fallbackCommission = env.COMMISSION_PERCENT;

    if (!setting) {
      return fallbackCommission;
    }

    const parsed = Number(setting.value);
    return setting.value.trim() !== "" && Number.isInteger(parsed) && parsed >= 0 && parsed <= 100 ? parsed : fallbackCommission;
  }

  async getCommission(): Promise<CommissionSettingResponse> {
    const setting = await this.settingsRepo.findByKey(
      SETTING_KEYS.COMMISSION_PERCENT,
    );
    
    const fallbackCommission = env.COMMISSION_PERCENT;

    if (!setting) {
      return {
        commissionPercent: fallbackCommission,
      };
    }

    const parsed = Number(setting.value);
    return {
      commissionPercent: setting.value.trim() !== "" && Number.isInteger(parsed) && parsed >= 0 && parsed <= 100
        ? parsed
        : fallbackCommission,
      updatedAt: setting.updatedAt,
    };
  }

  async updateCommission(
    commissionPercent: number,
  ): Promise<CommissionSettingResponse> {
    const setting = await this.settingsRepo.upsert(
      SETTING_KEYS.COMMISSION_PERCENT,
      commissionPercent.toString(),
    );

    console.info(
      JSON.stringify({
        level: "info",
        event: "MARKETPLACE_COMMISSION_UPDATED",
        commissionPercent,
        updatedAt: setting.updatedAt.toISOString(),
      }),
    );

    return {
      commissionPercent,
      updatedAt: setting.updatedAt,
    };
  }
}

export const settingsService = new SettingsService();

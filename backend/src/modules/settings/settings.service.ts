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

  /**
   * Get the current effective commission percentage as an integer (0-100).
   * Reads from database settings table; falls back to env.COMMISSION_PERCENT if not configured.
   */
  async getCommissionPercent(): Promise<number> {
    const setting = await this.settingsRepo.findByKey(
      SETTING_KEYS.COMMISSION_PERCENT,
    );

    if (!setting) {
      return env.COMMISSION_PERCENT;
    }

    const parsed = parseInt(setting.value, 10);
    return Number.isFinite(parsed) ? parsed : env.COMMISSION_PERCENT;
  }

  /**
   * Get current commission settings payload for API response
   */
  async getCommission(): Promise<CommissionSettingResponse> {
    const setting = await this.settingsRepo.findByKey(
      SETTING_KEYS.COMMISSION_PERCENT,
    );

    if (!setting) {
      return {
        commissionPercent: env.COMMISSION_PERCENT,
      };
    }

    const parsed = parseInt(setting.value, 10);
    return {
      commissionPercent: Number.isFinite(parsed)
        ? parsed
        : env.COMMISSION_PERCENT,
      updatedAt: setting.updatedAt,
    };
  }

  /**
   * Update the marketplace platform commission percentage.
   * Future orders will use this value; past orders remain immutable.
   */
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

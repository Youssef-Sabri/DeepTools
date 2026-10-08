import { Setting } from '@prisma/client';
import { prisma } from '../../config/database';

export class SettingsRepository {
  /**
   * Find setting entry by its unique key
   */
  async findByKey(key: string): Promise<Setting | null> {
    return prisma.setting.findUnique({
      where: { key },
    });
  }

  /**
   * Upsert a setting entry by key
   */
  async upsert(key: string, value: string): Promise<Setting> {
    return prisma.setting.upsert({
      where: { key },
      update: { value },
      create: { key, value },
    });
  }
}

export const settingsRepository = new SettingsRepository();

import { Request, Response } from "express";
import { SettingsService, settingsService } from "./settings.service";
import { UpdateCommissionInput } from "./settings.validator";

export class SettingsController {
  constructor(private readonly service: SettingsService = settingsService) {}

  getCommission = async (_req: Request, res: Response): Promise<void> => {
    const data = await this.service.getCommission();
    res.status(200).json({
      success: true,
      data,
    });
  };

  updateCommission = async (req: Request, res: Response): Promise<void> => {
    const { commissionPercent } = req.body as UpdateCommissionInput;
    const data = await this.service.updateCommission(commissionPercent);
    res.status(200).json({
      success: true,
      message: "Commission percentage updated successfully",
      data,
    });
  };
}

export const settingsController = new SettingsController();

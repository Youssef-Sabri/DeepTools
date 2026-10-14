import { Request, Response } from "express";
import { paymentsService } from "./payments.service";

export class PaymentsController {
  handleWebhook = async (req: Request, res: Response): Promise<void> => {
    const result = await paymentsService.handleWebhook(
      req.params.provider as string,
      req.body as Buffer,
      req.headers,
    );
    res.status(200).json({ success: true, data: result });
  };
}

export const paymentsController = new PaymentsController();

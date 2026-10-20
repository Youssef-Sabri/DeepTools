import { Request, Response } from "express";
import { OrdersService, ordersService } from "./orders.service";
import { listOrdersQuerySchema } from "./orders.validator";

export class OrdersController {
  constructor(private readonly service: OrdersService = ordersService) {}

  getMyPurchases = async (req: Request, res: Response): Promise<void> => {
    const data = await this.service.getMyPurchases(
      req.user!.id,
      listOrdersQuerySchema.parse(req.query),
    );
    res.status(200).json({ success: true, data });
  };

  getSellerSales = async (req: Request, res: Response): Promise<void> => {
    const data = await this.service.getSellerSales(
      req.user!.id,
      listOrdersQuerySchema.parse(req.query),
    );
    res.status(200).json({ success: true, data });
  };
}

export const ordersController = new OrdersController();

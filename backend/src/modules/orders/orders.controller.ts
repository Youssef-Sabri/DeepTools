import { Request, Response } from "express";
import { OrdersService, ordersService } from "./orders.service";
import { listOrdersQuerySchema } from "./orders.validator";

export class OrdersController {
  constructor(private readonly service: OrdersService = ordersService) {}

  getMyPurchases = async (req: Request, res: Response): Promise<void> => {
    const userId = req.user!.id;
    const query = listOrdersQuerySchema.parse(req.query);
    const data = await this.service.getMyPurchases(userId, query);
    res.status(200).json({ success: true, data });
  };

  getSellerSales = async (req: Request, res: Response): Promise<void> => {
    const sellerId = req.user!.id;
    const query = listOrdersQuerySchema.parse(req.query);
    const data = await this.service.getSellerSales(sellerId, query);
    res.status(200).json({ success: true, data });
  };
}

export const ordersController = new OrdersController();

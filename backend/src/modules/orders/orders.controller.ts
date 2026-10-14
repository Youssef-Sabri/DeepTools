import { Request, Response } from "express";
import { OrdersService, ordersService } from "./orders.service";
import {
  listOrdersQuerySchema,
  guestPurchaseSchema,
  guestRequestAccessSchema,
  guestVerifyAccessQuerySchema,
} from "./orders.validator";
import { setGuestSession, readGuestEmail } from "../auth/session";
import { ApiError } from "../../utils/apiError";

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

  postGuestPurchase = async (req: Request, res: Response): Promise<void> => {
    const input = guestPurchaseSchema.parse(req.body);
    const result = await this.service.purchaseAsGuest(input, req.user?.id);
    setGuestSession(res, input.buyerEmail);
    res.status(201).json({
      success: true,
      statusCode: 201,
      message: req.t("orders.guestPurchaseSuccess"),
      data: result,
    });
  };

  postRequestAccess = async (req: Request, res: Response): Promise<void> => {
    const body = guestRequestAccessSchema.parse(req.body);
    const result = await this.service.requestGuestAccess(body.email);
    res.status(200).json({
      ...result,
      message: req.t("orders.magicLinkSent"),
    });
  };

  getVerifyAccess = async (req: Request, res: Response): Promise<void> => {
    const query = guestVerifyAccessQuerySchema.parse(req.query);
    const result = await this.service.verifyGuestAccess(query.token);
    setGuestSession(res, result.email);
    res.status(200).json({
      success: true,
      message: req.t("orders.guestSessionUnlocked"),
      data: result,
    });
  };

  getGuestPurchases = async (req: Request, res: Response): Promise<void> => {
    const guestEmail = readGuestEmail(req);
    if (!guestEmail) {
      throw ApiError.unauthorized(
        "Active guest session is required to access purchases",
      );
    }
    const result = await this.service.getGuestPurchases(guestEmail);
    res.status(200).json({
      success: true,
      data: result,
    });
  };

  getGuestSession = (req: Request, res: Response): void => {
    const guestEmail = readGuestEmail(req);
    if (!guestEmail) {
      res.status(200).json({
        success: true,
        data: { active: false, email: null },
      });
      return;
    }
    res.status(200).json({
      success: true,
      data: { active: true, email: guestEmail },
    });
  };
}

export const ordersController = new OrdersController();

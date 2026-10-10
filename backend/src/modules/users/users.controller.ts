import { Request, Response } from "express";
import { usersService, UsersService } from "./users.service";

export class UsersController {
  constructor(private readonly service: UsersService = usersService) {}

  // Get current authenticated user
  getMe = async (req: Request, res: Response): Promise<void> => {
    // req.user is guaranteed by authenticate middleware
    const userId = req.user!.id;
    const profile = await this.service.getUserProfile(userId);

    res.status(200).json({
      success: true,
      statusCode: 200,
      message: "User profile retrieved successfully",
      data: profile,
    });
  };

  // Update user profile
  updateProfile = async (req: Request, res: Response): Promise<void> => {
    const userId = req.user!.id;
    const profile = await this.service.updateProfile(userId, req.body);

    res.status(200).json({
      success: true,
      statusCode: 200,
      message: "Profile updated successfully",
      data: profile,
    });
  };

  // Change password
  changePassword = async (req: Request, res: Response): Promise<void> => {
    const userId = req.user!.id;
    await this.service.changePassword(userId, req.body);

    res.status(200).json({
      success: true,
      statusCode: 200,
      message: "Password changed successfully",
    });
  };
}

export const usersController = new UsersController();

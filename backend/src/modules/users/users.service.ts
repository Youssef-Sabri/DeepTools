import bcrypt from "bcryptjs";
import { UsersRepository, usersRepository } from "./users.repository";
import { ApiError } from "../../utils/apiError";
import { env } from "../../config/env";
import { UpdateProfileInput, ChangePasswordInput } from "./users.validator";

export class UsersService {
  constructor(private readonly repo: UsersRepository = usersRepository) {}

  async getUserProfile(userId: string) {
    const user = await this.repo.findActiveProfile(userId);
    if (!user) {
      throw ApiError.notFound("User not found or account deactivated");
    }
    return user;
  }

  async updateProfile(userId: string, input: UpdateProfileInput) {
    const userExists = await this.repo.findActiveById(userId);
    if (!userExists) {
      throw ApiError.notFound("User not found or account deactivated");
    }

    return this.repo.updateProfile(userId, input.name);
  }

  async changePassword(userId: string, input: ChangePasswordInput) {
    const user = await this.repo.findActiveById(userId);
    if (!user) throw ApiError.notFound("User not found or account deactivated");

    const isMatch = await bcrypt.compare(
      input.currentPassword,
      user.passwordHash,
    );
    if (!isMatch) {
      throw ApiError.badRequest("Incorrect current password");
    }

    const isSame = await bcrypt.compare(input.newPassword, user.passwordHash);
    if (isSame) {
      throw ApiError.badRequest(
        "New password cannot be the same as the current one",
      );
    }

    const saltRounds = Number(env.BCRYPT_SALT_ROUNDS);
    const newPasswordHash = await bcrypt.hash(input.newPassword, saltRounds);

    const updated = await this.repo.updatePasswordOptimistic(
      userId,
      user.passwordHash,
      user.tokenVersion,
      newPasswordHash,
    );
    if (updated.count !== 1)
      throw ApiError.conflict(
        "Password changed; retry with current credentials",
      );
  }
}

export const usersService = new UsersService();

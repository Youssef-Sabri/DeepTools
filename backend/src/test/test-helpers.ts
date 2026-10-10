import jwt from "jsonwebtoken";
import { env } from "../config/env";

export const mockUser = {
  id: "a0000000-0000-0000-0000-000000000001",
  name: "Regular Seller User",
  email: "seller@example.com",
  role: "user",
};

export const mockAdmin = {
  id: "b0000000-0000-0000-0000-000000000002",
  name: "Platform Admin",
  email: "admin@example.com",
  role: "admin",
};

export const mockBuyer = {
  id: "c0000000-0000-0000-0000-000000000003",
  name: "Regular Buyer User",
  email: "buyer@example.com",
  role: "user",
};

export function createToken(user: {
  id: string;
  email: string;
  role: string;
}): string {
  return jwt.sign(
    {
      sub: user.id,
      email: user.email,
      role: user.role,
    },
    env.JWT_SECRET,
    { expiresIn: "1h" },
  );
}

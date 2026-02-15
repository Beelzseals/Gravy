import { Router } from "express";
import { UserRepository } from "../users/user.repository";
import { OrganizationRepository } from "../organizations/organization.repository";
import { SessionRepository } from "./session.repository";
import { AuthService } from "./auth.service";
import { CustomRequest } from "../../infra/http/auth.middleware";

export const router = Router();

const services = new AuthService(
  new SessionRepository(),
  new OrganizationRepository(),
  new UserRepository(),
);

router.post("/refresh", async (req: CustomRequest, res) => {
  const { refreshToken } = req.body;

  const result = await services.refresh(refreshToken, req.user?.orgId || "");

  res.json(result);
});

import { Router } from "express";
import { UserRepository } from "../users/user.repository";
import { OrgMembershipRepository } from "../organizations/membership/membership.repository";
import { SessionRepository } from "./session.repository";
import { AuthService } from "./auth.service";
import { CustomRequest } from "../../infra/http/auth.middleware";

export const router = Router();

const services = new AuthService(
  new SessionRepository(),
  new OrgMembershipRepository(),
  new UserRepository(),
);

router.post("/refresh", async (req: CustomRequest, res) => {
  const { refreshToken } = req.body;

  const result = await services.refresh(refreshToken, req.auth?.orgId || "");

  res.json(result);
});

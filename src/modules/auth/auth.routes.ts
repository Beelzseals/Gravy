import { Router } from "express";
import { UserRepository } from "../users/user.repository";
import { OrgMembershipRepository } from "../organizations/membership/membership.repository";
import { SessionRepository } from "./session.repository";
import { AuthService } from "./auth.service";
import { REFRESH_COOKIE, cookieOptions } from "./token.util";

export const router = Router();

const services = new AuthService(
  new SessionRepository(),
  new OrgMembershipRepository(),
  new UserRepository(),
);

router.post("/login", async (req, res) => {
  const { email, password, orgId } = req.body;

  const { accessToken, refreshToken } = await services.login(
    email,
    password,
    orgId,
  );

  res.cookie(REFRESH_COOKIE, refreshToken, cookieOptions);
  res.json({ accessToken });
});

router.post("/refresh", async (req, res) => {
  const refreshToken = req.cookies?.[REFRESH_COOKIE];
  const { orgId } = req.body;

  if (!refreshToken) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const result = await services.refresh(refreshToken, orgId);

  if (result) {
    res.cookie(REFRESH_COOKIE, result.refreshToken, cookieOptions);
    res.json({ accessToken: result.accessToken });
  }
});

router.post("/logout", async (req, res) => {
  const refreshToken = req.cookies?.[REFRESH_COOKIE];

  if (refreshToken) {
    await services.logout(refreshToken);
  }

  res.clearCookie(REFRESH_COOKIE, { path: "/auth" });
  res.json({ message: "Logged out successfully" });
});

import { AuthRepository } from "./session.repository";
import { OrganizationRepository } from "../organizations/organization.repository";
import { hasRequiredRole } from "../../core/authorization/policies";
import { UserRepository } from "../users/user.repository";
import { signAccessToken } from "../../core/authorization/token";
import bcrypt from "bcrypt";

export class AuthService {
  constructor(
    private authRepo: AuthRepository,
    private orgRepo: OrganizationRepository,
    private userRepo: UserRepository,
  ) {}

  async login(email: string, password: string, orgId: string) {
    const user = await this.userRepo.findByEmail(email);
    const isValid = await bcrypt.compare(password, user?.passwordHash || "");
    // check user/email and password
    if (!isValid || !user) {
      throw new Error("Invalid credentials");
    }
    // check role for the organization
    const role = await this.orgRepo.getUserRole(user.id, orgId);
    if (!hasRequiredRole(role, "MEMBER")) {
      throw new Error("User does not have the required role");
    }

    const accessToken = signAccessToken({ userId: user.id, orgId, role });

    const refreshToken = await this.authRepo.createSession(user.id);

    return { accessToken, refreshToken };
  }

  // Check credentials and return new access token if valid
  async refresh(refreshToken: string, orgId: string) {
    const session = await this.authRepo.findSessionByRefreshToken(refreshToken);

    // check if session exists and is valid
    if (!session || new Date(session.expiresAt) < new Date()) {
      throw new Error("Invalid refresh token");
    }

    //check if user role is valid
    const role = await this.orgRepo.getUserRole(session.userId, orgId);
    if (!hasRequiredRole(role, "MEMBER")) {
      throw new Error("User does not have the required role");
    }

    const accessToken = signAccessToken({
      userId: session.userId,
      orgId,
      role,
    });

    return { accessToken };
  }

  async logout(refreshToken: string) {
    await this.authRepo.revokeSession(refreshToken);
  }
}

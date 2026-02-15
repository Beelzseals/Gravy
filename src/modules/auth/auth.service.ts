import { SessionRepository } from "./session.repository";
import { OrganizationRepository } from "../organizations/organization.repository";
import { hasRequiredRole } from "../../core/authorization/policies";
import { UserRepository } from "../users/user.repository";
import { signAccessToken } from "../../core/authorization/token";
import bcrypt from "bcrypt";
import { generateSecureToken, hashToken } from "./token.util";
import { Session } from "./session.schema";

export class AuthService {
  constructor(
    private sessionRepo: SessionRepository,
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

    const refreshToken = await this.sessionRepo.createSession({
      userId: user.id,
      tokenHash: hashToken(generateSecureToken()),
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
    });

    return { accessToken, refreshToken };
  }

  // Check credentials and return new access token if valid
  async refresh(refreshToken: string, orgId: string) {
    const tokenHash = hashToken(refreshToken);

    const revoked = await this.sessionRepo.revokeSessionChain(tokenHash);

    if (!revoked) {
      return this.handleReuse(tokenHash);
    }

    return this.completeRotation(revoked[0], orgId);
  }

  async handleReuse(refreshToken: string) {
    const session = await this.sessionRepo.findByTokenHash(refreshToken);

    if (!session) {
      throw new Error("Unauthorized");
    }

    const revokedRecently =
      session.revokedAt &&
      Date.now() - new Date(session.revokedAt).getTime() < 2000; // 2 seconds

    if (revokedRecently) {
      //TODO
    }

    await this.markSessionCompromised(refreshToken);

    throw new Error("Unauthorized");
  }

  private async completeRotation(oldSession: Session, orgId: string) {
    const newRefreshToken = generateSecureToken();
    const newHash = hashToken(newRefreshToken);
    const role = await this.orgRepo.getUserRole(oldSession.userId, orgId);

    // Create & insert new session with parentTokenId pointing to old session
    await this.sessionRepo.insertRotatedSession({
      userId: oldSession.userId,
      tokenHash: newHash,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      parentTokenId: oldSession.tokenHash,
      userAgent: oldSession.userAgent,
      ipAddress: oldSession.ipAddress,
    });

    const accessToken = signAccessToken({
      userId: oldSession.userId,
      orgId: orgId,
      role: role,
    });

    return {
      accessToken,
      refreshToken: newRefreshToken,
    };
  }

  async markSessionCompromised(refreshToken: string) {
    //TODO
    const session = await this.sessionRepo.findByTokenHash(refreshToken);
  }

  async logout(refreshToken: string) {
    await this.sessionRepo.revokeSessionChain(refreshToken);
  }
}

import { Router, Response, NextFunction } from "express";
import { CustomRequest } from "../../../infra/http/auth.middleware";
import { ProjectMembershipService } from "./membership.service";
import { ProjectRole } from "../../../core/authorization/roles";
import { ProjectMembershipRepository } from "./membership.repository";
import { OrgMembershipRepository } from "../../organizations/membership/membership.repository";
import { ProjectPolicy } from "../project.policy";
import { ProjectRepository } from "../project.repository";
import { db } from "../../../infra/db/client";

const router = Router({ mergeParams: true });
const membershipService = new ProjectMembershipService(
  new OrgMembershipRepository(),
  new ProjectMembershipRepository(),
  new ProjectPolicy(),
  new ProjectRepository(),
  db,
);

/**
 * POST /projects/:projectId/members
 * Add a member to a project
 */
router.post(
  "/",
  async (
    req: CustomRequest<{ projectId: string }>,
    res: Response,
    next: NextFunction,
  ) => {
    try {
      const { projectId } = req.params;
      const { userId: actorUserId, orgId } = req.auth!;
      const { targetUserId, role } = req.body;

      await membershipService.addMember({
        actorUserId,
        orgId,
        projectId,
        targetUserId,
        role: role as ProjectRole,
      });

      res.status(201).json({ message: "Member added successfully" });
    } catch (err) {
      next(err);
    }
  },
);

/**
 * DELETE /projects/:projectId/members/:userId
 * Remove a member from a project
 */
router.delete(
  "/:userId",
  async (
    req: CustomRequest<{ projectId: string; userId: string }>,
    res: Response,
    next: NextFunction,
  ) => {
    try {
      const { projectId, userId: targetUserId } = req.params;
      const { userId: actorUserId, orgId } = req.auth!;

      await membershipService.removeMember({
        actorUserId,
        orgId,
        projectId,
        targetUserId,
      });

      res.status(200).json({ message: "Member removed successfully" });
    } catch (err) {
      next(err);
    }
  },
);

/**
 * PATCH /projects/:projectId/members/:userId/role
 * Change a member's role on a project
 */
router.patch(
  "/:userId/role",
  async (
    req: CustomRequest<{ projectId: string; userId: string }>,
    res: Response,
    next: NextFunction,
  ) => {
    try {
      const { projectId, userId: targetUserId } = req.params;
      const { userId: actorUserId, orgId } = req.auth!;
      const { role: newRole } = req.body;

      await membershipService.changeRole({
        actorUserId,
        orgId,
        projectId,
        targetUserId,
        newRole: newRole as ProjectRole,
      });

      res.status(200).json({ message: "Role updated successfully" });
    } catch (err) {
      next(err);
    }
  },
);

export default router;

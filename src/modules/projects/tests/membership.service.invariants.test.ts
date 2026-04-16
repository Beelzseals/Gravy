import { describe, it, expect, beforeEach } from "vitest";
import { mock, mockDeep } from "vitest-mock-extended";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";

import { ProjectMembershipService } from "../membership/membership.service";
import { ProjectMembershipRepository } from "../membership/membership.repository";
import { ProjectRepository } from "../project.repository";
import { ProjectPolicy } from "../project.policy";
import { CustomError } from "../../../core/error/error.factory";
import { OrgMembershipRepository } from "../../organizations/membership/membership.repository";

// ─── Constants ────────────────────────────────────────────────────────────────

const ACTOR_USER_ID = "user-actor";
const TARGET_USER_ID = "user-target";
const ORG_ID = "org-1";
const PROJECT_ID = "project-1";

const baseParams = {
  actorUserId: ACTOR_USER_ID,
  orgId: ORG_ID,
  orgRole: "ORG_OWNER" as const,
  projectId: PROJECT_ID,
  targetUserId: TARGET_USER_ID,
};

const mockProject = {
  id: PROJECT_ID,
  name: "Test Project",
  orgId: ORG_ID,
  description: null,
  status: "ACTIVE" as const,
  createdAt: new Date(),
  updatedAt: new Date(),
};

const ownerMembership = {
  id: "membership-1",
  projectId: PROJECT_ID,
  userId: TARGET_USER_ID,
  role: "PROJECT_OWNER" as const,
  createdAt: new Date(),
  updatedAt: new Date(),
};

const editorMembership = {
  id: "membership-2",
  projectId: PROJECT_ID,
  userId: TARGET_USER_ID,
  role: "PROJECT_EDITOR" as const,
  createdAt: new Date(),
  updatedAt: new Date(),
};

// ─── Suite ───────────────────────────────────────────────────────────────────

describe("ProjectMembershipService — owner invariant", () => {
  let service: ProjectMembershipService;

  let orgMembershipRepo: ReturnType<typeof mock<OrgMembershipRepository>>;
  let projectRepo: ReturnType<typeof mock<ProjectRepository>>;
  let projectMembershipRepo: ReturnType<
    typeof mock<ProjectMembershipRepository>
  >;
  let projectPolicy: ReturnType<typeof mock<ProjectPolicy>>;
  let db: ReturnType<typeof mockDeep<NodePgDatabase>>;

  beforeEach(() => {
    orgMembershipRepo = mock<OrgMembershipRepository>();
    projectRepo = mock<ProjectRepository>();
    projectMembershipRepo = mock<ProjectMembershipRepository>();
    projectPolicy = mock<ProjectPolicy>();
    db = mockDeep<NodePgDatabase>();

    // Default: project always resolves
    projectRepo.findByIdScoped.mockResolvedValue(mockProject);

    // Default: policy always allows
    projectPolicy.assert.mockReturnValue(undefined);

    // Default: actor has a project membership so buildPolicyContext resolves
    projectMembershipRepo.findByProjectAndUser.mockResolvedValue(
      ownerMembership,
    );

    // Default: db.transaction immediately executes the callback
    db.transaction.mockImplementation((cb: (tx: any) => Promise<any>) =>
      cb({} as any),
    );

    service = new ProjectMembershipService(
      orgMembershipRepo,
      projectMembershipRepo,
      projectPolicy,
      projectRepo,
      db,
    );
  });

  // ─── removeMember ─────────────────────────────────────────────────────────

  describe("removeMember", () => {
    describe("when target is PROJECT_OWNER", () => {
      beforeEach(() => {
        // findByProjectAndUser is called twice:
        // 1. buildPolicyContext (actor lookup)
        // 2. target membership lookup
        // We return ownerMembership for both
        projectMembershipRepo.findByProjectAndUser.mockResolvedValue(
          ownerMembership,
        );
      });

      it("throws ownershipRequired when target is the last owner", async () => {
        projectMembershipRepo.countOwners.mockResolvedValue(1);

        await expect(service.removeMember(baseParams)).rejects.toThrow(
          CustomError.ownershipRequired("Cannot remove the last owner"),
        );
      });

      it("throws with the correct message when last owner", async () => {
        projectMembershipRepo.countOwners.mockResolvedValue(1);

        await expect(service.removeMember(baseParams)).rejects.toThrow(
          "Cannot remove the last owner",
        );
      });

      it("throws with status 409 when last owner", async () => {
        projectMembershipRepo.countOwners.mockResolvedValue(1);

        await expect(service.removeMember(baseParams)).rejects.toMatchObject({
          statusCode: 409,
          code: "INVARIANT_VIOLATION",
        });
      });

      it("succeeds when multiple owners exist", async () => {
        projectMembershipRepo.countOwners.mockResolvedValue(2);

        await expect(service.removeMember(baseParams)).resolves.not.toThrow();

        expect(projectMembershipRepo.delete).toHaveBeenCalledOnce();
      });

      it("does not call delete when invariant is violated", async () => {
        projectMembershipRepo.countOwners.mockResolvedValue(1);

        await expect(service.removeMember(baseParams)).rejects.toThrow(
          CustomError.ownershipRequired("Cannot remove the last owner"),
        );

        expect(projectMembershipRepo.delete).not.toHaveBeenCalled();
      });
    });

    describe("when target is not PROJECT_OWNER", () => {
      beforeEach(() => {
        projectMembershipRepo.findByProjectAndUser.mockResolvedValue(
          editorMembership,
        );
      });

      it("does not check owner count", async () => {
        await service.removeMember(baseParams);

        expect(projectMembershipRepo.countOwners).not.toHaveBeenCalled();
      });

      it("calls delete directly", async () => {
        await service.removeMember(baseParams);

        expect(projectMembershipRepo.delete).toHaveBeenCalledOnce();
      });
    });

    describe("when target has no membership", () => {
      beforeEach(() => {
        // First call (buildPolicyContext for actor) returns a membership
        // Second call (target lookup) returns null
        projectMembershipRepo.findByProjectAndUser
          .mockResolvedValueOnce(ownerMembership) // actor context
          .mockResolvedValueOnce(null); // target lookup
      });

      it("throws NotFoundError", async () => {
        await expect(service.removeMember(baseParams)).rejects.toMatchObject({
          statusCode: 404,
          code: "NOT_FOUND",
        });
      });

      it("does not call delete", async () => {
        await expect(service.removeMember(baseParams)).rejects.toThrow();

        expect(projectMembershipRepo.delete).not.toHaveBeenCalled();
      });
    });
  });

  // ─── changeRole ───────────────────────────────────────────────────────────

  describe("changeRole", () => {
    describe("when downgrading the last PROJECT_OWNER", () => {
      beforeEach(() => {
        projectMembershipRepo.findByProjectAndUser.mockResolvedValue(
          ownerMembership,
        );
        projectMembershipRepo.countOwners.mockResolvedValue(1);
      });

      it("throws ownershipRequired when demoting to PROJECT_EDITOR", async () => {
        await expect(
          service.changeRole({ ...baseParams, newRole: "PROJECT_EDITOR" }),
        ).rejects.toThrow(
          CustomError.ownershipRequired("Cannot remove the last owner"),
        );
      });

      it("throws ownershipRequired when demoting to PROJECT_VIEWER", async () => {
        await expect(
          service.changeRole({ ...baseParams, newRole: "PROJECT_VIEWER" }),
        ).rejects.toThrow(
          CustomError.ownershipRequired("Cannot remove the last owner"),
        );
      });

      it("throws with status 409 and correct code", async () => {
        await expect(
          service.changeRole({ ...baseParams, newRole: "PROJECT_EDITOR" }),
        ).rejects.toMatchObject({
          statusCode: 409,
          code: "INVARIANT_VIOLATION",
        });
      });

      it("does not call updateRole when ownershipRequired is thrown", async () => {
        await expect(
          service.changeRole({ ...baseParams, newRole: "PROJECT_EDITOR" }),
        ).rejects.toThrow(
          CustomError.ownershipRequired("Cannot remove the last owner"),
        );

        expect(projectMembershipRepo.updateRole).not.toHaveBeenCalled();
      });
    });

    describe("when downgrading an owner but multiple owners exist", () => {
      beforeEach(() => {
        projectMembershipRepo.findByProjectAndUser.mockResolvedValue(
          ownerMembership,
        );
        projectMembershipRepo.countOwners.mockResolvedValue(2);
      });

      it("allows demotion to PROJECT_EDITOR", async () => {
        await expect(
          service.changeRole({ ...baseParams, newRole: "PROJECT_EDITOR" }),
        ).resolves.not.toThrow();
      });

      it("allows demotion to PROJECT_VIEWER", async () => {
        await expect(
          service.changeRole({ ...baseParams, newRole: "PROJECT_VIEWER" }),
        ).resolves.not.toThrow();
      });

      it("calls updateRole with the new role", async () => {
        await service.changeRole({ ...baseParams, newRole: "PROJECT_EDITOR" });

        expect(projectMembershipRepo.updateRole).toHaveBeenCalledOnce();
      });
    });

    describe("when role is unchanged", () => {
      beforeEach(() => {
        projectMembershipRepo.findByProjectAndUser.mockResolvedValue(
          ownerMembership,
        );
      });

      it("returns early without calling updateRole", async () => {
        await service.changeRole({
          ...baseParams,
          newRole: "PROJECT_OWNER", // same as current
        });

        expect(projectMembershipRepo.updateRole).not.toHaveBeenCalled();
      });

      it("does not check owner count for a no-op role change", async () => {
        await service.changeRole({
          ...baseParams,
          newRole: "PROJECT_OWNER",
        });

        expect(projectMembershipRepo.countOwners).not.toHaveBeenCalled();
      });
    });

    describe("when upgrading a non-owner to PROJECT_OWNER", () => {
      beforeEach(() => {
        projectMembershipRepo.findByProjectAndUser.mockResolvedValue(
          editorMembership,
        );
      });

      it("does not check owner count on promotion", async () => {
        await service.changeRole({ ...baseParams, newRole: "PROJECT_OWNER" });

        expect(projectMembershipRepo.countOwners).not.toHaveBeenCalled();
      });

      it("calls updateRole", async () => {
        await service.changeRole({ ...baseParams, newRole: "PROJECT_OWNER" });

        expect(projectMembershipRepo.updateRole).toHaveBeenCalledOnce();
      });
    });

    describe("when target has no membership", () => {
      beforeEach(() => {
        projectMembershipRepo.findByProjectAndUser
          .mockResolvedValueOnce(ownerMembership) // actor context
          .mockResolvedValueOnce(null); // target lookup
      });

      it("throws NotFoundError", async () => {
        await expect(
          service.changeRole({ ...baseParams, newRole: "PROJECT_EDITOR" }),
        ).rejects.toMatchObject({
          statusCode: 404,
          code: "NOT_FOUND",
        });
      });

      it("does not call updateRole", async () => {
        await expect(
          service.changeRole({ ...baseParams, newRole: "PROJECT_EDITOR" }),
        ).rejects.toThrow();

        expect(projectMembershipRepo.updateRole).not.toHaveBeenCalled();
      });
    });
  });

  // ─── Scope gate ───────────────────────────────────────────────────────────

  describe("scope gate", () => {
    it("throws NotFoundError when project does not belong to org", async () => {
      projectRepo.findByIdScoped.mockResolvedValue(null as any);

      await expect(service.removeMember(baseParams)).rejects.toMatchObject({
        statusCode: 404,
        code: "NOT_FOUND",
      });
    });

    it("does not call policy when project is not found", async () => {
      projectRepo.findByIdScoped.mockResolvedValue(null as any);

      await expect(service.removeMember(baseParams)).rejects.toThrow();

      expect(projectPolicy.assert).not.toHaveBeenCalled();
    });

    it("does not call membershipRepo when project is not found", async () => {
      projectRepo.findByIdScoped.mockResolvedValue(null as any);

      await expect(service.removeMember(baseParams)).rejects.toThrow();

      expect(projectMembershipRepo.delete).not.toHaveBeenCalled();
    });
  });
});

import { describe, it, expect, beforeEach } from "vitest";
import { ProjectPolicy, ProjectPolicyContext } from "../project.policy";

// ─── Fixtures ────────────────────────────────────────────────────────────────

const BASE_CTX: ProjectPolicyContext = {
  actorUserId: "user-1",
  orgId: "org-1",
  projectId: "project-1",
  orgRole: null,
  projectRole: null,
};

function ctx(overrides: Partial<ProjectPolicyContext>): ProjectPolicyContext {
  return { ...BASE_CTX, ...overrides };
}

// ─── Suite ───────────────────────────────────────────────────────────────────

describe("ProjectPolicy", () => {
  let policy: ProjectPolicy;

  beforeEach(() => {
    policy = new ProjectPolicy();
  });

  // ─── Guard: missing actorUserId ───────────────────────────────────────────

  describe("guard: missing actorUserId", () => {
    it("returns false for every action when actorUserId is empty", () => {
      const actions = [
        "create",
        "view",
        "update",
        "delete",
        "list",
        "inviteMember",
        "changeMemberRole",
        "removeMember",
      ] as const;

      const emptyActorCtx = ctx({ actorUserId: "" });

      for (const action of actions) {
        expect(policy.can(action, emptyActorCtx)).toBe(false);
      }
    });
  });

  // ─── create ───────────────────────────────────────────────────────────────

  describe("create", () => {
    it("allows ORG_OWNER", () => {
      expect(policy.can("create", ctx({ orgRole: "ORG_OWNER" }))).toBe(true);
    });

    it("allows ORG_ADMIN", () => {
      expect(policy.can("create", ctx({ orgRole: "ORG_ADMIN" }))).toBe(true);
    });

    it("denies ORG_MEMBER", () => {
      expect(policy.can("create", ctx({ orgRole: "ORG_MEMBER" }))).toBe(false);
    });

    it("denies when orgRole is null", () => {
      expect(policy.can("create", ctx({ orgRole: null }))).toBe(false);
    });

    it("denies when orgId is missing", () => {
      expect(
        policy.can("create", ctx({ orgRole: "ORG_OWNER", orgId: undefined })),
      ).toBe(false);
    });
  });

  // ─── list ─────────────────────────────────────────────────────────────────

  describe("list", () => {
    it("allows ORG_OWNER", () => {
      expect(policy.can("list", ctx({ orgRole: "ORG_OWNER" }))).toBe(true);
    });

    it("allows ORG_ADMIN", () => {
      expect(policy.can("list", ctx({ orgRole: "ORG_ADMIN" }))).toBe(true);
    });

    it("allows ORG_MEMBER", () => {
      expect(policy.can("list", ctx({ orgRole: "ORG_MEMBER" }))).toBe(true);
    });

    it("denies when orgRole is null", () => {
      expect(policy.can("list", ctx({ orgRole: null }))).toBe(false);
    });

    it("denies when orgId is missing", () => {
      expect(
        policy.can("list", ctx({ orgRole: "ORG_MEMBER", orgId: undefined })),
      ).toBe(false);
    });
  });

  // ─── view ─────────────────────────────────────────────────────────────────

  describe("view", () => {
    it("allows ORG_OWNER with any project role", () => {
      expect(
        policy.can(
          "view",
          ctx({ orgRole: "ORG_OWNER", projectRole: "PROJECT_VIEWER" }),
        ),
      ).toBe(true);
    });

    it("allows ORG_ADMIN with any project role", () => {
      expect(
        policy.can(
          "view",
          ctx({ orgRole: "ORG_ADMIN", projectRole: "PROJECT_VIEWER" }),
        ),
      ).toBe(true);
    });

    it("allows PROJECT_OWNER", () => {
      expect(
        policy.can(
          "view",
          ctx({ orgRole: "ORG_MEMBER", projectRole: "PROJECT_OWNER" }),
        ),
      ).toBe(true);
    });

    it("allows PROJECT_EDITOR", () => {
      expect(
        policy.can(
          "view",
          ctx({ orgRole: "ORG_MEMBER", projectRole: "PROJECT_EDITOR" }),
        ),
      ).toBe(true);
    });

    it("allows PROJECT_VIEWER", () => {
      expect(
        policy.can(
          "view",
          ctx({ orgRole: "ORG_MEMBER", projectRole: "PROJECT_VIEWER" }),
        ),
      ).toBe(true);
    });

    it("denies ORG_MEMBER with no project role", () => {
      expect(
        policy.can("view", ctx({ orgRole: "ORG_MEMBER", projectRole: null })),
      ).toBe(false);
    });

    it("denies when orgId is missing", () => {
      expect(
        policy.can(
          "view",
          ctx({
            orgRole: "ORG_OWNER",
            projectRole: "PROJECT_OWNER",
            orgId: undefined,
          }),
        ),
      ).toBe(false);
    });

    it("denies when projectId is missing", () => {
      expect(
        policy.can(
          "view",
          ctx({
            orgRole: "ORG_OWNER",
            projectRole: "PROJECT_OWNER",
            projectId: undefined,
          }),
        ),
      ).toBe(false);
    });

    it("denies when orgRole is null", () => {
      expect(
        policy.can(
          "view",
          ctx({ orgRole: null, projectRole: "PROJECT_OWNER" }),
        ),
      ).toBe(false);
    });

    it("denies when projectRole is null and orgRole is ORG_MEMBER", () => {
      expect(
        policy.can("view", ctx({ orgRole: "ORG_MEMBER", projectRole: null })),
      ).toBe(false);
    });
  });

  // ─── update ───────────────────────────────────────────────────────────────

  describe("update", () => {
    it("allows ORG_OWNER", () => {
      expect(
        policy.can(
          "update",
          ctx({ orgRole: "ORG_OWNER", projectRole: "PROJECT_VIEWER" }),
        ),
      ).toBe(true);
    });

    it("allows ORG_ADMIN", () => {
      expect(
        policy.can(
          "update",
          ctx({ orgRole: "ORG_ADMIN", projectRole: "PROJECT_VIEWER" }),
        ),
      ).toBe(true);
    });

    it("allows PROJECT_OWNER", () => {
      expect(
        policy.can(
          "update",
          ctx({ orgRole: "ORG_MEMBER", projectRole: "PROJECT_OWNER" }),
        ),
      ).toBe(true);
    });

    it("allows PROJECT_EDITOR", () => {
      expect(
        policy.can(
          "update",
          ctx({ orgRole: "ORG_MEMBER", projectRole: "PROJECT_EDITOR" }),
        ),
      ).toBe(true);
    });

    it("denies PROJECT_VIEWER", () => {
      expect(
        policy.can(
          "update",
          ctx({ orgRole: "ORG_MEMBER", projectRole: "PROJECT_VIEWER" }),
        ),
      ).toBe(false);
    });

    it("denies ORG_MEMBER with no project role", () => {
      expect(
        policy.can("update", ctx({ orgRole: "ORG_MEMBER", projectRole: null })),
      ).toBe(false);
    });

    it("denies when orgRole is null", () => {
      expect(
        policy.can(
          "update",
          ctx({ orgRole: null, projectRole: "PROJECT_OWNER" }),
        ),
      ).toBe(false);
    });
  });

  // ─── delete ───────────────────────────────────────────────────────────────

  describe("delete", () => {
    it("allows ORG_OWNER", () => {
      expect(
        policy.can(
          "delete",
          ctx({ orgRole: "ORG_OWNER", projectRole: "PROJECT_VIEWER" }),
        ),
      ).toBe(true);
    });

    it("allows ORG_ADMIN", () => {
      expect(
        policy.can(
          "delete",
          ctx({ orgRole: "ORG_ADMIN", projectRole: "PROJECT_VIEWER" }),
        ),
      ).toBe(true);
    });

    it("allows PROJECT_OWNER", () => {
      expect(
        policy.can(
          "delete",
          ctx({ orgRole: "ORG_MEMBER", projectRole: "PROJECT_OWNER" }),
        ),
      ).toBe(true);
    });

    it("denies PROJECT_EDITOR", () => {
      expect(
        policy.can(
          "delete",
          ctx({ orgRole: "ORG_MEMBER", projectRole: "PROJECT_EDITOR" }),
        ),
      ).toBe(false);
    });

    it("denies PROJECT_VIEWER", () => {
      expect(
        policy.can(
          "delete",
          ctx({ orgRole: "ORG_MEMBER", projectRole: "PROJECT_VIEWER" }),
        ),
      ).toBe(false);
    });

    it("denies ORG_MEMBER with no project role", () => {
      expect(
        policy.can("delete", ctx({ orgRole: "ORG_MEMBER", projectRole: null })),
      ).toBe(false);
    });

    it("denies when orgRole is null", () => {
      expect(
        policy.can(
          "delete",
          ctx({ orgRole: null, projectRole: "PROJECT_OWNER" }),
        ),
      ).toBe(false);
    });
  });

  // ─── inviteMember ─────────────────────────────────────────────────────────

  describe("inviteMember", () => {
    it("allows ORG_OWNER", () => {
      expect(
        policy.can(
          "inviteMember",
          ctx({ orgRole: "ORG_OWNER", projectRole: "PROJECT_VIEWER" }),
        ),
      ).toBe(true);
    });

    it("allows ORG_ADMIN", () => {
      expect(
        policy.can(
          "inviteMember",
          ctx({ orgRole: "ORG_ADMIN", projectRole: "PROJECT_VIEWER" }),
        ),
      ).toBe(true);
    });

    it("allows PROJECT_OWNER", () => {
      expect(
        policy.can(
          "inviteMember",
          ctx({ orgRole: "ORG_MEMBER", projectRole: "PROJECT_OWNER" }),
        ),
      ).toBe(true);
    });

    it("denies PROJECT_EDITOR", () => {
      expect(
        policy.can(
          "inviteMember",
          ctx({ orgRole: "ORG_MEMBER", projectRole: "PROJECT_EDITOR" }),
        ),
      ).toBe(false);
    });

    it("denies PROJECT_VIEWER", () => {
      expect(
        policy.can(
          "inviteMember",
          ctx({ orgRole: "ORG_MEMBER", projectRole: "PROJECT_VIEWER" }),
        ),
      ).toBe(false);
    });

    it("denies ORG_MEMBER with no project role", () => {
      expect(
        policy.can(
          "inviteMember",
          ctx({ orgRole: "ORG_MEMBER", projectRole: null }),
        ),
      ).toBe(false);
    });
  });

  // ─── changeMemberRole ─────────────────────────────────────────────────────

  describe("changeMemberRole", () => {
    it("allows ORG_OWNER", () => {
      expect(
        policy.can(
          "changeMemberRole",
          ctx({ orgRole: "ORG_OWNER", projectRole: "PROJECT_VIEWER" }),
        ),
      ).toBe(true);
    });

    it("allows ORG_ADMIN", () => {
      expect(
        policy.can(
          "changeMemberRole",
          ctx({ orgRole: "ORG_ADMIN", projectRole: "PROJECT_VIEWER" }),
        ),
      ).toBe(true);
    });

    it("allows PROJECT_OWNER", () => {
      expect(
        policy.can(
          "changeMemberRole",
          ctx({ orgRole: "ORG_MEMBER", projectRole: "PROJECT_OWNER" }),
        ),
      ).toBe(true);
    });

    it("denies PROJECT_EDITOR", () => {
      expect(
        policy.can(
          "changeMemberRole",
          ctx({ orgRole: "ORG_MEMBER", projectRole: "PROJECT_EDITOR" }),
        ),
      ).toBe(false);
    });

    it("denies PROJECT_VIEWER", () => {
      expect(
        policy.can(
          "changeMemberRole",
          ctx({ orgRole: "ORG_MEMBER", projectRole: "PROJECT_VIEWER" }),
        ),
      ).toBe(false);
    });

    it("denies ORG_MEMBER with no project role", () => {
      expect(
        policy.can(
          "changeMemberRole",
          ctx({ orgRole: "ORG_MEMBER", projectRole: null }),
        ),
      ).toBe(false);
    });
  });

  // ─── removeMember ─────────────────────────────────────────────────────────

  describe("removeMember", () => {
    it("allows ORG_OWNER", () => {
      expect(
        policy.can(
          "removeMember",
          ctx({ orgRole: "ORG_OWNER", projectRole: "PROJECT_VIEWER" }),
        ),
      ).toBe(true);
    });

    it("allows ORG_ADMIN", () => {
      expect(
        policy.can(
          "removeMember",
          ctx({ orgRole: "ORG_ADMIN", projectRole: "PROJECT_VIEWER" }),
        ),
      ).toBe(true);
    });

    it("allows PROJECT_OWNER", () => {
      expect(
        policy.can(
          "removeMember",
          ctx({ orgRole: "ORG_MEMBER", projectRole: "PROJECT_OWNER" }),
        ),
      ).toBe(true);
    });

    it("denies PROJECT_EDITOR", () => {
      expect(
        policy.can(
          "removeMember",
          ctx({ orgRole: "ORG_MEMBER", projectRole: "PROJECT_EDITOR" }),
        ),
      ).toBe(false);
    });

    it("denies PROJECT_VIEWER", () => {
      expect(
        policy.can(
          "removeMember",
          ctx({ orgRole: "ORG_MEMBER", projectRole: "PROJECT_VIEWER" }),
        ),
      ).toBe(false);
    });

    it("denies ORG_MEMBER with no project role", () => {
      expect(
        policy.can(
          "removeMember",
          ctx({ orgRole: "ORG_MEMBER", projectRole: null }),
        ),
      ).toBe(false);
    });
  });

  // ─── assert ───────────────────────────────────────────────────────────────

  describe("assert", () => {
    it("does not throw when action is allowed", () => {
      expect(() =>
        policy.assert(
          "view",
          ctx({ orgRole: "ORG_MEMBER", projectRole: "PROJECT_VIEWER" }),
        ),
      ).not.toThrow();
    });

    it("throws ForbiddenError when action is denied", () => {
      expect(() =>
        policy.assert(
          "delete",
          ctx({ orgRole: "ORG_MEMBER", projectRole: "PROJECT_VIEWER" }),
        ),
      ).toThrow("Not allowed");
    });

    it("thrown error has status 403", () => {
      try {
        policy.assert(
          "delete",
          ctx({ orgRole: "ORG_MEMBER", projectRole: "PROJECT_VIEWER" }),
        );
      } catch (err: any) {
        expect(err.statusCode).toBe(403);
        expect(err.code).toBe("FORBIDDEN");
      }
    });
  });
});

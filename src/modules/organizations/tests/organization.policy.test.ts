import { describe, it, expect, beforeEach } from "vitest";
import { OrganizationPolicy, OrgPolicyContext } from "../organization.policy";
const BASE_CTX: OrgPolicyContext = {
  actorUserId: "user-123",
  orgId: "org-456",
};

const ctx = (rest: Partial<OrgPolicyContext>) => ({ ...BASE_CTX, ...rest });

describe("OrganizationPolicy", () => {
  let policy: OrganizationPolicy;

  beforeEach(() => {
    policy = new OrganizationPolicy();
  });

  // ─── Guard: missing params ───────────────────────────────────────────

  describe("guard: missing parameters", () => {
    it("should deny access if actorUserId is missing", () => {
      const res = policy.can("view", ctx({ actorUserId: "" }));
      expect(res).toBe(false);
    });

    it("should deny access if orgId is missing", () => {
      const res = policy.can("view", ctx({ orgId: "" }));
      expect(res).toBe(false);
    });

    it("should deny access if orgRole is missing", () => {
      const res = policy.can("view", ctx({ orgRole: undefined }));
      expect(res).toBe(false);
    });
  });

  // ─── View ──────────────────────────────────────────────
  describe("view", () => {
    it("should allow ORG_OWNER to view", () => {
      const res = policy.can("view", ctx({ orgRole: "ORG_OWNER" }));
      expect(res).toBe(true);
    });

    it("should allow ORG_ADMIN to view", () => {
      const res = policy.can("view", ctx({ orgRole: "ORG_ADMIN" }));
      expect(res).toBe(true);
    });

    it("should allow ORG_MEMBER to view", () => {
      const res = policy.can("view", ctx({ orgRole: "ORG_MEMBER" }));
      expect(res).toBe(true);
    });

    it("should deny access for invalid role", () => {
      const res = policy.can("view", ctx({ orgRole: "INVALID_ROLE" as any }));
      expect(res).toBe(false);
    });
  });

  // ─── Update Settings ──────────────────────────────────────────────
  describe("update settings", () => {
    it("should allow ORG_OWNER to update settings", () => {
      const res = policy.can("updateSettings", ctx({ orgRole: "ORG_OWNER" }));
      expect(res).toBe(true);
    });

    it("should allow ORG_ADMIN to update settings", () => {
      const res = policy.can("updateSettings", ctx({ orgRole: "ORG_ADMIN" }));
      expect(res).toBe(true);
    });

    it("should deny access for ORG_MEMBER to update settings", () => {
      const res = policy.can("updateSettings", ctx({ orgRole: "ORG_MEMBER" }));
      expect(res).toBe(false);
    });

    it("should deny access for invalid role", () => {
      const res = policy.can(
        "updateSettings",
        ctx({ orgRole: "INVALID_ROLE" as any }),
      );
      expect(res).toBe(false);
    });
  });

  // ─── Manage Members ──────────────────────────────────────────────
  describe("manage members", () => {
    it("should allow ORG_OWNER to manage members", () => {
      const res = policy.can("manageMembers", ctx({ orgRole: "ORG_OWNER" }));
      expect(res).toBe(true);
    });

    it("should allow ORG_ADMIN to manage members", () => {
      const res = policy.can("manageMembers", ctx({ orgRole: "ORG_ADMIN" }));
      expect(res).toBe(true);
    });

    it("should deny access for ORG_MEMBER to manage members", () => {
      const res = policy.can("manageMembers", ctx({ orgRole: "ORG_MEMBER" }));
      expect(res).toBe(false);
    });

    it("should deny access for invalid role", () => {
      const res = policy.can(
        "manageMembers",
        ctx({ orgRole: "INVALID_ROLE" as any }),
      );
      expect(res).toBe(false);
    });
  });

  // ─── Create Project ──────────────────────────────────────────────
  describe("create project", () => {
    it("should allow ORG_OWNER to create project", () => {
      const res = policy.can("createProject", ctx({ orgRole: "ORG_OWNER" }));
      expect(res).toBe(true);
    });

    it("should allow ORG_ADMIN to create project", () => {
      const res = policy.can("createProject", ctx({ orgRole: "ORG_ADMIN" }));
      expect(res).toBe(true);
    });

    it("should deny access for ORG_MEMBER to create project", () => {
      const res = policy.can("createProject", ctx({ orgRole: "ORG_MEMBER" }));
      expect(res).toBe(false);
    });

    it("should deny access for invalid role", () => {
      const res = policy.can(
        "createProject",
        ctx({ orgRole: "INVALID_ROLE" as any }),
      );
      expect(res).toBe(false);
    });
  });

  // ─── View Billing ──────────────────────────────────────────────
  describe("view billing", () => {
    it("should allow ORG_OWNER to view billing", () => {
      const res = policy.can("viewBilling", ctx({ orgRole: "ORG_OWNER" }));
      expect(res).toBe(true);
    });

    it("should allow ORG_ADMIN to view billing", () => {
      const res = policy.can("viewBilling", ctx({ orgRole: "ORG_ADMIN" }));
      expect(res).toBe(true);
    });

    it("should deny access for ORG_MEMBER to view billing", () => {
      const res = policy.can("viewBilling", ctx({ orgRole: "ORG_MEMBER" }));
      expect(res).toBe(false);
    });

    it("should deny access for invalid role", () => {
      const res = policy.can(
        "viewBilling",
        ctx({ orgRole: "INVALID_ROLE" as any }),
      );
      expect(res).toBe(false);
    });
  });

  // ─── Assert ──────────────────────────────────────────────
  describe("assert", () => {
    it("should return true for allowed action", () => {
      const res = policy.can("view", ctx({ orgRole: "ORG_MEMBER" }));
      expect(res).toBe(true);
    });

    it("should return false for denied action", () => {
      const res = policy.can("updateSettings", ctx({ orgRole: "ORG_MEMBER" }));
      expect(res).toBe(false);
    });

    it("should throw unauthorized error for denied action", () => {
      expect(() =>
        policy.assert("updateSettings", ctx({ orgRole: "ORG_MEMBER" })),
      ).toThrow("Unauthorized");
    });
  });
});

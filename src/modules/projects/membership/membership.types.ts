import { ProjectRole, OrgRole } from "../../../core/authorization/roles";

// Service types
export interface AddProjectMemberInput {
  actorUserId: string;
  projectId: string;
  targetUserId: string;
  role: ProjectRole;
  orgId: string;
}

export interface ChangeProjectMemberRoleInput {
  actorUserId: string;
  projectId: string;
  targetUserId: string;
  role: ProjectRole;
  orgId: string;
  newRole: ProjectRole;
}

export interface RemoveProjectMemberInput {
  actorUserId: string;
  projectId: string;
  targetUserId: string;
  orgId: string;
}

export interface AuthorizationContext {
  orgId: string;
  orgRole: OrgRole | null;
  projectRole: ProjectRole | null;
}

// Repository types

export interface ProjectMembership {
  id: string;
  projectId: string;
  userId: string;
  role: ProjectRole | null;
  createdAt: Date;
  updatedAt: Date | null;
}

export interface CreateProjectMembershipInput {
  projectId: string;
  userId: string;
  role: ProjectRole;
}

export interface UpdateProjectMembershipRoleInput {
  projectId: string;
  userId: string;
  role: ProjectRole;
}

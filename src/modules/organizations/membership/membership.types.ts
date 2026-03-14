import { OrgRole } from "../../../core/authorization/roles";

export interface OrgMembershipRecord {
  userId: string;
  orgId: string;
  role: OrgRole;
}

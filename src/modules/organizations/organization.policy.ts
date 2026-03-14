import { OrgMembershipRepository } from "./membership/membership.repository";
import { ORG_ROLE } from "../../core/authorization/roles";
import { OrgAction } from "../../core/authorization/actions";

interface PolicyParams {
  userId: string;
  orgId: string;
  action: OrgAction;
}

//TODO: This is a very basic implementation. We will need to expand this as we add more actions and roles.
export class OrganizationPolicy {
  constructor(private orgMembershipRepo: OrgMembershipRepository) {}

  async can(params: PolicyParams) {
    const orgMembership = await this.orgMembershipRepo.findByUserAndOrg(
      params.userId,
      params.orgId,
    );
    if (!orgMembership) return false;

    if (params.action === "project:create") return true;

    return false;
  }
  async assert(params: PolicyParams) {
    const isAllowed = await this.can(params);
    if (!isAllowed) {
      throw new Error("Unauthorized");
    }
  }
}

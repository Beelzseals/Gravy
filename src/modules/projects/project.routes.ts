import { Router } from "express";
import { z } from "zod";
import { ProjectRepository } from "./project.repository";
import { ProjectMembershipRepository } from "./membership/membership.repository";
import { ProjectService } from "./project.service";
import { ProjectPolicy } from "./project.policy";
import { OrgMembershipRepository } from "../organizations/membership/membership.repository";
import { OrganizationPolicy } from "../organizations/organization.policy";
import {
  authMiddleware,
  CustomRequest,
} from "../../infra/http/auth.middleware";

const router = Router();
const createProjectBodySchema = z.object({
  name: z.string().min(1).max(255),
});

const services = new ProjectService(
  new ProjectRepository(),
  new ProjectMembershipRepository(),
  new OrganizationPolicy(new OrgMembershipRepository()),
  new ProjectPolicy(
    new ProjectRepository(),
    new OrgMembershipRepository(),
    new ProjectMembershipRepository(),
  ),
);

router.use(authMiddleware);

// list projects
router.get("/", async (req: CustomRequest, res) => {
  const { userId, orgId } = req.auth!;
  const projects = await services.listProjects(userId, orgId);
  res.json(projects);
});

// create project
router.post("/", async (req: CustomRequest, res) => {
  const parsedBody = createProjectBodySchema.safeParse(req.body);
  if (!parsedBody.success) {
    return res.status(400).json({ error: "Invalid request body" });
  }

  const { userId, orgId } = req.auth!;
  const newProject = await services.createProject({
    userId,
    orgId,
    name: parsedBody.data.name,
  });

  res.status(201).json(newProject);
});

export default router;

import { Router } from "express";
import { z } from "zod";
import { ProjectRepository } from "./project.repository";
import { ProjectMembershipRepository } from "./membership/membership.repository";
import { ProjectService } from "./project.service";
import { ProjectPolicy } from "./project.policy";
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
  new OrganizationPolicy(),
  new ProjectPolicy(),
);

router.use(authMiddleware);

/**
 * GET /api/projects - List all projects for the authenticated user within their organization.
 */
router.get("/", async (req: CustomRequest, res) => {
  const { userId, orgId } = req.auth!;
  const projects = await services.listProjects(userId, orgId);
  res.json(projects);
});

/**
 * POST /api/projects - Create a new project within the authenticated user's organization.
 */
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

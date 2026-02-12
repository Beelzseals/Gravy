import { Router } from "express";
import { ProjectRepository } from "./project.repository";
import { ProjectService } from "./project.service";
import { OrganizationRepository } from "../organizations/organization.repository";
import {
  authMiddleware,
  CustomRequest,
} from "../../infra/http/auth.middleware";

const router = Router();

const services = new ProjectService(
  new ProjectRepository(),
  new OrganizationRepository(),
);

router.use(authMiddleware);

// list projects
router.get("/", async (req: CustomRequest, res) => {
  const userId = req.user!.userId;
  const orgId = req.user!.orgId;
  const projects = await services.listProjects(userId, orgId);
  res.json(projects);
});

// create project
router.post("/", async (req: CustomRequest, res) => {
  const userId = req.user!.userId;
  const orgId = req.user!.orgId;
  const { name } = req.body;
  const project = await services.createProject(name, userId, orgId);
  res.status(201).json(project);
});

export default router;

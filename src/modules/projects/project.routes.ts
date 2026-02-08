import { Router } from "express";
import { ProjectRepository } from "./project.repository";
import { ProjectService } from "./project.service";
import { OrganizationRepository } from "../organizations/organization.repository";
import { projects } from "./project.schema";
const router = Router();

const services = new ProjectService(
  new ProjectRepository(),
  new OrganizationRepository(),
);

// list projects
//TEMP
router.get("/", async (req, res) => {
  const userId = req.header("x-user-id")!;
  const orgId = req.header("x-org-id")!;
  const projects = await services.listProjects(userId, orgId);
  res.json(projects);
});

// create project
//TEMP
router.post("/:orgId/projects", async (req, res) => {
  const userId = req.header("x-user-id")!;
  const orgId = req.header("x-org-id")!;
  const { name } = req.body;
  const project = await services.createProject(name, userId, orgId);
  res.status(201).json(project);
});

export default router;

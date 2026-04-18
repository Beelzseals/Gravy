import "dotenv/config";
import express from "express";
import { initLogger } from "./infra/logger/logger";
import projectRoutes from "./modules/projects/project.routes";
import { router as authRoutes } from "./modules/auth/auth.routes";
import { errorHandler } from "./core/error/error.handler";
const app = express();
const logger = initLogger();

app.use(express.json());
app.use("/auth", authRoutes);
app.use(errorHandler);
app.use("/projects", projectRoutes);
app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

const port = process.env.PORT || 3000;

app.listen(port, () => {
  logger.info(`API running on port ${port}`);
});

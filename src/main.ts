import express from "express";
import dotenv from "dotenv";
import { initLogger } from "./infra/logger/logger";

dotenv.config();

const app = express();
const logger = initLogger();

app.use(express.json());

app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

const port = process.env.PORT || 3000;

app.listen(port, () => {
  logger.info(`API running on port ${port}`);
});

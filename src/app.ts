import express, { Express } from "express";
import v1Router from "./routes";
import { errorHandler } from "./middlewares/error-handler.middleware";

export function createApp(): Express {
  const app = express();

  app.use(express.json());
  app.use("/api/v1", v1Router);

  // Central error-handling middleware must be registered last.
  app.use(errorHandler);

  return app;
}

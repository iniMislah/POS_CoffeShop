import cors from "cors";
import express from "express";
import helmet from "helmet";
import morgan from "morgan";
import swaggerUi from "swagger-ui-express";

import { openApiDocument } from "./docs/openapi";
import { errorMiddleware } from "./middlewares/error.middleware";
import { notFoundMiddleware } from "./middlewares/not-found.middleware";
import { apiRouter } from "./routes";

export const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(morgan("dev"));

app.get("/health", (_req, res) => {
  res.json({
    success: true,
    message: "Coffee Shop POS API is running",
  });
});

app.use("/docs", swaggerUi.serve, swaggerUi.setup(openApiDocument));
app.use("/api", apiRouter);
app.use("/", apiRouter);

app.use(notFoundMiddleware);
app.use(errorMiddleware);

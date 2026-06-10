import cors from "cors";
import express from "express";
import helmet from "helmet";
import morgan from "morgan";
import path from "path";
import swaggerUi from "swagger-ui-express";

import { openApiDocument } from "./docs/openapi";
import { errorMiddleware } from "./middlewares/error.middleware";
import { notFoundMiddleware } from "./middlewares/not-found.middleware";
import { apiRouter } from "./routes";
import { env } from "./config/env";

export const app = express();

const developmentOrigins = [
  "http://localhost:3000",
  "http://localhost:5173",
  "http://localhost:5174",
];

const allowedOrigins = new Set(
  [
    env.WEB_APP_URL,
    ...(process.env.NODE_ENV === "production" ? [] : developmentOrigins),
  ].filter(Boolean),
);

app.use(helmet());
app.use(cors({
  origin(origin, callback) {
    if (!origin || allowedOrigins.has(origin)) {
      return callback(null, true);
    }

    return callback(new Error("Origin is not allowed by CORS"));
  },
}));
app.use(express.json());
app.use(morgan("dev"));
app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));

app.get("/health", (_req, res) => {
  res.json({
    success: true,
    message: "Coffee Shop POS API is running",
  });
});

if (process.env.NODE_ENV !== "production" || process.env.ENABLE_SWAGGER === "true") {
  app.use("/docs", swaggerUi.serve, swaggerUi.setup(openApiDocument));
}
app.use("/api", apiRouter);

app.use(notFoundMiddleware);
app.use(errorMiddleware);

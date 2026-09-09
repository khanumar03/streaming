import express, { Application } from "express";
import cors from "cors";
import status from "express-status-monitor";
import mediaRoutes from "./routes/media/media.routes.js";
import path from "path";

export const app: Application = express();

app.use(status());
app.use(
  cors({
    origin: `http://localhost:${process.env.SERVER_PORT}`,
    methods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
  }),
);

app.use("/api/v1/media", mediaRoutes);
app.use("/live", express.static(path.resolve("./uploads/live")));


export default app;

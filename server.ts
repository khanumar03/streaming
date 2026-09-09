import app from "./express.js";
import { ensureUploadDirExists } from "./utils/file.utils.js";
import { envConfig } from "./config/env.config.js";
import { initDatabase } from "./db/index.js";
import mediaRoutes from "./routes/media/media.routes.js";
import { startLiveServer } from "./live-stream-server/server.js";
import "./workers/transcoder.worker.js"

function startServer(): void {
  try {
    ensureUploadDirExists();
    initDatabase();
    console.log("Database connected successfully.");

    app.listen(envConfig.port, () => {
      console.log(`Server listening on port ${envConfig.port}`);
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  } finally {
    startLiveServer();
  }
}

startServer();

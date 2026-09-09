import { Router } from "express";
import { MediaController } from "../../controllers/media/media.controller.js";

const router = Router();

router.get("/", MediaController.get)
router.get("/:id", MediaController.getById)
router.get("/stream/:id/:reso/:segment", MediaController.stream)
router.post("/upload", MediaController.upload);

export default router;

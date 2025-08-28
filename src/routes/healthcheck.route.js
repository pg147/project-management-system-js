// Express Router
import { Router} from 'express';

// Controllers
import { healthCheck } from "../controllers/healthcheck.controllers.js";

// Initialized express router
const router = Router();

// Public Routes
router.get('/', healthCheck);

export default router;
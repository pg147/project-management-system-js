// Express modules
import { Router } from 'express';

// Controllers
import { registerUser } from "../controllers/user.controllers.js";

// Instance of an express router
const router = Router();

// Public routes
router.post('/register', registerUser);

export default router;
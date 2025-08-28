// Express modules
import { Router } from 'express';

// Controllers
import { registerUser } from "../controllers/user.controllers.js";

// Middlewares
import { validateRequest } from "../middlewares/validations.middlewares.js";

// Validators
import { signupValidations } from "../validations/index.js";

// Instance of an express router
const router = Router();

// Public routes
router.post('/register', signupValidations, validateRequest, registerUser);

export default router;
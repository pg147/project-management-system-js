// Express modules
import { Router } from 'express';

// Controllers
import { loginUser, logoutUser, registerUser } from "../controllers/user.controllers.js";

// Middlewares
import { checkAuthentication } from "../middlewares/auth.middleware.js";

// Instance of an express router
const router = Router();

// Public routes
router.post('/register', registerUser);
router.post('/login', loginUser);

// Protected routes
router.post('/logout', checkAuthentication, logoutUser);

export default router;
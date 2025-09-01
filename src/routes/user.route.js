// Express modules
import { Router } from 'express';

// Controllers
import {
    getCurrentUser,
    loginUser,
    logoutUser, refreshAccessToken,
    registerUser,
    resendVerificationLink,
    verifyUserEmail,
    forgotPassword, resetPassword, changePassword
} from "../controllers/user.controllers.js";

// Middlewares
import { checkAuthentication } from "../middlewares/auth.middleware.js";

// Instance of an express router
const router = Router();

// Public routes
router.post('/register', registerUser);
router.post('/login', loginUser);
router.post('/verify/:token', verifyUserEmail);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password/:token', resetPassword);

// Protected routes
router.post('/logout', checkAuthentication, logoutUser);
router.get('/current', checkAuthentication, getCurrentUser);
router.post('/verify/resend', checkAuthentication, resendVerificationLink);
router.post('/refresh', checkAuthentication, refreshAccessToken);
router.post('/change-password', checkAuthentication, changePassword);

export default router;
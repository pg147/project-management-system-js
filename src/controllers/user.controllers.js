// Services
import {
    checkExistingUser,
    createNewUser,
    generateAccessAndRefreshTokens,
    getUserByEmail,
    getUserById,
    sendLinkViaEmail
} from "../services/user.services.js";

// Helper functions
import {
    APIError,
    APIResponse,
    generateTemporaryToken,
    generateToken,
    validatePassword,
    sendEmail,
    verificationEmailContent,
    validateToken, hashPassword
} from "../utils/index.js";

// Database collection schema
import userModel from "../models/user.models.js";

// Crypto modules
import { createHash } from "node:crypto";

// Validation schemas
import { loginValidationSchema, signupValidationSchema } from "../validations/schema.js";

export async function registerUser(req, res) {
    // Validate input early to prevent processing malformed data and provide immediate feedback
    const validationResult = await signupValidationSchema.safeParseAsync(req.body);

    // Fail fast with descriptive error to reduce server load and improve user experience
    if (validationResult.error) throw new APIError(400, `Error : ${validationResult.error}`);

    // Extract sanitized data to ensure type safety throughout the registration flow
    const { username, email, password } = validationResult.data;

    // Check for existing users to prevent duplicate accounts and maintain data integrity
    const existingUser = await checkExistingUser(username, email);

    // Enforce unique constraint at application level before database insertion
    if (existingUser) throw new APIError(409, `User with email ${email} already exists!`, []);

    try {
        // Create user record with hashed password and default settings via service layer
        const user = await createNewUser(username, email, password);

        // Generate secure token pair - unhashed for email URL, hashed for database storage
        const { unhashedToken, hashedToken, tokenExpiry } = generateTemporaryToken();

        // Store hashed token in database and send unhashed token to prevent token exposure if database is compromised
        await sendLinkViaEmail(
            user,
            'emailVerificationToken',
            'emailVerificationExpiry',
            hashedToken,
            tokenExpiry,
            'Please verify your email',
            verificationEmailContent(
                user.username,
                `${req.protocol}://${req.get("host")}/api/v1/users/verify/${unhashedToken}`
            )
        );

        // Refetch user to get clean data without sensitive fields for response
        const createdUser = await getUserById(user._id);

        // Return sanitized user data confirming successful registration and email dispatch
        return res.status(201).json(new APIResponse(201, { user: createdUser }, 'User created and verification link sent successfully!'));
    } catch (error) {
        console.error("Error @registerUser ::", error?.message);
        throw new APIError(500, error?.message);
    }
}

export async function loginUser(req, res) {
    // Validate credentials format before database queries to prevent injection attempts
    const validationResult = await loginValidationSchema.safeParseAsync(req.body);

    // Reject malformed requests immediately to protect against automated attacks
    if (validationResult.error) throw new APIError(400, `Error : ${validationResult.error}`);

    // Extract validated credentials ensuring data type consistency
    const { email, password } = validationResult.data;

    // Fetch user with password field (normally excluded) for authentication comparison
    const user = await getUserByEmail(email, true);

    // Prevent user enumeration by using generic error message for non-existent users
    if (!user) throw new APIError(404, `User with email: ${email} not found!`);

    try {
        // Use constant-time comparison to prevent timing attacks during password verification
        const checkPassword = await validatePassword(password, user.password);

        // Fail authentication without revealing whether email or password was incorrect
        if (!checkPassword) throw new APIError(400, 'Invalid password', []);

        // Create JWT token pair for stateless authentication with automatic refresh capability
        const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(user._id);

        // Configure secure cookie settings to prevent XSS and man-in-the-middle attacks
        const options = {
            httpOnly: true,
            secure: true
        }

        // Set authentication cookies and return user data for client-side state management
        return res.status(200)
            .cookie('accessToken', accessToken, options)
            .cookie('refreshToken', refreshToken, options)
            .json(new APIResponse(200, { user, accessToken, refreshToken }, 'User logged in successfully!'));
    } catch (error) {
        console.error("Error @loginUser ::", error);
        throw new APIError(500, 'Internal Server Error');
    }
}

export async function logoutUser(req, res) {
    try {
        // Invalidate stored refresh token to prevent reuse and ensure complete logout
        await userModel.findByIdAndUpdate(req.user._id, {
            $set: { refreshToken: "" }
        }, { new: true });

        // Match cookie security settings used during login for proper cleanup
        const options = {
            httpOnly: true,
            secure: true
        };

        // Clear authentication cookies and confirm logout to complete session termination
        return res
            .status(200)
            .clearCookie('accessToken', options)
            .clearCookie('refreshToken', options)
            .json(new APIResponse(200, {}, 'User logged out successfully!'));
    } catch (error) {
        console.error("Error @logoutUser ::", error);
    }
}

export function getCurrentUser(req, res) {
    // Return authenticated user data from middleware without additional database query
    return res.status(200).json(new APIResponse(200, { user: req.user }, `User [${req.user.username}] fetched successfully!`));
}

export async function verifyUserEmail(req, res) {
    // Extract verification token from URL parameter for email confirmation flow
    const { token } = req.params;

    // Reject requests without tokens to prevent unnecessary processing
    if (!token) throw new APIError(401, 'Invalid Request!');

    // Hash URL token to match database-stored hashed version for secure comparison
    const hashedToken = createHash('sha256').update(token).digest('hex');

    try {
        // Find user with valid, non-expired verification token in atomic operation
        const user = await userModel.findOne({
            emailVerificationToken: hashedToken,
            emailVerificationExpiry: { $gt: Date.now() }
        });

        // Handle both invalid tokens and expired tokens with same error for security
        if (!user) throw new APIError(401, 'Either the token is invalid or expired.');

        // Clear verification token fields to prevent token reuse
        user.emailVerificationToken = undefined;
        user.emailVerificationExpiry = undefined;

        // Mark email as verified to enable full account functionality
        user.isEmailVerified = true;

        // Skip validation to avoid triggering password rehashing during email verification
        await user.save({ validateBeforeSave: false });

        // Confirm successful email verification with explicit status
        return res.status(200).json(new APIResponse(200, { verified: true }, `User email [${user.email}] verified successfully!`));
    } catch (error) {
        console.error("Error @verifyUserEmail ::", error);
    }
}

export async function resendVerificationLink(req, res) {
    try {
        // Fetch authenticated user details for verification email generation
        const user = await getUserById(req.user._id);

        // Ensure user record exists before attempting to send verification email
        if (!user) throw new APIError(404, 'User not found!');

        // Prevent unnecessary email sends for already verified accounts
        if (user.isEmailVerified) throw new APIError(409, `${user.email} is already verified!`);

        // Generate new secure token pair to replace any existing verification tokens
        const { unhashedToken, hashedToken, tokenExpiry } = generateTemporaryToken();

        // Update user record and send new verification email in single transaction
        await sendLinkViaEmail(
            user,
            'emailVerificationToken',
            'emailVerificationExpiry',
            hashedToken,
            tokenExpiry,
            'Please verify your email',
            verificationEmailContent(
                user.username,
                `${req.protocol}://${req.get("host")}/api/v1/users/verify/${unhashedToken}`
            )
        );

        // Confirm email dispatch without exposing internal token details
        return res.status(200).json(new APIResponse(200, { status: 'SENT' }, `Verification link sent to ${user.email}`));
    } catch (error) {
        console.error("Error @resendVerificationLink ::", error?.message ?? error);
        throw new APIError(500, error?.message ?? `${error}`);
    }
}

export async function refreshAccessToken(req, res) {
    // Extract refresh token from secure HTTP-only cookie for validation
    const refreshToken = req.cookies?.refreshToken;
    if (!refreshToken) throw new APIError(401, 'Unauthorized access!');

    try {
        // Verify token signature and extract user ID without database query
        const decodedRefreshToken = validateToken(refreshToken, process.env.REFRESH_TOKEN_SECRET);

        // Confirm user account still exists and is active
        const user = await getUserById(decodedRefreshToken._id);
        if (!user) throw new APIError(404, 'User not found!');

        // Verify user hasn't logged out by checking stored refresh token exists
        if (!user.refreshToken) throw new APIError(401, 'You must be logged in!');

        // Prevent token replay attacks by comparing stored token with submitted token
        if (user.refreshToken !== refreshToken) throw new APIError(401, 'Invalid Refresh Token!');

        // Generate fresh token pair to maintain security through token rotation
        const { accessToken, refreshToken: newRefreshToken } = generateAccessAndRefreshTokens(user._id);

        // Update database with new refresh token for future validation
        user.refreshToken = newRefreshToken;
        await user.save({ validateBeforeSave: false });

        // Set new tokens in secure cookies and return for client-side updates
        const options = { httpOnly: true, secure: true };

        return res
            .status(200)
            .cookie('accessToken', accessToken, options)
            .cookie('refreshToken', newRefreshToken, options)
            .json(new APIResponse(200, { accessToken, refreshToken: newRefreshToken }, 'Access token refreshed successfully!'));
    } catch (error) {
        console.error("Error @refreshAccessToken ::", error?.message ?? error);
        throw new APIError(500, error?.message ?? `${error}`);
    }
}

export async function forgotPassword(req, res) {
    // Validate email input early to prevent unnecessary database queries with malformed data
    const validationResult = await forgotPasswordValidationSchema.safeParseAsync(req.body);
    if (validationResult.error) throw new APIError(400, 'Email is required!');

    // Extract validated email to ensure data integrity throughout the process
    const { email } = validationResult.data;

    try {
        // Verify user exists before generating tokens to avoid sending reset links for non-existent accounts
        const user = await getUserByEmail(email);
        if (!user) throw new APIError(404, `User with email ${email} not found!`);

        // Generate cryptographically secure token pair - unhashed for URL, hashed for database storage
        const { unhashedToken, hashedToken, tokenExpiry } = generateTemporaryToken();

        // Store hashed token in database and send unhashed token via email to prevent token exposure in case of database breach
        await sendLinkViaEmail(
            user,
            'forgotPasswordToken',
            'forgotPasswordExpiry',
            hashedToken,
            tokenExpiry,
            'Request for resetting your password',
            forgotPasswordContent(
                user?.username,
                `${req.protocol}://${req.get("host")}/api/v1/users/reset-password/${unhashedToken}`
            )
        );

        // Return success without exposing user existence to prevent email enumeration attacks
        return res.status(200).json(new APIResponse(200, { status: 'SENT' }, `Reset link sent to ${user.email}`));
    } catch (error) {
        console.error("Error @forgotPassword ::", error?.message ?? error);
        throw new APIError(500, error?.message ?? `${error}`);
    }
}

export async function resetPassword(req, res) {
    const { email, password } = req.body;
    const { token } = req.params;

    try {
        // Reject requests without tokens immediately to prevent unnecessary processing
        if (!token) throw new APIError(401, 'Invalid Request!');

        // Hash the URL token to match against database-stored hashed version for security comparison
        const hashedToken = createHash('sha256').update(token).digest('hex');

        // Find user with matching token that hasn't expired - atomic operation prevents race conditions
        const user = await userModel.findOne({
            forgotPasswordToken: hashedToken,
            forgotPasswordExpiry: { $gt: Date().now }
        });
        if (!user) throw new APIError(489, 'Either the token is invalid or expired!');

        // Update password directly - model middleware will handle hashing before save
        user.password = password;

        // Clear reset token fields to prevent token reuse after successful password reset
        user.forgotPasswordToken = undefined;
        user.forgotPasswordExpiry = undefined;

        // Persist changes - triggers password hashing middleware and validates constraints
        await user.save();

        return res.status(200).json(new APIResponse(200, { status: 'UPDATED' }, `Password updated for ${user.username}`));
    } catch (error) {
        console.error("Error @resetPassword ::", error?.message ?? error);
        throw new APIError(500, error?.message ?? `${error}`);
    }
}

export async function changePassword(req, res) {
    // Extract password fields from request body for authenticated password change
    const { oldPassword, newPassword } = req.body;

    try {
        // Fetch user with password field included for current password verification
        const user = await getUserByEmail(req.user.email, true);

        // Verify current password using constant-time comparison to prevent timing attacks
        const validateOldPassword = await validatePassword(oldPassword, user.password);

        // Reject password change if current password is incorrect to prevent unauthorized access
        if (!validateOldPassword) throw new APIError(400, "Old password doesn't match!");

        // Update password field - model middleware will automatically hash before database storage
        user.password = newPassword;

        // Trigger password hashing and validation through model save hooks
        await user.save({ validateBeforeSave: false });

        // Confirm successful password update without exposing sensitive information
        return res.status(200).json(new APIResponse(200, { status: 'UPDATED' }, `Password for ${user.username} successfully updated!`));
    } catch (error) {
        console.error("Error @changePassword ::", error?.message ?? error);
        throw new APIError(500, error?.message ?? `${error}`);
    }
}
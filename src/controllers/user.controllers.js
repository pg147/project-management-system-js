// Services
import {
    checkExistingUser,
    createNewUser,
    generateAccessAndRefreshTokens,
    getUserByEmail,
    getUserById, sendEmailVerificationLink
} from "../services/user.services.js";

// Helper functions
import {
    APIError,
    APIResponse,
    generateTemporaryToken,
    generateToken,
    validatePassword,
    sendEmail,
    verificationEmailContent, validateToken
} from "../utils/index.js";

// Database collection schema
import userModel from "../models/user.models.js";

// Crypto modules
import { createHash } from "node:crypto";

// Validation schemas
import { loginValidationSchema, signupValidationSchema } from "../validations/schema.js";

// Function to register a new user
export async function registerUser(req, res) {
    // Validating request fields
    const validationResult = await signupValidationSchema.safeParseAsync(req.body);

    // If validation fails, throw an error
    if (validationResult.error) throw new APIError(400, `Error : ${validationResult.error}`);

    // Extracting user details from the validated data
    const { username, email, password } = validationResult.data;

    // Checking if the user is already signed up using a desired service
    const existingUser = await checkExistingUser(username, email);

    // If the user is signed up already, throw a conflict error
    if (existingUser) throw new APIError(409, `User with email ${email} already exists!`, []);

    try {
        // Creating a new user in the database using a desired service
        const user = await createNewUser(username, email, password);

        // Sending a verification link to the user's email
        await sendEmailVerificationLink(user);

        // Fetching the newly created user
        const createdUser = await getUserById(user._id);

        // Return the created user
        return res.status(201).json(new APIResponse(201, { user: createdUser }, 'User created and verification link sent successfully!'));
    } catch (error) {
        console.error("Error @registerUser ::", error?.message);
        throw new APIError(500, error?.message);
    }
}

// Function to login an existing user
export async function loginUser(req, res) {
    // Validating request fields
    const validationResult = await loginValidationSchema.safeParseAsync(req.body);

    // If validation fails, throw an error
    if (validationResult.error) throw new APIError(400, `Error : ${validationResult.error}`);

    // Extracting user details from the validated data
    const { email, password } = validationResult.data;

    // Fetching user using email with the desired service
    const user = await getUserByEmail(email, true);

    // If the user isn't found, throw a not found error
    if (!user) throw new APIError(404, `User with email: ${email} not found!`);

    try {
        // Validate the input password with the desired service
        const checkPassword = await validatePassword(password, user.password);

        // If password validation fails, throw an error
        if (!checkPassword) throw new APIError(400, 'Invalid password', []);

        // Generate access and refresh tokens
        const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(user._id);

        // Object for cookie options
        const options = {
            httpOnly: true,
            secure: true
        }

        // Return user data along with access and refresh tokens as cookies
        return res.status(200)
            .cookie('accessToken', accessToken, options)
            .cookie('refreshToken', refreshToken, options)
            .json(new APIResponse(200, { user, accessToken, refreshToken }, 'User logged in successfully!'));
    } catch (error) {
        console.error("Error @loginUser ::", error);
        throw new APIError(500, 'Internal Server Error');
    }
}

// Function to logout a user
export async function logoutUser(req, res) {
    try {
        // Fetching the user by id, and updating the refresh token field
        await userModel.findByIdAndUpdate(req.user._id, {
            $set: { refreshToken: "" }
        }, { new: true });

        // Options for cookies
        const options = {
            httpOnly: true,
            secure: true
        };

        // Clearing the cookies with a success message
        return res
            .status(200)
            .clearCookie('accessToken', options)
            .clearCookie('refreshToken', options)
            .json(new APIResponse(200, {}, 'User logged out successfully!'));
    } catch (error) {
        console.error("Error @logoutUser ::", error);
    }
}

// Function to fetch the current user
export function getCurrentUser(req, res) {
    return res.status(200).json(new APIResponse(200, { user: req.user }, `User [${req.user.username}] fetched successfully!`));
}

// Function to verify user's email
export async function verifyUserEmail(req, res) {
    // Extracting verification token from route parameters
    const { token } = req.params;

    // If token wasn't found in params, throw an invalid request error
    if (!token) throw new APIError(401, 'Invalid Request!');

    // Hash the verification token, to match with stored token in the database
    const hashedToken = createHash('sha256').update(token).digest('hex');

    try {
        // Fetch user by matching the hashed verification token, meeting the expiry condition
        const user = await userModel.findOne({
            emailVerificationToken: hashedToken,
            emailVerificationExpiry: { $gt: Date.now() }
        });

        // If user not found or token expired, throw an error
        if (!user) throw new APIError(401, 'Either the token is valid or expired.');

        // Reset the email verification fields in the database
        user.emailVerificationToken = undefined;
        user.emailVerificationExpiry = undefined;

        // Set the verified status field to true
        user.isEmailVerified = true;

        // Save the modified fields
        await user.save({ validateBeforeSave: false });

        // Return the success response
        return res.status(200).json(new APIResponse(200, { verified: true }, `User email [${user.email}] verified successfully!`));
    } catch (error) {
        console.error("Error @verifyUserEmail ::", error);
    }
}

// Function to resend verification link to the user's email
export async function resendVerificationLink(req, res) {
    try {
        // Fetching the user by id using the desired service
        const user = await getUserById(req.user._id);

        // If user not found, throw an error
        if (!user) throw new APIError(404, 'User not found!');

        // If user's email is already verified, throw a conflict error
        if (user.isEmailVerified) throw new APIError(409, `${user.email} is already verified!`);

        // Send the verification link to the user with service
        await sendEmailVerificationLink(user);

        // Return with the success response
        return res.status(200).json(new APIResponse(200, { status: 'SENT' }, `Verification link sent to ${user.email}`));
    } catch (error) {
        console.error("Error @resendVerificationLink ::", error?.message ?? error);
        throw new APIError(500, error?.message ?? `${error}`);
    }
}

// Function to refresh the expired access token
export async function refreshAccessToken(req, res) {
    // Extract refresh token from cookies
    const refreshToken = req.cookies?.refreshToken;
    if (!refreshToken) throw new APIError(401, 'Unauthorized access!');

    try {
        // Decode refresh token and extract user id
        const decodedRefreshToken = validateToken(refreshToken, process.env.REFRESH_TOKEN_SECRET);

        // Ensure the user exists
        const user = await getUserById(decodedRefreshToken._id);
        if (!user) throw new APIError(404, 'User not found!');

        // User must still have a valid stored refresh token (not logged out)
        if (!user.refreshToken) throw new APIError(401, 'You must be logged in!');

        // Prevent token replay: verify stored refresh token matches cookie
        if (user.refreshToken !== refreshToken) throw new APIError(401, 'Invalid Refresh Token!');

        // Generate new access/refresh token pair
        const { accessToken, refreshToken: newRefreshToken } = generateAccessAndRefreshTokens(user._id);

        // Persist updated refresh token
        user.refreshToken = newRefreshToken;
        await user.save({ validateBeforeSave: false });

        // Send new tokens in secure, httpOnly cookies
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

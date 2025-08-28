// Database collections
import userModel from "../models/user.models.js";

// Helper functions
import { generateToken } from "../utils/index.js";

/**
 * Checks if a user exists in the database by username or email
 * @async
 * @function checkExistingUser
 * @param {string} username - The username to search for
 * @param {string} email - The email address to search for
 * @returns {Promise<Object|null>} A promise that resolves to the user document if found, null otherwise
 * @description Uses MongoDB's $or operator to find a user matching either the username or email
 */
export async function checkExistingUser(username, email) {
    return await userModel.findOne({ $or: [{ username }, { email }] });
}

/**
 * Retrieves a user by their email, excluding sensitive fields
 * @async
 * @function getUserByEmail
 * @param {string} email - The email of the user
 * @returns {Promise<Object|null>} A promise that resolves to the user document without sensitive fields, null if not found
 * @description Excludes password, refreshToken, emailVerificationToken, and emailVerificationExpiry fields from the result
 */
export async function getUserByEmail(email) {
    return await userModel.findById(email).select("-password -refreshToken -emailVerificationToken -emailVerificationExpiry");
}

/**
 * Retrieves a user by their unique identifier, excluding sensitive fields
 * @async
 * @function getUserById
 * @param {string} userId - The unique identifier of the user
 * @returns {Promise<Object|null>} A promise that resolves to the user document without sensitive fields, null if not found
 * @description Excludes password, refreshToken, emailVerificationToken, and emailVerificationExpiry fields from the result
 */
export async function getUserById(userId) {
    return await userModel.findById(userId).select("-password -refreshToken -emailVerificationToken -emailVerificationExpiry");
}

/**
 * Creates a new user in the database with unverified email status
 * @async
 * @function createNewUser
 * @param {string} username - The username for the new user
 * @param {string} email - The email address for the new user
 * @param {string} password - The password for the new user
 * @returns {Promise<Object>} A promise that resolves to the newly created user document
 * @description Creates a user with isEmailVerified set to false by default
 */
export async function createNewUser(username, email, password) {
    return await userModel.create({ username, email, password, isEmailVerified: false });
}

/**
 * Generates access and refresh tokens for a user and stores the refresh token in the database
 * @async
 * @function generateAccessAndRefreshTokens
 * @param {string} userId - The unique identifier of the user to generate tokens for
 * @returns {Promise<Object>} A promise that resolves to an object containing both tokens
 * @returns {string} `accessToken` - The generated JWT access token containing user id, username, and email
 * @returns {string} `refreshToken` - The generated JWT refresh token containing only user id
 * @throws {APIError} Throws an APIError with status 500 if token generation fails or user is not found
 * @description Retrieves user by ID, generates JWT access and refresh tokens using environment variables for secrets and expiry times, saves the refresh token to the user document in the database, and returns both tokens. The access token includes user identification data while the refresh token contains minimal payload for security.
 */
export async function generateAccessAndRefreshTokens(userId) {
    try {
        // Fetch the user using a desired service
        const user = await getUserById(userId);

        // Generating an access token for the user
        const accessToken = generateToken({
            id: user?._id,
            username: user?.username,
            email: user?.email
        }, process.env.ACCESS_TOKEN_SECRET, process.env.ACCESS_TOKEN_EXPIRY);

        // Generating and assigning a refresh token to the user
        user.refreshToken = generateToken({ id: user?._id }, process.env.REFRESH_TOKEN_SECRET, process.env.REFRESH_TOKEN_EXPIRY);

        // Saving the modified user fields
        await user.save({ validateBeforeSave: false });

        // Return access token and refresh token
        return { accessToken, refreshToken: user.refreshToken };
    } catch (error) {
        console.error("Error @generateAccessAndRefreshTokens ::", error?.message);
        throw new APIError(500, error?.message);
    }
}
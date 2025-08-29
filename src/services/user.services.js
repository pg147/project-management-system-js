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
export async function getUserByEmail(email, withPassword = false) {
    return await userModel.findOne({ email }).select(`${withPassword ? '' : '-password'} -refreshToken -emailVerificationToken -emailVerificationExpiry`);
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

/**
 * Sends a temporary token-based link via email to a user
 * @async
 * @function sendLinkViaEmail
 * @param {Object} user - The user document from the database (Mongoose model instance)
 * @param {string} user.email - The user's email address
 * @param {Function} user.save - Mongoose save method to persist changes
 * @param {string} tokenField - The name of the field to store the hashed token (e.g., 'emailVerificationToken', 'passwordResetToken')
 * @param {string} tokenFieldExpiry - The name of the field to store the token expiry timestamp (e.g., 'emailVerificationExpiry', 'passwordResetExpiry')
 * @param {string} emailSubject - The subject line for the email
 * @param {string} emailContent - The HTML content for the email (typically generated by mailgen)
 * @returns {Promise<void>} A promise that resolves when the token is saved and email is sent
 * @throws {Error} Throws an error if token generation, user saving, or email sending fails
 * @description Generates a temporary token with a 20-minute expiry, stores the hashed version in the specified user fields, saves the user document, and sends an email with the provided subject and content. This is a generic utility function that can be used for various token-based operations like email verification, password reset, etc.
 * @example
 * // For email verification
 * await sendLinkViaEmail(
 *   user,
 *   'emailVerificationToken',
 *   'emailVerificationExpiry',
 *   'Please verify your email',
 *   verificationEmailContent(user.username, verificationUrl)
 * );
 * 
 * // For password reset
 * await sendLinkViaEmail(
 *   user,
 *   'passwordResetToken',
 *   'passwordResetExpiry',
 *   'Reset your password',
 *   passwordResetEmailContent(user.username, resetUrl)
 * );
 */
export async function sendLinkViaEmail(user, tokenField, tokenFieldExpiry, emailSubject, emailContent) {
    // Generating a temporary token for the user
    const { unhashedToken, hashedToken, tokenExpiry } = generateTemporaryToken();

    // Assigning temporary token values to desired fields
    user[`${tokenField}`] = hashedToken;
    user[`${tokenFieldExpiry}`] = tokenExpiry;

    // Saving the modified user fields
    await user.save({ validateBeforeSave: false });

    // Sending a verification link to the user's email
    await sendEmail({
        email: user?.email,
        subject: emailSubject,
        mailgenContent: emailContent,
    });
}
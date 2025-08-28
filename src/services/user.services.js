import userModel from "../models/user.models.js";

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


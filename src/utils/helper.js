// Crypto modules
import bcrypt from 'bcryptjs';
import { randomBytes, createHash } from "node:crypto";

// JWT module
import jwt from 'jsonwebtoken';

/**
 * Hashes a plain text password using bcrypt with a salt round of 10.
 * 
 * @async
 * @function hashPassword
 * @param {string} password - The plain text password to be hashed
 * @returns {Promise<string>} A promise that resolves to the hashed password string
 * @throws {Error} Throws an error if the hashing process fails
 */
export async function hashPassword(password) {
    return await bcrypt.hash(password, 10);
}

/**
 * Validates a plain text password against a stored bcrypt hash.
 * 
 * @async
 * @function validatePassword
 * @param {string} password - The plain text password to validate
 * @param {string} storedHash - The bcrypt hashed password to compare against
 * @returns {Promise<boolean>} A promise that resolves to true if the password matches the hash, false otherwise
 * @throws {Error} Throws an error if the comparison process fails
 */
export async function validatePassword(password, storedHash) {
    return await bcrypt.compare(password, storedHash);
}

/**
 * Generates a JSON Web Token (JWT) with the specified payload, secret, and expiration time.
 * 
 * @function generateToken
 * @param {Object} payload - The data to be encoded in the JWT (e.g., user ID, roles)
 * @param {string} secret - The secret key used to sign the token
 * @param {string|number} expiry - The expiration time for the token (e.g., '1h', '7d', 3600)
 * @returns {string} The signed JWT token
 * @throws {Error} Throws an error if token generation fails
 *
 */
export function generateToken(payload, secret, expiry) {
    return jwt.sign(payload, secret, {
        expiresIn: expiry
    });
}

/**
 * Validates and decodes a JSON Web Token (JWT) using the provided secret key.
 * 
 * @function validateToken
 * @param {string} token - The JWT token to validate and decode
 * @param {string} secret - The secret key used to verify the token signature
 * @returns {Object} The decoded token payload if valid
 * @throws {JsonWebTokenError} Throws an error if the token is invalid, expired, or malformed
 *
 */
export function validateToken(token, secret) {
    return jwt.verify(token, secret);
}

/**
 * Generates a temporary token with an unhashed token (string), hashed version, and expiry time.
 * Used for temporary authentication purposes like password reset or email verification.
 * 
 * @function generateTemporaryToken
 * @returns {Object} An object containing the temporary token components
 * @returns {string} `unhashedToken` - The original random (token) string
 * @returns {string} `hashedToken` - The SHA256 hashed version
 * @returns {number} `tokenExpiry` - The expiration timestamp
 *
 */
export function generateTemporaryToken() {
    // Generating a random string for hashing
    const unhashedToken = randomBytes(256).toString('hex');

    // Creating a hash using the generated string
    const hashedToken = createHash('sha256').update(unhashedToken).digest('hex');

    // Creating an expiry for the token
    const tokenExpiry = Date.now() + (20*60*1000) // 20 mins

    // Return the generated essentials 
    return { unhashedToken, hashedToken, tokenExpiry };
}
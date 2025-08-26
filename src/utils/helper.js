// Dependencies
import bcrypt from 'bcryptjs';

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
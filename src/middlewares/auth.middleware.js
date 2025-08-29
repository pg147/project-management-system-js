// Helper functions
import { APIError, validateToken } from "../utils/index.js";

// Services
import { getUserById } from "../services/user.services.js";

// Middleware function to check authentication for an user
export async function checkAuthentication(req, res, next) {
    // Extracting token either from cookies or headers
    const token = req.cookies?.accessToken || req.headers['authorization']?.split(' ')[1];

    // If no token was found, throw an unauthorized error
    if (!token) throw new APIError(401, 'Unauthorized Access!');

    try {
        // Decoding the token
        const decodedToken = validateToken(token, process.env.ACCESS_TOKEN_SECRET);

        // Fetching the user with decoded token data
        const user = await getUserById(decodedToken?.id);

        // If no user was found, throw an invalid token error
        if (!user) throw new APIError(401, 'Invalid access token!');

        // Assigning user details to a custom req field
        req.user = user;

        // Passing the control to the next function
        next();
    } catch (error) {
        console.error("Error @checkAuthentication ::", error);
        throw new APIError(401, 'Error while checking authentication!');
    }
}
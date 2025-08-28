// Helper functions
import { APIError, APIResponse } from "../utils/apiHelper.js";

// Function to check the status of the server
export function healthCheck(req, res) {
    try {
        return res.status(200).json(new APIResponse(200, { message: 'Server is running fine! '}));
    } catch (error) {
        console.error("Error @healthCheck ::", error);
        return res.status(500).json(new APIError(500, 'Internal Server Error'));
    }
}
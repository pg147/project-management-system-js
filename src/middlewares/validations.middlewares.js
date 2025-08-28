// Validator modules
import { validationResult } from "express-validator";

// Helper functions
import { APIError } from "../utils/apiHelper.js";

export function validateRequest(req, res, next) {
    // Validating request
    const errors = validationResult(req.body);

    // If errors not found, pass on the control to the next function
    if (errors.isEmpty()) return next();

    const extractedErrors = []; // initialized empty array for errors

    // Map through each error to add in the extracted errors array
    errors.array().map((error) => extractedErrors.push({ [error.path]: error.msg }));

    // Throw new API Error, also pass the errors
    throw new APIError(422, "Provided values aren't valid!", extractedErrors);
}
// Services
import { checkExistingUser, createNewUser, getUserById } from "../services/user.services.js";

// Helper functions
import { APIError, APIResponse } from "../utils/apiHelper.js";
import { generateTemporaryToken, generateToken } from "../utils/helper.js";
import { sendEmail, verificationEmailContent } from "../utils/mail.js";

// Function to generate access and refresh tokens for the user
export async function generateAccessAndRefreshTokens(userId) {
    try {
        // Fetch the user using a desired service
        const user = await getUserById(userId);

        // Generating an access token for the user
        const accessToken = generateToken({ id: user?._id, username: user?.username, email: user?.email }, process.env.ACCESS_TOKEN_SECRET, process.env.ACCESS_TOKEN_EXPIRY);

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

// Function to register a new user
export async function registerUser(req, res) {
    // Extracting user details from the request body
    const { username, email, password } = req.body;

    // Checking if the user is already signed up using a desired service
    const existingUser = await checkExistingUser(username, email);

    // If the user is signed up already, throw a conflict error
    if (existingUser) throw new APIError(409, `User with email ${email} already exists!`, []);

    try {
        // Creating a new user in the database using a desired service
        const user = await createNewUser(username, email, password);

        // Generating a temporary token for the user
        const { unhashedToken, hashedToken, tokenExpiry } = generateTemporaryToken();

        // Assigning temporary token values to desired fields
        user.emailVerificationToken = hashedToken;
        user.emailVerificationExpiry = tokenExpiry;

        // Saving the modified user fields
        await user.save({ validateBeforeSave: false });

        // Sending a verification link to the user's email
        await sendEmail({
            email: user?.email,
            subject: 'Please verify your email',
            mailgenContent: verificationEmailContent(user.username, `${req.protocol}://${req.get("host")}/api/v1/users/verify/${unhashedToken}`),
        });

        // Fetching the newly created user
        const createdUser = await getUserById(user._id);

        // Return the created user
        return res.status(201).json(new APIResponse(201, { user: createdUser }, 'User created and verification link sent successfully!'));
    } catch (error) {
        console.error("Error @registerUser ::", error?.message);
        throw new APIError(500, error?.message);
    }
}
// Services
import {
    checkExistingUser,
    createNewUser,
    generateAccessAndRefreshTokens,
    getUserByEmail,
    getUserById
} from "../services/user.services.js";

// Helper functions
import {
    APIError,
    APIResponse,
    generateTemporaryToken,
    generateToken,
    validatePassword,
    sendEmail,
    verificationEmailContent
} from "../utils/index.js";

// Validation schemas
import { signupValidationSchema } from "../validations/index.js";

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

// Function to login an existing user
export async function loginUser(req, res) {
    // Extracting user details from the request body
    const { email, password } = req.body;

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
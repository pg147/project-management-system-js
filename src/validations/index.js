import { body } from 'express-validator';

export function signupValidations() {
    return [
        // Username validations
        body("username")
            .trim()
            .notEmpty()
            .withMessage('Username is required!')
            .isLowercase()
            .withMessage('Only lowercase username accepted!')
            .isLength({ min: 4 })
            .withMessage('Username must be minimum of 4 characters'),

        // Email validations
        body("email")
            .trim()
            .notEmpty()
            .withMessage('Email is required!')
            .isEmail()
            .withMessage('Invalid email'),

        // Password validations
        body("password")
            .trim()
            .notEmpty()
            .withMessage('Password is required!')
            .isLength({ min: 6 })
            .withMessage('Password must be minimum of 6 characters')
    ];
}
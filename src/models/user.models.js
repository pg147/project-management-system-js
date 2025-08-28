// Mongoose ORM essentials
import mongoose, { Schema, model } from "mongoose";

// Helper functions
import { hashPassword } from "../utils/helper.js";

// Schema for the user collection
const userSchema = new Schema({
    avatar: {
        type: {
            url: String,
            localPath: String
        },
        default: {
            url: `https://placehold.co/200x200`,
            localPath: ''
        }
    },
    username: {
        type: String,
        unique: true,
        required: true,
        lowercase: true,
        trim: true,
        index: true
    },
    email: {
        type: String,
        unique: true,
        required: true,
        lowercase: true,
        trim: true
    },
    fullName: {
        type: String
    },
    password: {
        type: String,
        required: [true, 'Password is required!']
    },
    isEmailVerified: {
        type: Boolean,
        default: false
    },
    refreshToken: {
        type: String
    },
    forgotPasswordToken: {
        type: String
    },
    forgotPasswordExpiry: {
        type: Date
    },
    emailVerificationToken: {
        type: String
    },
    emailVerificationExpiry: {
        type: Date
    }
}, { timestamps: true });

// Pre-hook Middleware for hashing the password, only when modified or on the first ever signup attempt
userSchema.pre('save', async function (next) {
    // Checking if the password is modified
    if (!this.isModified('password')) {
        // If not modified, pass control to the next function
        return next();
    } else {
        // If password modified, generate a hash
        this.password = await hashPassword(this.password);

        // Pass control to the next function
        next();
    }
});

// Creating a collection for users with the above schema
const User = mongoose.models?.user || model('user', userSchema);

export default User;
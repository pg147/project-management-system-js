// Dependencies
import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import cookieParser from 'cookie-parser';

// Configurations
import { connectDB } from "./db/config.js";

// Route handlers
import { healthCheckRouter, userRouter } from "./routes/index.js";

// Configuration for environment variables
dotenv.config();

const app = express(); // initialized an express app
const PORT = process.env.PORT ?? 3001; // assigned a PORT for running server

// CORS Configuration
app.use(cors({
    origin: process.env.CORS_ALLOWED_ORIGIN || "http://localhost:3001",
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS']
}));

// Middlewares
app.use(express.json({ limit: "16kb" }));
app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));
app.use(cookieParser());

// Default GET/Entry Route for the server
app.get('/', (req, res) => {
    return res.json({
        status: 'OK'
    });
})

// Request handlers
app.use('/api/v1/healthcheck', healthCheckRouter);
app.use('/api/v1/users', userRouter);

// Connecting to the database, if successful, then start the server
connectDB().then(() => {
    // Listener for running server
    app.listen(PORT, () => {
        console.log(`Server running on http://localhost:${PORT}`);
    });
}).catch((error) => console.error(error));

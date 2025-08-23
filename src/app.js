// Dependencies
import express from 'express';
import dotenv from 'dotenv';

// Configuration for environment variables
dotenv.config();

const app = express(); // initialized an express app
const PORT = process.env.PORT ?? 3001; // assigned a PORT for running server

// Middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Listener for running server
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
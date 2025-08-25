// ORM Dependencies
import mongoose from 'mongoose';

// Async function to establish connection with the database
export async function connectDB() {
    try {
        await mongoose.connect(process.env.DATABASE_URL);
        console.log("Database connected successfully!");
    } catch (error) {
        console.error("Error connecting to the database ::", error);
        process.exit(1);
    }
}
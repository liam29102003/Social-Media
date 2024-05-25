import express from "express";
import dotenv from "dotenv";
import authRoutes from "./routes/authRoutes.js";
import connecttoMongoDB from "./db/connecttoMongoDB.js";

dotenv.config();
const app = express();
const PORT = process.env.PORT || 8000;

app.use("/api/auth", authRoutes);

app.listen(PORT, () => {
    console.log("Server is running on port " + PORT);
    connecttoMongoDB();
})
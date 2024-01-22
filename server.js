// "type": "module", // now we can use import instead of require
import express from "express";
import dotenv from "dotenv";
import connectDB from "./db/connectDB.js"; // if file ko import karna ho toh .js extension dena padta hai
import cookieParser from "cookie-parser";
import bodyParser from 'body-parser';

import userRoutes from "./routes/userRoutes.js";
import postRoutes from "./routes/postRoutes.js";

import { v2 as cloudinary } from 'cloudinary';

dotenv.config();

connectDB();
const app = express();

const PORT = process.env.PORT || 5000;

// cloudinary config
cloudinary.config({
     cloud_name: process.env.CLOUDNARY_CLOUD_NAME,
     api_key: process.env.CLOUDNARY_API_KEY,
     api_secret: process.env.CLOUDNARY_API_SECRET
});

// parse application/x-www-form-urlencoded true means we can send nested objects in the url
app.use(bodyParser.urlencoded({ extended: true }))
// parse application/json
app.use(bodyParser.json({limit: '50mb'}))

app.use(cookieParser()); // to parse cookies

// what is middleware?
// middleware is a function that has access to the request and response object

// routes
app.use("/api/users", userRoutes);
app.use("/api/posts", postRoutes);
// app.get("/api/users/signup", (req, res) => {
//      res.send("API is running...");
// });

app.listen(PORT, () => console.log(`Server running on port htttp://localhost:${PORT}`));
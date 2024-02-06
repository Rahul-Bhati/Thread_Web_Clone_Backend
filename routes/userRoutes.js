import express from "express";
import { signupUser, loginUser, logoutUser, followUnfollowUser, updateUser, getUserProfile } from "../controllers/userController.js";
import protectRoute from "../middlewares/protectRoute.js";

const router = express.Router();

// router.get("/profile/:query", (req, res) => res.send("Hello"));
router.get("/profile/:query", getUserProfile);
router.post("/signup", signupUser);
router.post("/login", loginUser);
router.post("/logout", logoutUser);
router.post("/follow/:id", protectRoute, followUnfollowUser); // protectRoute is a middleware function that checks if the user is logged in or not before following/unfollowing a user and if user have a valid jwt cookie or not
router.put("/update/:id", protectRoute, updateUser);


export default router;
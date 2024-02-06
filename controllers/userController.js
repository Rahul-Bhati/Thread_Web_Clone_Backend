import User from "../models/userModel.js";
import Post from "../models/postModel.js";

import bcrypt from "bcryptjs";
import generateTokenAndSetCookie from "../utils/helpers/generateTokenAndSetCookie.js";
import { v2 as cloudinary } from "cloudinary";
import mongoose from "mongoose";


// @desc    Get user profile
const getUserProfile = async (req, res) => {
     // We will fetch user profile either with username or userId
     // query is either username or userId
     const { query } = req.params;

     try {
          let user;

          // query is userId
          if (mongoose.Types.ObjectId.isValid(query)) {
               user = await User.findOne({ _id: query }).select("-password").select("-updatedAt");
          } else {
               // query is username
               user = await User.findOne({ username: query }).select("-password").select("-updatedAt");
          }

          if (!user) return res.status(404).json({ error: "User not found" });

          res.status(200).json(user);
     } catch (err) {
          res.status(500).json({ error: err.message });
          console.log("Error in getUserProfile: ", err.message);
     }
};

// @desc    Signup a new user
const signupUser = async (req, res) => {
     try {
          const { name, email, username, password } = req.body;
          const user = await User.findOne({ $or: [{ email }, { username }] }); // find user by email or username

          if (user) {
               res.status(400).json({ error: "User already exists" });
               return;
          }

          // first becrypt the password
          const salt = await bcrypt.genSalt(10); // 10 is the number of rounds, as higher the number, more secure the password will be but it will take more time to generate the hash value
          const hashedPassword = await bcrypt.hash(password, salt);

          // create a new user
          const newUser = await User.create({
               name,
               email,
               username,
               password: hashedPassword,
          });

          await newUser.save();

          // send the response
          if (newUser) {
               generateTokenAndSetCookie(newUser._id, res); // generate token and set cookie in the response object

               res.status(201).json({
                    _id: newUser._id,
                    name: newUser.name,
                    email: newUser.email,
                    username: newUser.username,
                    password: newUser.password,
               });
          } else {
               res.status(400).json({ error: "Invalid user data" });
          }
     } catch (error) {
          console.error(`Error: ${error.message}`);
          res.status(500).json({ error: error.message });
     }
}

// @desc    Login a user
const loginUser = async (req, res) => {
     try {
          const { username, password } = req.body;
          const user = await User.findOne({ username });

          // console.log(user, req.body)

          const isPasswordCorrect = await bcrypt.compare(password, user?.password || ""); // if user is null, then user.password will throw an error, so we use optional chaining operator (?.) and if user is null, then we pass an empty string as the second argument to compare function

          if (!user || !isPasswordCorrect) return res.status(400).json({ error: "Invalid credentials" });

          generateTokenAndSetCookie(user._id, res); // generate token and set cookie in the response object

          res.status(200).json({
               _id: user._id,
               name: user.name,
               email: user.email,
               username: user.username,
               bio: user.bio,
               profilePic: user.profilePic,
          });
     }
     catch (error) {
          console.error(`Error: ${error.message}`);
          res.status(500).json({ error: error.message });
     }
}

const logoutUser = (req, res) => {
     try {
          res.cookie("jwt", "", { maxAge: 1 }); // set the jwt cookie to an empty string and set the maxAge to 1ms
          res.status(200).json({ message: "User logged out successfully" });
     }
     catch (error) {
          console.error(`Error: ${error.message}`);
          res.status(500).json({ error: error.message });
     }
}

const followUnfollowUser = async (req, res) => {
     try {
          const { id } = req.params; // id of the user to follow/unfollow
          const userToModify = await User.findById(id); // user to follow/unfollow
          const currentUser = await User.findById(req.user._id); // current user

          const userId = req.user._id.toString(); // id of the current user
          // id of the user who is trying to follow/unfollow yourself

          if (id === userId) return res.status(400).json({ error: "You cannot follow/unfollow yourself" });

          if (!userToModify || !currentUser) return res.status(400).json({ error: "User not found" });

          const isFollowing = currentUser.following.includes(id); // check if the current user is already following the user to follow/unfollow

          if (isFollowing) {
               // if yes, then unfollow the user
               await User.findByIdAndUpdate(userId, { $pull: { following: id } }); // remove the id of the user to follow/unfollow from the following array of the current user
               await User.findByIdAndUpdate(id, { $pull: { followers: userId } }); // remove the id of the current user from the followers array of the user to follow/unfollow

               res.status(200).json({ message: "User unfollowed successfully" });
          }
          else {
               // if no, then follow the user
               await User.findByIdAndUpdate(userId, { $push: { following: id } }); // add the id of the user to follow/unfollow to the following array of the current user
               await User.findByIdAndUpdate(id, { $push: { followers: userId } }); // add the id of the current user to the followers array of the user to follow/unfollow
               res.status(200).json({ message: "User followed successfully" });
          }

     }
     catch (error) {
          console.error(`Error of follow and unfollow: ${error.message}`);
          res.status(500).json({ error: error.message });
     }

}

const updateUser = async (req, res) => {
     const { name, email, username, password, bio } = req.body;
     let { profilePic } = req.body;
     const userId = req.user._id.toString();

     try {
          let user = await User.findById(userId);
          if (!user) return res.status(400).json({ error: "User not found" });

          if (req.params.id !== userId) return res.status(400).json({ error: "You cannot update other user's profile" }); // check if the user is trying to update other user's profile

          if (password) {
               const salt = await bcrypt.genSalt(10);
               const hashedPassword = await bcrypt.hash(password, salt);
               user.password = hashedPassword;
          }


          // upload the profile pic to cloudinary
          if (profilePic) {
               if (user.profilePic) {
                    // delete the previous profile pic from cloudinary
                    const imageId = user.profilePic.split("/").pop().split(".")[0]; // get the image id from the profilePic url
                    await cloudinary.uploader.destroy(imageId);
               }

               const uploadedResponse = await cloudinary.uploader.upload(profilePic);
               profilePic = uploadedResponse.secure_url;
          }

          user.name = name || user.name;
          user.email = email || user.email;
          user.username = username || user.username;
          user.profilePic = profilePic || user.profilePic;
          user.bio = bio || user.bio;

          user = await user.save();

          // find all the posts of the user and update the username and profilePic of the user in all the posts
          await Post.updateMany(
               { "replies.userId": userId },
               {
                    "$set": {
                         "replies.$[reply].username": user.username,
                         "replies.$[reply].userProfilePic": user.profilePic
                    }
               },
               { arrayFilters: [{ "reply.userId": userId }] }
          ); // update the username of the user in all the posts

          // password should not be sent in the response so it set to null
          user.password = null;

          res.status(200).json(user);
     } catch (error) {
          console.error(`Error: ${error.message}`);
          res.status(500).json({ error: error.message });
     }
}

export { signupUser, loginUser, logoutUser, followUnfollowUser, updateUser, getUserProfile };
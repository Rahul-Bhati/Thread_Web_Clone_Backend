import User from "../models/userModel.js";
import bcrypt from "bcryptjs";
import generateTokenAndSetCookie from "../utils/helpers/generateTokenAndSetCookie.js";

// @desc    Signup a new user
const signupUser = async (req, res) => {
     try {
          const { name, email, username, password } = req.body;
          const user = await User.findOne({ $or: [{ email }, { username }] }); // find user by email or username

          if (user) {
               res.status(400).json({ message: "User already exists" });
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
               res.status(400).json({ message: "Invalid user data" });
          }
     } catch (error) {
          console.error(`Error: ${error.message}`);
          res.status(500).json({ message: error.message });
     }
}

// @desc    Login a user
const loginUser = async (req, res) => {
     try {
          const { username, password } = req.body;
          const user = await User.findOne({ username });

          console.log(user, req.body)

          const isPasswordCorrect = await bcrypt.compare(password, user?.password || ""); // if user is null, then user.password will throw an error, so we use optional chaining operator (?.) and if user is null, then we pass an empty string as the second argument to compare function

          if (!user || !isPasswordCorrect) return res.status(400).json({ message: "Invalid credentials" });

          generateTokenAndSetCookie(user._id, res); // generate token and set cookie in the response object

          res.status(200).json({
               _id: user._id,
               name: user.name,
               email: user.email,
               username: user.username,
               password: user.password,
          });
     }
     catch (error) {
          console.error(`Error: ${error.message}`);
          res.status(500).json({ message: error.message });
     }
}

export { signupUser, loginUser };
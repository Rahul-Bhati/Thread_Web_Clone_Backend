import User from "../models/userModel.js";
import jwt from "jsonwebtoken";

const protectRoute = async (req, res, next) => {
     try {
          const token = req.cookies.jwt; // jwt name is same as the name we gave while setting the cookie in generateTokenAndSetCookie function in userController.js

          if (!token) return res.status(401).json({ message: "Unauthorized" });

          const decoded = jwt.verify(token, process.env.JWT_SECRET); // verify the token and get the decoded data from the token (decoded data is the payload data we passed while generating the token)

          const user = await User.findById(decoded.userId).select("-password"); // find the user with the decoded id and select all the fields except password

          req.user = user;

          next(); // call the next middleware function (followUnfollowUser function in userController.js)
     } catch (error) {
          console.error(`Error: ${error.message}`);
          res.status(500).json({ message: error.message });
     }
}

export default protectRoute;
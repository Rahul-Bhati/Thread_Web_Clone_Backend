import jwt from "jsonwebtoken";

// for generating token and setting cookie in the response object
const generateTokenAndSetCookie = (userId, res) => {
	const token = jwt.sign({ userId }, process.env.JWT_SECRET, {
		expiresIn: "15d",
	});

	res.cookie("jwt", token, {
		httpOnly: true, // more secure as it prevents client side javascript from accessing the cookie
		maxAge: 15 * 24 * 60 * 60 * 1000, // 15 days in milliseconds
		sameSite: "strict", // CSRF protection (Cross-Site Request Forgery)
	});

	return token;
};

export default generateTokenAndSetCookie;

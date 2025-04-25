import jwt from "jsonwebtoken";
import User from "../models/userModel.js"; // Assuming you have a Vendor model

export const verifyUser = async (req, res, next) => {
  try {
    // Extract Bearer token
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) {
      return res
        .status(401)
        .json({ message: "Access Denied: No token provided" });
    }

    // Decode the token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Find the user by ID
    const user = await User.findById(decoded.id);
    if (!user) {
      return res
        .status(403)
        .json({ message: "User not found or invalid token" });
    }

    // Attach token and user to the request
    req.token = token;
    req.user = user;
    next();
  } catch (error) {
    console.error("Auth Error:", error.message);
    res.status(401).json({ message: "Invalid or expired token" });
  }
};

export const verifyToken = async (req, res, next) => {
  try {
    const token = req.header("Authorization")?.split(" ")[1]; // Get token from headers

    if (!token) {
      return res
        .status(401)
        .send({ success: false, message: "Access denied. No token provided" });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // Attach user info to request object

    next(); // Move to next middleware/controller
  } catch (error) {
    res
      .status(401)
      .send({ success: false, message: "Invalid or expired token" });
  }
};

export const requiredRole = (...roles) => {
  return (req, res, next) => {
    const userRole = req.user?.role;

    if (!roles.includes(userRole)) {
      return res.status(403).send({
        success: false,
        message: "Access denied. Insufficient permissions.",
      });
    }

    next();
  };
};


import jwt from "jsonwebtoken";
import User from "../models/userModel.js"; // Assuming you have a Vendor model


export const verifyUser = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(" ")[1]; // Extract Bearer token
    if (!token) return res.status(401).send({ message: "Access Denied" });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);

    if (!user) return res.status(403).send({ message: "Not a valid vendor" });

    req.token = token;
    req.user = user; // Attach user data to the request
    next();
  } catch (error) {
    res.status(401).json({ message: "Invalid Token" });
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

export const requiredRole = (role) => {
  return (req, res, next) => {
    if (req.user.role !== role) {
      return res.status(403).send({ message: 'Access denied' });
    }
    next();
  };
};


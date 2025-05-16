import User from "../models/userModel.js";
import Token from "../models/tokenModel.js";
import { hashFn, comparePasswords, sendEmail } from "../utils/utils.js";
// import cloudinary from "../config/cloudinary.js";

import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import crypto from "crypto";
import bcrypt from "bcryptjs";

dotenv.config();

//handling the user's authentication
export const registerUser = async (req, res) => {
  const { fullName, email, department, level, password } = req.body;
  const hashedPassword = await hashFn(password);

  try {
    // Check if user exists
    const exists = await User.findOne({ email });
    if (exists)
      return res
        .status(400)
        .send({ success: false, message: "User already exists" });

    // Create user
    const user = new User({
      fullName,
      email,
      department,
      level,
      password: hashedPassword,
      role: "student",
    });
    await user.save();

    const verificationToken = jwt.sign(
      { id: user._id },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    const token = new Token({
      userId: user._id,
      token: verificationToken,
      type: "emailVerification",
    });
    await token.save();

    const verificationLink = `${process.env.BASE_URL}/api/students/verify/${verificationToken}`;
    const emailContent = `<div style="font-family: Arial, sans-serif; color: #333;">
    <p>Hello ${fullName},</p>
    <p>Please verify your email by clicking the link below:</p>
    <a href="${verificationLink}" style="background-color: #4CAF50; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Verify Email</a>
    <p>If you did not request this, you can ignore this email.</p>
        <p>Best regards,<br>TesaLearn Team</p>
    </div>`;

    // Send verification email
    await sendEmail(email, "Verify Your Email", emailContent);

    res.status(201).send({
      success: true,
      message:
        "User registered successfully! Please, check your email for verification.",
      data: {
        fullName: user.fullName,
        email: user.email,
      },
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).send({
        success: false,
        message: "Duplicate field error: " + JSON.stringify(error.keyValue),
      });
    }
    res.status(500).send({ success: false, message: "Server error!", error });
    console.log(error);
  }
};

export const verifyEmail = async (req, res) => {
  try {
    const { token } = req.params;

    // Find the token with type "emailVerification"
    const tokenRecord = await Token.findOne({
      token,
      type: "emailVerification",
    });
    if (!tokenRecord)
      // console.log("this is the token", tokenRecord);
      return res.status(400).send({
        success: false,
        message: "Invalid or expired verification token.",
      });

    console.log("this is the token", tokenRecord);

    // Find the associated student
    const user = await User.findById(tokenRecord.userId);
    if (!user)
      return res
        .status(400)
        .send({ success: false, message: "User not found." });

    // Mark as verified
    user.verified = true;
    await user.save();

    // Delete the verification token
    await Token.deleteOne({ token });

    // Send success email
    const emailContent = `<div style="font-family: Arial, sans-serif; color: #333;">
                            <p>Hi ${user.fullName},</p>
                            <p>Your email has been successfully verified. You can now log in.</p>
                            <p>Best regards,<br>TesaLearn Team</p>
                            </div>`;

    await sendEmail(user.email, "Account Verified", emailContent);

    res.status(200).send({
      success: true,
      message: "Account successfully verified. You can now log in.",
    });
  } catch (error) {
    console.log("This the error", error);
    res
      .status(400)
      .send({ success: false, message: "Invalid or expired token." });
  }
};

export const resendVerificationEmail = async (req, res) => {
  try {
    const { email } = req.body;

    // Check if the user exists
    const user = await User.findOne({ email });
    if (!user) {
      return res
        .status(404)
        .send({ success: false, message: "User not found." });
    }

    // Check if already verified
    if (user.verified) {
      return res
        .status(400)
        .send({ success: false, message: "Email is already verified." });
    }

    // Generate new verification token
    const newToken = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "1h",
    });

    // Delete any existing token for this user
    await Token.deleteMany({
      userId: user._id,
      type: "emailVerification",
    });

    // Save new token
    const token = await new Token({
      userId: user._id,
      token: newToken,
      type: "emailVerification",
    });
    token.save();

    // Generate new verification link
    const verificationLink = `${process.env.BASE_URL}/api/user/verify/${newToken}`;

    // Send verification email
    const emailContent = `<div style="font-family: Arial, sans-serif; color: #333;">
        <h2>Hello ${user.fullName},</h2>
        <p>You requested a new verification email. Click the button below to verify your email:</p>
        <p>
            <a href="${verificationLink}" style="background-color: #4CAF50; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">
                Verify Email
            </a>
        </p>
        <p>If you did not request this, you can ignore this email.</p>
        <p>Best regards,<br>TesaLearn Team</p>
    </div>`;

    const emailResponse = await sendEmail(
      email,
      "Resend Email Verification",
      emailContent
    );

    if (!emailResponse.success) {
      console.error("Email failed:", emailResponse.message);
      return res.status(500).send({
        success: false,
        message: "Failed to send verification email.",
      });
    }

    res.status(200).send({
      success: true,
      message: "New verification email sent successfully.",
    });
  } catch (error) {
    console.log(error);
    res
      .status(500)
      .send({ success: false, message: "Server error!", error: error.message });
  }
};

const loginByRole = async (req, res, expectedRole) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res
        .status(400)
        .send({ success: false, message: "Email and password are required." });
    }

    const user = await User.findOne({ email });
    //  To compare passwords
    
    if (!user) {
      return res.status(400).send({
        success: false,
        message: `user with (${email}) does not exist!`,
      });
    }
    const getPassword = user.password;

    if (user.role !== expectedRole) {
      return res.status(403).send({
        success: false,
        message: `Unauthorized: This is the ${expectedRole} login endpoint.`,
      });
    }
    const correctPassword = await comparePasswords(password, getPassword);
    if (!correctPassword) {
      return res.status(400).send({
        success: false,
        message: `Incorrect credentials`,
      });
    }
    if (user) {
      // Generate JWT token
      const token = jwt.sign(
        { id: user._id, email: user.email, role: user.role },
        process.env.JWT_SECRET,
        {
          expiresIn: "1h",
        }
      );

      // Generate refresh_token
      const refresh_token = jwt.sign(
        { id: user._id, email: user.email, role: user.role },
        process.env.JWT_REFRESH_SECRET,
        {
          expiresIn: "24h",
        }
      );

      // Store refresh_token
      const storeRefreshToken = async (userId, refreshToken) => {
        await Token.create({
          userId,
          token: refreshToken,
          type: "refreshAccess",
        });
      };

      try {
        await storeRefreshToken(user._id, refresh_token);
      } catch (error) {
        console.error("Failed to store refresh token:", error);
      }

      return res.status(200).send({
        success: true,
        message: `${expectedRole} logged in successfully`,
        data: {
          username: user.username,
          email: user.email,
          role: user.role,
          token,
          refresh_token,
        },
      });
    }
  } catch (err) {
    return res.status(500).send({ success: false, message: err.message });
  }
};

// Export each login method
export const loginStudent = (req, res) => loginByRole(req, res, "student");
export const loginAdmin = (req, res) => loginByRole(req, res, "admin");
export const loginSuperAdmin = (req, res) =>
  loginByRole(req, res, "super_admin");

export const changeUserPassword = async (req, res) => {
  try {
    const { oldPassword, newPassword, confirmNewPassword } = req.body;
    const userId = req.user.id; // Extracted from verifyToken middleware
    console.log(userId);

    // Ensure all fields are provided
    if (!oldPassword || !newPassword || !confirmNewPassword) {
      return res
        .status(400)
        .send({ success: false, message: "All fields are required" });
    }

    const user = await User.findById(userId);
    // Compare old password with the stored hash
    const isMatch = await bcrypt.compare(oldPassword, user.password);
    if (!isMatch) {
      return res
        .status(400)
        .send({ success: false, message: "Old password is incorrect" });
    }

    // Check if new password and confirm password match
    if (newPassword !== confirmNewPassword) {
      return res
        .status(400)
        .send({ success: false, message: "New passwords do not match" });
    }

    // Find the user by ID
    if (!user) {
      return res
        .status(404)
        .send({ success: false, message: "User not found" });
    }

    // Hash the new password
    const hashedPassword = await hashFn(newPassword);

    // Update user's password
    user.password = hashedPassword;
    await user.save();

    res
      .status(200)
      .send({ success: true, message: "Password changed successfully" });
  } catch (error) {
    console.log(user);
    res
      .status(500)
      .send({ success: false, message: "Server error", error: error.message });
  }
};

//delete logic
export const userLogout = async (req, res) => {
  try {
    const { refreshAccess } = req.body;
    console.log(refreshAccess);

    if (!refreshAccess)
      return res
        .status(400)
        .send({ success: false, message: "Refresh token required" });

    // Delete refresh token from DB
    await Token.findOneAndDelete({ token: refreshAccess });

    res.status(200).send({ success: true, message: "Logged out successfully" });
  } catch (error) {
    res.status(500).send({ success: false, message: "Server error" });
  }
};

//forgot password logic
export const userRequestReset = async (req, res) => {
  const { email } = req.body;
  console.log("Request body:", email);
  try {
    // ensure all fields are provided
    if (!email) {
      return res
        .status(400)
        .send({ success: false, message: "Email is required" });
    }
    //get user from database with email
    const user = await User.findOne({ email });
    console.log("This is the user", user);
    if (!user) {
      return res.status(404).send({
        success: false,
        message: `User with email (${email}) does not exists`,
      });
    }

    // Generate reset token and expiration
    const userResetToken = await crypto.randomBytes(32).toString("hex");
    console.log(userResetToken);
    // const resetTokenExpiration = new Date(Date.now() + 3600000); // 1 hour from now

    // Update user record with the token
    await Token.findOneAndUpdate(
      { userId: user._id, type: "passwordReset" },
      {
        userId: user._id,
        token: userResetToken,
        type: "passwordReset",
        createdAt: Date.now(), // Ensures expiration works
      },
      { upsert: true, new: true } // Create if not exist, return updated
    );

    // Send reset email
    const resetLink = `${process.env.FRONTEND_URL}/auth/reset-password?token=${userResetToken}`;
    const emailBody = `<div style="font-family: Arial, sans-serif; color: #333;">
    <p>Hello ${user.fullName},</p>
    <p>Click the button below to set your new password</p>
    <a href="${resetLink}" style="background-color: #4CAF50; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Reset Password</a>
    <p>If you did not request this, you can ignore this email.</p>
    <p>Best regards,<br>TesaLearn Team</p>
    </div>`;
    await sendEmail(
      email || "tom3525001@gmail.com",
      "Password Reset",
      emailBody
    );
    console.log("This is the user email", emailBody, resetLink);

    res.status(200).send({
      success: true,
      message: "Reset link sent to your email.",
      userResetToken,
    });
  } catch (error) {
    res.status(500).send({
      success: false,
      message: "Server error. An error occured",
      error,
    });
    // next(error)
    console.log(error);
  }
};

export const verifyUserResetToken = async (req, res) => {
  const { token } = req.query; // Token from URL

  try {
    console.log("Token from request:", token);

    const resetToken = await Token.findOne({ token, type: "passwordReset" });

    console.log("Token from database:", resetToken);

    if (!resetToken) {
      return res
        .status(400)
        .send({ success: false, message: "Invalid or expired token" });
    }

    // Check token expiration
    const now = new Date();
    const expirationTime = resetToken.createdAt.getTime() + 3600000; // 1 hour
    console.log("Token Expiration Time:", new Date(expirationTime));
    console.log("Current Time:", now);

    if (now.getTime() > expirationTime) {
      return res
        .status(400)
        .send({ success: false, message: "Token has expired" });
    }

    res.status(200).json({
      success: true,
      message: "Token is valid",
      userId: resetToken.userId,
    });
  } catch (error) {
    console.error("Error verifying token:", error);
    res
      .status(500)
      .send({ success: false, message: "Server error", error: error.message });
  }
};

export const userResetPassword = async (req, res) => {
  const { token } = req.query;
  const { newPassword } = req.body;
  try {
    // Find user by token
    const resetToken = await Token.findOne({ token, type: "passwordReset" });
    if (!resetToken || new Date(resetToken.reset_token_expiration) < new Date())
      return res.status(400).send({
        success: false,
        message: "Invalid or expired token.",
      });

    // Find the user by the userId stored in the Token model
    const user = await User.findById(resetToken.userId);

    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    //hash new password
    const hashedPassword = await hashFn(newPassword);

    user.password = hashedPassword; // You should hash this before saving
    await user.save();

    // Delete the token after successful reset
    await Token.deleteOne({ _id: resetToken._id });

    res.status(200).send({
      success: true,
      message: "Password reset successfully.",
    });
  } catch (error) {
    console.log(error);
    res.status(500).send({
      success: false,
      message: "Server error.",
      error,
    });
  }
};

export const refreshTokenHandler = async (req, res) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    return res
      .status(401)
      .send({ success: false, message: "Refresh token required" });
  }

  try {
    // 1. Verify refresh token
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);

    // 2. Check if token exists in DB (optional but safer)
    const tokenDb = await Token.findOne({
      userId: decoded.id,
      token: refreshToken,
      type: "refreshAccess",
    });

    if (!tokenDb) {
      return res
        .status(403)
        .send({ success: false, message: "Invalid or expired refresh token" });
    }

    // 3. Fetch user to generate new access token
    const user = await User.findById(decoded.id);
    if (!user) {
      return res
        .status(404)
        .send({ success: false, message: "User not found" });
    }

    // 4. Generate new access token
    const newAccessToken = jwt.sign(
      { id: user._id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    // Optional: rotate refresh token for added security
    const newRefreshToken = jwt.sign(
      { id: user._id },
      process.env.JWT_REFRESH_SECRET,
      { expiresIn: "7d" }
    );

    // Update in DB
    tokenDb.token = newRefreshToken;
    tokenDb.createdAt = Date.now();
    await tokenDb.save();

    res.status(200).json({
      success: true,
      message: "This is your new refersh token",
      accessToken: newAccessToken,
      refreshToken: newRefreshToken, // optional
    });
  } catch (err) {
    res
      .status(403)
      .send({ success: false, message: "Invalid token", error: err.message });
    console.log(err);
  }
};

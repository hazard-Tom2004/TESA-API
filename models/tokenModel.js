import mongoose from "mongoose";
// const users = await User.findOne({ token })
const tokenSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  token: {
    type: String,
    required: true,
  },
  type: {
    type: String,
    enum: ["emailVerification", "refreshAccess", "passwordReset"], // Differentiate token types
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
    expires: function () {
      return this.type === "refreshAccess" ? 86400 : 3600; // Refresh token expires in 24h, Reset token in 1h
    },
  },
});

export default mongoose.model("Token", tokenSchema);

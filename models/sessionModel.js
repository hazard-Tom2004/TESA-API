// models/CurrentSession.js
import mongoose from "mongoose";

const currentSessionSchema = new mongoose.Schema({
  session: {
    type: String,
    enum: ['2025/2026', '2026/2027', '2027/2028', '2028/2029', '2029/2030'], // adjust as needed
    required: true,
  },
  isCurrent: {
    type: Boolean,
    default: false,
  },
  setBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
}, { timestamps: true });

export default mongoose.model("CurrentSession", currentSessionSchema);

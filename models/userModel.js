import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  fullName: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  department: {
    type: [String],
    enum: [
      "Wood and Biomaterials Engineering",
      "Electrical and Electronic engineering",
      "Agricultural and Environmental Engineering",
      "Civil Engineering",
      "Mechanical Engineering",
      "Food Engineering",
      "Petroleum Engineering",
      "Industrial and Production Engineering",
      "Automotive Engineering",
      "Biomedical Engineering",
    ],
    required: true,
  },
  level: {
    type: [String],
    enum: ["100", "200", "300", "400", "500"],
    required: true,
  },
  password: { type: String, required: true },
  verified: { type: Boolean, default: false }, // User is unverified by default
  tokens: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Token", // This connects a student to multiple tokens
    },
  ],
  role: {
    type: String,
    enum: ['student', 'admin', 'super_admin'],
    default: 'student'
  },  
});

export default mongoose.model("User", userSchema);

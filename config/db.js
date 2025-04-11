import { connect } from "mongoose";
import dotenv from "dotenv";
dotenv.config();
const connectDB = async () => {
  try {
    await connect(process.env.MONGO_URI);
    console.log("Database connection successfully")
  } catch (err) {
    console.log("This is the error:", err);
    process.exit(1);
  }
};

export default connectDB;
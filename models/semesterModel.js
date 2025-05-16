import mongoose from "mongoose";

const currentSemesterSchema = new mongoose.Schema({
  semester: {
    type: String,
    enum: ['First Semester', 'Second Semester'],
    required: true,
  },
  isCurrent: {
    type: Boolean,
    default: false,
  },
  setBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
}, { timestamps: true });

export default mongoose.model("CurrentSemester", currentSemesterSchema);

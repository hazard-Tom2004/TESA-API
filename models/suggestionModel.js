import mongoose from "mongoose";

const suggestionSchema = new mongoose.Schema(
  {
    name: { type: String, required: true }, // Title of the material
    description: {
      type: String,
      required: true,
    },
    email: { type: String, required: true },
    type: {
      type: String,
      enum: [
        "slides/Notes",
        "videos",
        "past Q&A",
        "Solutions",
        "Practicals",
        "Books",
      ],
      required: true,
    },

    videoUrl: { type: String },
    pdfUrl: { type: String },
    docUrl: { type: String },
    pptUrl: { type: String }, // URL or path to the material file (PDF, video, etc.)

    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },

    // 5. Admin Review Notes
    reviewNotes: {
      type: String,
    },

    courseRef: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
      required: true,
    },

    suggestedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true }
);

const Suggestion = mongoose.model("Suggestion", suggestionSchema);
export default Suggestion;

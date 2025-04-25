import mongoose from "mongoose";

const materialSchema = new mongoose.Schema(
  {
    name: { type: String, required: true }, // Title of the material
    description: { type: String }, // Optional description for the material
    videoUrl: { type: String },
    pdfUrl: { type: String },
    docUrl: { type: String },
    pptUrl: { type: String }, // URL or path to the material file (PDF, video, etc.)
    type: {
      type: String,
      enum: [
        "slides/Notes",
        "videos",
        "past Q&A",
        "Solutions",
        "Practicals",
        "Books",
      ], // Material types
      required: true,
    },
    courseRef: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
      required: true,
    },
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    }, // User who uploaded the material
    uploadedAt: { type: Date, default: Date.now }, // Timestamp of the upload
  },
  { timestamps: true }
);

// Pre-validation logic
materialSchema.pre("validate", function (next) {
    const { type, pdfUrl, docUrl, pptUrl, videoUrl } = this;
  
    // Check if the material is a video
    if (type === "videos" && !videoUrl) {
      return next(new Error("Video URL is required for video materials."));
    }
  
    // For non-video materials, ensure at least one of PDF, DOC, or PPT is present
    if (type !== "videos" && !pdfUrl && !docUrl && !pptUrl) {
      return next(
        new Error(
          "At least one file (PDF, DOC, or PPT) must be uploaded for non-video materials."
        )
      );
    }
  
    // Everything is good, continue
    next();
  });


  materialSchema.pre(/^find/, function (next) {
    this.populate({
      path: "courseRef",
      select: "courseCode", // add more fields if needed
    });
    next();
  });
  
  

// 👇 Clean up empty URL fields when converting to JSON
materialSchema.set("toJSON", {
  transform: function (doc, ret) {
    ["videoUrl", "pdfUrl", "pptUrl", "docUrl"].forEach((key) => {
      if (!ret[key]) {
        delete ret[key];
      }
    });
    return ret;
  },
});

export default mongoose.model("Material", materialSchema);

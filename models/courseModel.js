import mongoose from "mongoose"

const courseSchema = new mongoose.Schema(
  {
    courseCode: { type: String, required: true, unique: true },
    courseName: { type: String, required: true },
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
    units: { type: [Number], enum: [1, 2, 3, 4, 5], required: true },
    semester: { type: String, enum: ["first", "second"], required: true },
    shared: { type: Boolean, default: true },
    material: [{ type: mongoose.Schema.Types.ObjectId, ref: "Material" }],
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true }
);

export default mongoose.model("Course", courseSchema);

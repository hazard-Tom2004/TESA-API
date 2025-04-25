import Suggestion from "../models/suggestionModel.js";
import Course from "../models/courseModel.js";
import uploadToCloudinary from "../middlewares/cloudinaryUpload.js"

// POST /api/suggestions
const validTypes = [
  "slides/Notes",
  "videos",
  "past Q&A",
  "Solutions",
  "Practicals",
  "Books",
];

const fileTypeFormat = {
  "slides/Notes": ["ppt", "doc"],
  videos: ["video"],
  "past Q&A": ["pdf"],
  Solutions: ["pdf"],
  Practicals: ["pdf"],
  Books: ["pdf"],
};

export const createSuggestion = async (req, res) => {
  try {
    const { courseCode, materialName, materialDescription, email, type, youtubeUrl } =
      req.body;
    const fileBuffer = req.file?.buffer;
    const mimeType = req.file?.mimetype;

    if (!courseCode || !materialName || !materialDescription || !type || (type === 'videos' && !youtubeUrl)) {
      return res
        .status(400)
        .json({ success: false, message: "Missing required fields." });
    }

    if (!validTypes.includes(type)) {
      return res
        .status(400)
        .json({ success: false, message: `Invalid material type.` });
    }

    const course = await Course.findOne({ courseCode: req.body.courseCode });
    if (!course) {
      return res.status(404).send({
        success: false,
        message: "Course with this CourseCode not found",
      });
    }

    let fileType;
    let fileUrl;

    if (type === "videos" && youtubeUrl) {
      fileType = "video";
      fileUrl = youtubeUrl; // directly assign YouTube URL
    } else {
      if (!fileBuffer || !mimeType) {
        return res
          .status(400)
          .json({
            success: false,
            message: "File is required unless using YouTube URL.",
          });
      }

      if (type === "slides/Notes") {
        if (mimeType.includes("presentation") || mimeType.includes("powerpoint"))
          fileType = "ppt";
         else if (mimeType.includes("msword") || mimeType.includes("wordprocessing"))
          fileType = "doc";
        else
          return res
            .status(400)
            .json({
              success: false,
              message: "slides/Notes must be PPT or DOC format",
            });
      } else {
        fileType = fileTypeFormat[type]?.[0];
      }

      fileUrl = await uploadToCloudinary(fileBuffer, mimeType);
    }

    const suggestion = new Suggestion({
      name: materialName,
      description: materialDescription,
      email,
      type,
      status: "pending",
      courseRef: course._id,
      uploadedBy: req.user._id,
      [`${fileType}Url`]: fileUrl,
    });

    await suggestion.save();

    const responseMaterial = { ...suggestion._doc };
    ["videoUrl", "pdfUrl", "pptUrl", "docUrl"].forEach((key) => {
      if (!responseMaterial[key]) delete responseMaterial[key];
    });

    return res.status(201).json({
      success: true,
      message: "Suggestion uploaded successfully",
      material: responseMaterial,
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};


// GET /api/admin/suggestions/pending
export const getPendingSuggestions = async (req, res) => {
  try {
    const suggestions = await Suggestion.find({ status: "pending" }).populate(
      "suggestedBy",
      "name email"
    );

    res.status(200).send({ success: true, message: "These are the suggestions.", suggestions });
  } catch (error) {
    res.status(500).send({ success: false, message: error.message });
  }
};

// PUT /api/admin/suggestions/:id/approve
export const approveSuggestion = async (req, res) => {
  try {
    const suggestion = await Suggestion.findById(req.params.id);
    const userRole = req.user?.role;

    if (userRole !== "admin" && userRole !== "super_admin") {
      return res.status(403).send({
        success: false,
        message:
          "Unauthorized: Only admins or super_admin can upload materials",
      });
    }

    if (!suggestion) {
      return res
        .status(404)
        .send({ success: false, message: "Suggestion not found" });
    }

    suggestion.status = "approved";
    suggestion.reviewNotes = req.body.review || "";
    await suggestion.save();

    res.status(200).send({ success: true, message: "Suggestion approved", suggestion });
  } catch (error) {
    res.status(500).send({ success: false, message: error.message });
  }
};

// PUT /api/admin/suggestions/:id/reject
export const rejectSuggestion = async (req, res) => {
  try {
    const suggestion = await Suggestion.findById(req.params.id);
    const userRole = req.user?.role;
    
    if (userRole !== "admin" && userRole !== "super_admin") {
      return res.status(403).send({
        success: false,
        message:
          "Unauthorized: Only admins or super_admin can upload materials",
      });
    }
    if (!suggestion) {
      return res
        .status(404)
        .send({ success: false, message: "Suggestion not found" });
    }

    suggestion.status = "rejected";
    suggestion.reviewNotes = req.body.review || "";
    await suggestion.save();

    res.status(200).send({ success: true, message: "Suggestion rejected", suggestion });
  } catch (error) {
    res.status(500).send({ success: false, message: error.message });
  }
};

// GET /api/admin/suggestions/stats
export const getSuggestionStats = async (req, res) => {
  try {
    const stats = await Suggestion.aggregate([
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
        },
      },
    ]);

    res.status(200).send({ success: true, stats });
  } catch (error) {
    res.status(500).send({ success: false, message: error.message });
  }
};

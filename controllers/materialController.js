import Material from "../models/materialModel.js";
import Course from "../models/courseModel.js";
import uploadToCloudinary from "../middlewares/cloudinaryUpload.js";

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

export const uploadMaterial = async (req, res) => {
  try {
    const { courseCode, materialName, materialDescription, type, youtubeUrl } =
      req.body;
    const fileBuffer = req.file?.buffer;
    const mimeType = req.file?.mimetype;

    if (
      !courseCode ||
      !materialName ||
      !materialDescription ||
      !type ||
      (type === "videos" && !youtubeUrl)
    ) {
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
        message: "Course with this code not found",
      });
    }

    let fileType;
    let fileUrl;

    if (type === "videos" && youtubeUrl) {
      fileType = "video";
      fileUrl = youtubeUrl; // directly assign YouTube URL
    } else {
      if (!fileBuffer || !mimeType) {
        return res.status(400).json({
          success: false,
          message: "File is required unless using YouTube URL.",
        });
      }

      if (type === "slides/Notes") {
        if (
          mimeType.includes("presentation") ||
          mimeType.includes("powerpoint")
        )
          fileType = "ppt";
        else if (
          mimeType.includes("msword") ||
          mimeType.includes("wordprocessing")
        )
          fileType = "doc";
        else
          return res.status(400).json({
            success: false,
            message: "slides/Notes must be PPT or DOC format",
          });
      } else {
        fileType = fileTypeFormat[type]?.[0];
      }
      fileUrl = await uploadToCloudinary(fileBuffer, req.file.mimetype);
    }


    const materialData = {
      name: materialName,
      description: materialDescription,
      type,
      courseRef: course._id,
      uploadedBy: req.user._id,
      [`${fileType}Url`]: fileUrl, // Dynamic field assignment
    };

    const newMaterial = new Material(materialData);
    await newMaterial.save();

   
    const responseMaterial = { ...newMaterial._doc };
    ["videoUrl", "pdfUrl", "pptUrl", "docUrl"].forEach((key) => {
      if (!responseMaterial[key]) delete responseMaterial[key];
    });
    console.log("Uploading file with MIME:", req.file.mimetype);

    return res.status(201).send({
      success: true,
      message: "Material uploaded successfully",
      material: responseMaterial,
    });
  } catch (error) {
    console.log("File detected:");
    console.log("Filename:", req.file.originalname);
    console.log("MIME Type:", req.file.mimetype);

    return res.status(500).send({
      success: false,
      message: error.message,
    });
  }
};

// Get materials for a specific course
export const getMaterialsByCourse = async (req, res) => {
  try {
    const course = await Course.findOne({ courseCode: req.params.courseCode });
    if (!course) {
      return res.status(404).send({
        success: false,
        message: "Course not found",
      });
    }

    const materials = await Material.find({ courseRef: course._id });

    if (!materials.length) {
      return res.status(404).send({
        success: false,
        message: "No materials found for this course",
      });
    }

    const result = materials.map((material) => ({
      _id: material._id,
      name: material.name,
      description: material.description,
      type: material.type,
      uploadedBy: material.uploadedBy,
      courseCode: material.courseRef?.courseCode || "N/A",
      courseTitle: material.courseRef?.courseTitle || "N/A",
      createdAt: material.createdAt,
    }));

    res.status(200).send({
      success: true,
      message: "Successfully fetched materials by course code",
      result,
    });
  } catch (error) {
    res.status(500).send({ success: false, message: error.message });
  }
};

// Get materials by type (slides, video, etc.)
export const getMaterialsByType = async (req, res) => {
  try {
    const { type } = req.params;
    const materials = await Material.find({ type });

    if (!materials.length) {
      return res
        .status(404)
        .json({ success: false, message: `No ${type} materials found` });
    }

    res.status(200).send({
      success: true,
      message: "Successfully fetched materials by type",
      materials,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const searchMaterials = async (req, res) => {
  const { query } = req.query;

  if (!query) {
    return res.status(400).json({
      success: false,
      message: "Search query is required",
    });
  }

  try {
    // 1. Find matching courses by course name or course code
    const matchedCourses = await Course.find({
      $or: [
        { courseName: { $regex: query, $options: "i" } },
        { courseCode: { $regex: query, $options: "i" } },
      ],
    });

    const matchedCourseIds = matchedCourses.map((course) => course._id);

    // 2. Search materials by title, description, or related to matching courses
    const materials = await Material.find({
      $or: [
        { name: { $regex: query, $options: "i" } },
        { description: { $regex: query, $options: "i" } },
        { courseRef: { $in: matchedCourseIds } },
      ],
    }).populate("courseRef"); // Optional: to show course info in result

    if (!materials.length) {
      return res.status(404).send({
        success: false,
        message: "No materials found matching your search",
      });
    }

    res.status(200).send({
      success: true,
      message: "materials successfully fetched!",
      materials,
    });
  } catch (error) {
    res.status(500).send({ success: false, message: error.message });
  }
};

export const batchUploadMaterial = async (req, res) => {
  try {
    const userRole = req.user?.role;
    const files = req.files;
    const metadata = JSON.parse(req.body.materials);

  
    if (userRole !== "admin" && userRole !== "super_admin") {
      return res.status(403).send({
        success: false,
        message:
          "Unauthorized: Only admins or super_admin can upload materials",
      });
    }

    if (!files || !files.length) {
      return res.status(400).send({
        success: false,
        message: "No files uploaded.",
      });
    }

    if (!metadata || !metadata.length) {
      return res
        .status(400)
        .json({ success: false, message: "No material metadata provided" });
    }
    const { courseCode } = req.params;
    const course = await Course.findOne({ courseCode });
    if (!course) {
      return res.status(404).json({
        success: false,
        message: `Course with code '${courseCode}' not found at index ${i}`,
      });
    }

    const uploadedMaterials = [];
    const failedUploads = [];

    for (let i = 0; i < metadata.length; i++) {
      try {
        const {
          materialName,
          materialDescription,
          type,
          youtubeUrl,
        } = metadata[i];
        const file = files?.[i];
    
        if (!materialName || !materialDescription || !type || (type === 'videos' && !youtubeUrl)) {
          failedUploads.push({
            index: i,
            message: "Missing required fields",
          });
          continue;
        }
    
        if (!validTypes.includes(type)) {
          failedUploads.push({
            index: i,
            message: `Invalid material type: ${type}`,
          });
          continue;
        }
    
        const allowedTypes = fileTypeFormat[type];
        if (!allowedTypes) {
          failedUploads.push({
            index: i,
            message: `No fileType mapping for type: ${type}`,
          });
          continue;
        }
    
        const mimeType = file?.mimetype;
        let fileType;
        let fileUrl;
    
        if (type === "videos") {
          if (!youtubeUrl.includes("youtube.com/embed")) {
            failedUploads.push({
              index: i,
              message: `Invalid YouTube embed URL`,
            });
            continue;
          }
          fileType = "video";
          fileUrl = youtubeUrl;
        } else {
          if (!file) {
            failedUploads.push({
              index: i,
              message: `Missing file for non-video material`,
            });
            continue;
          }
    
          if (type === "slides/Notes") {
            if (mimeType.includes("presentation") || mimeType.includes("powerpoint")) {
              fileType = "ppt";
            } else if (mimeType.includes("msword") || mimeType.includes("wordprocessing")) {
              fileType = "doc";
            } else {
              failedUploads.push({
                index: i,
                message: `Invalid format for slides/Notes. Must be PPT or DOC`,
              });
              continue;
            }
          } else {
            fileType = fileTypeFormat[type][0];
          }
    
          fileUrl = await uploadToCloudinary(file.buffer, mimeType);
        }
    
        const materialData = {
          name: materialName,
          description: materialDescription,
          type,
          courseRef: course._id,
          uploadedBy: req.user._id,
          [`${fileType}Url`]: fileUrl,
        };
    
        const newMaterial = new Material(materialData);
        await newMaterial.save();
    
        const responseMaterial = { ...newMaterial._doc };
        ["videoUrl", "pdfUrl", "pptUrl", "docUrl"].forEach((key) => {
          if (!responseMaterial[key]) delete responseMaterial[key];
        });
    
        uploadedMaterials.push(responseMaterial);
      } catch (err) {
        failedUploads.push({
          index: i,
          message: err.message,
        });
        continue;
      }
    }

    if (uploadedMaterials.length > 0 && failedUploads.length > 0) {
      return res.status(207).json({
        success: true,
        message: "Batch upload completed with partial success",
        uploadedMaterials,
        failedUploads,
      });
    }
    
    if (uploadedMaterials.length > 0 && failedUploads.length === 0) {
      return res.status(201).send({
        success: true,
        message: "All materials uploaded successfully",
        uploadedMaterials,
      });
    }
  } catch (error) {
    return res.status(500).send({
      success: false,
      message: error.message,
    });
  }
};

// utils/uploadToCloudinary.js
import cloudinary from "../config/cloudinary.js"

const uploadToCloudinary = (fileBuffer, mimetype) => {
  return new Promise((resolve, reject) => {
    const isVideo = mimetype.startsWith("video");

    console.log("Is Buffer:", Buffer.isBuffer(fileBuffer)); // should be true
    console.log("Cloudinary upload mimetype:", mimetype);
    console.log("Resource Type:", isVideo ? "video" : "auto");

    const stream = cloudinary.uploader.upload_stream(
      {
        resource_type: isVideo ? "video" : "auto",
        folder: "course_materials",
      },
      (error, result) => {
        if (error) {
          reject(new Error("Cloudinary Upload Failed: " + error.message));
        } else {
          resolve(result.secure_url); // ✅ resolve with the uploaded file URL
        }
      }
    );

    stream.end(fileBuffer);
  });
};


export default uploadToCloudinary;

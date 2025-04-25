import { v2 as cloudinary } from "cloudinary";
import dotenv from "dotenv";
import multer from "multer";
dotenv.config();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// export const uploadToCloudinary = (fileBuffer, mimetype) => {
//   return new Promise((resolve, reject) => {
//     const base64 = `data:${mimetype};base64,${fileBuffer.toString("base64")}`;
//     cloudinary.uploader.upload(base64, { folder: "user_avatars" }, (error, result) => {
//       if (error) return reject(error);
//       resolve(result);
//     });
//   });
// }

export default cloudinary

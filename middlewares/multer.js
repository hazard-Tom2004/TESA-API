import multer from "multer";

// configure Multer storage (store in memory)
const storage = multer.memoryStorage();


const fileFilter = (req, file, callback) => {
  // Allow only images
  if (file.mimetype.startsWith("image/")) {
    callback(null, true);
  } else {
    callback(new Error("Only image files are allowed!"), false);
  }
};

const upload = multer({ storage, fileFilter });

export default upload;

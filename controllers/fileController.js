import Material from "../models/materialModel.js"
import axios from "axios";

// Retrieve a file by ID
export const getFileById = async (req, res) => {
  try {
    const material = await Material.findById(req.params.id);
    if (!material) return res.status(404).send({ message: "File not found" });

    let fileUrl = material.videoUrl || material.pdfUrl || material.docUrl || material.pptUrl;

    if (!fileUrl) return res.status(400).send({ message: "File URL not available" });

    // Proxy stream to user with correct content-type
    const response = await axios.get(fileUrl, { responseType: "stream" });

    res.setHeader("Content-Type", response.headers["content-type"]);
    return response.data.pipe(res);
  } catch (err) {
    res.status(500).send({ message: err.message });
  }
};

// Get file type
export const getFileType = async (req, res) => {
  try {
    const material = await Material.findById(req.params.id);
    if (!material) return res.status(404).send({ message: "File not found" });

    let type = material.type;

    return res.status(200).send({ success: true, message: "Successfully fetched file type", type });
  } catch (err) {
    res.status(500).send({ success: false, message: err.message });
  }
};


// Stream a video
export const streamVideo = async (req, res) => {
  try {
    const materialId = req.params.id;
    const material = await Material.findById(materialId);

    if (!material || !material.videoUrl) {
      return res.status(404).json({ message: "Video not found" });
    }

    const videoUrl = material.videoUrl;
    const range = req.headers.range;

    if (!range) {
      return res.status(416).send("Range header required");
    }

    const cloudinaryResponse = await axios.get(videoUrl, {
      headers: {
        Range: range,
      },
      responseType: "stream",
    });

    const headers = {
      "Content-Range": cloudinaryResponse.headers["content-range"],
      "Accept-Ranges": "bytes",
      "Content-Length": cloudinaryResponse.headers["content-length"],
      "Content-Type": cloudinaryResponse.headers["content-type"],
    };

    res.writeHead(206, headers);
    cloudinaryResponse.data.pipe(res);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: "Error streaming video", error: err.message });
  }
};


// Generate document preview (for PDFs, DOCs, etc.)
export const previewDocument = async (req, res) => {
  try {
    const material = await Material.findById(req.params.id);
    if (!material) return res.status(404).json({ message: "Document not found" });

    const docUrl = material.pdfUrl || material.docUrl || material.pptUrl;
    if (!docUrl) return res.status(400).json({ message: "No document available" });

    // Redirect to cloudinary preview
    return res.redirect(docUrl);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};


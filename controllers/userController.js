import User from "../models/userModel.js";
import cloudinary from "../config/cloudinary.js";
import { hashFn } from "../utils/utils.js";

//Get user by ID
export const getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user)
      return res
        .status(404)
        .send({ success: false, message: "User not found" });
    res.status(200).send({ success: true, message: "This is the user!", user });
  } catch (error) {
    res.status(400).send({ success: false, message: error.message });
  }
};

//get the user by email
export const getUserByEmail = async (req, res) => {
  const { email } = req.params;

  try {
    const user = await User.findOne({ email });

    if (!user) {
      return res
        .status(404)
        .send({ success: false, message: "User not found" });
    }

    res.status(200).send({
      success: true, message: "This the user", user
    });
  } catch (error) {
    console.error("Error fetching user by email:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const uploadAvatar = async (req, res) => {
  try {
    console.log("Request File:", req.file); // Debugging step

    if (!req.file) {
      return res
        .status(400)
        .send({ success: false, message: "avatar is required!" });
    }

    let imageUrl = "";
    let result = "";
    if (req.file) {
      const fileBase64 = `data:${
        req.file.mimetype
      };base64,${req.file.buffer.toString("base64")}`;
      // console.log("🔄 Converting to Base64...", fileBase64
      // );

      // console.log("🚀 Uploading to Cloudinary...");
      try {
        result = await cloudinary.uploader.upload(fileBase64, {
          folder: "user_avatars",
        });
        imageUrl = result.secure_url;
        console.log("This is the base64 file", fileBase64);
      } catch (error) {
        res.status(500).send({
          success: false,
          message: "Error with uploads",
          error: error.message,
        });
        console.log("Error with uploads!", error.message);
      }
    }

    console.log("✅ Cloudinary Response:", result);

    const updated = await User.findByIdAndUpdate(
      req.params.id,
      { avatar: imageUrl },
      { new: true }
    );
    if (!updated) return res.status(404).send({ message: "User not found" });

    res.status(200).send({
      success: true,
      message: "Avatar Successfully Uploaded!",
      updated,
    });
  } catch (error) {
    res.status(500).send({
      success: false,
      message: "Error uploading avatar",
      error: error.message,
    });
  }
};
//update User
export const updateUser = async (req, res) => {
  const {
    fullName,
    department,
    level,
    oldPassword,
    newPassword,
    confirmNewPassword,
  } = req.body;

  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res
        .status(404)
        .send({ success: false, message: "User not found" });
    }

    // === Handle Avatar Upload ===
    if (req.file) {
      // Delete old avatar if exists
      if (user.avatar) {
        const imageId = user.avatar.split("/").pop().split(".")[0];
        await cloudinary.uploader.destroy(`user_avatars/${imageId}`);
      }

      // Upload new avatar
      const fileBase64 = `data:${
        req.file.mimetype
      };base64,${req.file.buffer.toString("base64")}`;
      const result = await cloudinary.uploader.upload(fileBase64, {
        folder: "user_avatars",
        use_filename: true,
        unique_filename: false,
        resource_type: "image",
      });

      user.avatar = result.secure_url;
    }

    if (fullName) user.fullName = fullName;

    if (user.role === "admin" || user.role === "super_admin") {
      if (department) user.department = department;
      if (level) user.level = level;
    } else {
      if (department || level) {
        user.pendingUpdates = {
          ...(user.pendingUpdates || {}),
          ...(department && { department }),
          ...(level && { level }),
        };
      }
    }

    if (oldPassword || newPassword || confirmNewPassword) {
      if (!oldPassword || !newPassword || !confirmNewPassword) {
        return res.status(400).send({
          success: false,
          message: "All password fields are required",
        });
      }

      const isMatch = await bcrypt.compare(oldPassword, user.password);
      if (!isMatch) {
        return res
          .status(400)
          .send({ success: false, message: "Old password is incorrect" });
      }

      if (newPassword !== confirmNewPassword) {
        return res
          .status(400)
          .send({ success: false, message: "New passwords do not match" });
      }

      user.password = await hashFn(newPassword);
    }

    await user.save();

    res.status(200).send({
      success: true,
      message: "User updated successfully",
      user,
    });
  } catch (error) {
    res.status(500).send({ success: false, message: error.message });
  }
};

//delete user
export const deleteUser = async (req, res) => {
  try {
    if (user.role === "admin" || user.role === "super_admin") {
      const deleted = await User.findByIdAndDelete(req.params.id);
      if (!deleted)
        return res
          .status(404)
          .send({ success: false, message: "User not found" });
      res
        .status(200)
        .send({ success: true, message: "User deleted successfully" });
    } else {
      return res.status(403).send({
        success: false,
        message: "Unauthorized: Only admins or super_admin can delete users",
      });
    }
  } catch (error) {
    res.status(400).send({ success: false, message: error.message });
  }
};

//upload photo

//assign department
// export const assignDepartment = async (req, res) => {
//   const { department } = req.body;
//   try {
//     const user = await User.findById(req.params.id);
//     if (!user)
//       return res
//         .status(404)
//         .send({ success: false, message: "User not found" });
//     if (user.role === "admin" || user.role === "super_admin") {
//       if (department) user.department = department;
//       res
//         .status(200)
//         .send({ success: true, message: "Department assigned!", user });
//     } else {
//       if (department || level) {
//         user.pendingUpdates = {
//           ...(user.pendingUpdates || {}),
//           ...(department && { department }),
//         };
//         res.status(200).send({
//           success: true,
//           message: "Department will be assigned after approval!",
//           user,
//         });
//       }
//     }
//   } catch (error) {
//     res.status(500).send({ success: false, message: error.message });
//   }
// };

// //assign academic level to user
// export const assignLevel = async (req, res) => {
//   const { level } = req.body;
//   try {
//     const user = await User.findById(req.params.id);
//     if (!user)
//       return res
//         .status(404)
//         .send({ success: false, message: "User not found" });
//     if (user.role === "admin" || user.role === "super_admin") {
//       if (level) user.level = level;
//       res.status(200).send({ success: true, message: "Level assigned!", user });
//     } else {
//       if (level) {
//         user.pendingUpdates = {
//           ...(user.pendingUpdates || {}),
//           ...(level && { level }),
//         };
//         res.status(200).send({
//           success: true,
//           message: "Level will be assigned after approval!",
//           user,
//         });
//       }
//     }
//   } catch (error) {
//     res.status(500).send({ success: false, message: error.message });
//   }
// };

export const assignAdmin = async (req, res) => {
  try {
    const { userId } = req.body;
    const user = await User.findById(userId);
    if (!user)
      return res
        .status(404)
        .send({ success: false, message: "User not found" });

    if (user.role === "admin") {
      return res
        .status(400)
        .send({ success: false, message: "User is already an admin" });
    }

    user.role = "admin";
    await user.save();

    res
      .status(200)
      .send({ success: true, message: "User promoted to admin", User });
  } catch (error) {
    res.status(500).send({ success: false, message: "server error!", error });
  }
};

export const revokeAdmin = async (req, res) => {
  const { userId } = req.body;

  try {
    const user = await User.findById(userId);

    if (!user)
      return res
        .status(404)
        .send({ success: false, message: "User not found" });

    if (user.role !== "admin") {
      return res
        .status(400)
        .send({ success: false, message: "User is not an admin" });
    }

    user.role = "student";
    await user.save();

    return res
      .status(200)
      .send({ success: true, message: "Admin privileges revoked", user });
  } catch (err) {
    return res
      .status(500)
      .send({ success: false, message: "Server error", error: err.message });
  }
};

// New: Admin approval for department/level
// export const approvePendingUpdates = async (req, res) => {
//   const { approveDepartment, approveLevel } = req.body;

//   try {
//     const user = await User.findById(req.params.id);
//     if (!user)
//       return res
//         .status(404)
//         .send({ success: false, message: "User not found" });

//     if ((req.role = admin || super_admin)) {
//       if (user.pendingUpdates) {
//         if (approveDepartment && user.pendingUpdates.department) {
//           user.department = user.pendingUpdates.department;
//         }
//         if (approveLevel && user.pendingUpdates.level) {
//           user.level = user.pendingUpdates.level;
//         }

//         user.pendingUpdates = {};
//         await user.save();

//         return res.send({ success: true, message: "Updates approved", user });
//       }
//     }

//     res
//       .status(400)
//       .send({ success: false, message: "No pending updates found" });
//   } catch (error) {
//     res.status(500).send({ success: false, message: error.message });
//   }
// };

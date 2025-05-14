import currentSemester from '../models/semesterModel.js';

export const setCurrentSemester = async (req, res) => {
  try {
    const userRole = req.user?.role;
    const { semester } = req.body;

    // Role-based validation
    if (userRole !== "admin" && userRole !== "super_admin") {
      return res.status(403).send({
        success: false,
        message: "Access denied. Only admin or super_admin can set semester.",
      });
    }

    // Check if semester value is provided
    if (!semester) {
      return res.status(400).send({
        success: false,
        message: "Semester is required.",
      });
    }

    // Clear existing current semester
    await currentSemester.updateMany({ isCurrent: true }, { isCurrent: false });

    // Create new current semester (session only if super_admin)
    const newSemester = new currentSemester({
      semester,
      isCurrent: true,
      setBy: req.user._id,
    });

    await newSemester.save();

    return res.status(200).send({
      success: true,
      message: "Current semester set successfully",
      data: newSemester,
    });

  } catch (error) {
    return res.status(500).send({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};
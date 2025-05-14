// controllers/sessionController.js
import CurrentSession from "../models/sessionModel.js";

export const setCurrentSession = async (req, res) => {
  try {
    const userRole = req.user?.role;
    const { session } = req.body;

    // Only super_admin can set session
    if (userRole !== "super_admin") {
      return res.status(403).send({
        success: false,
        message: "Only super_admin can set academic session.",
      });
    }

    if (!session) {
      return res.status(400).send({
        success: false,
        message: "Session is required.",
      });
    }

    // Clear previous current session
    await CurrentSession.updateMany({ isCurrent: true }, { isCurrent: false });

    // Save new session
    const newSession = new CurrentSession({
      session,
      isCurrent: true,
      setBy: req.user._id,
    });

    await newSession.save();

    return res.status(200).send({
      success: true,
      message: "Academic session set successfully.",
      data: newSession,
    });

  } catch (error) {
    return res.status(500).send({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

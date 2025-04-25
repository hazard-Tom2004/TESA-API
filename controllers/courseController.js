import Course from "../models/courseModel.js";

export const createCourse = async (req, res) => {
  try {
    const userRole = req.user?.role;

    if (userRole === "admin" || userRole === "super_admin") {
      const {
        CourseName,
        CourseCode,
        department,
        level,
        units,
        semester,
        shared = false,
      } = req.body;

      if (
        !CourseName ||
        !CourseCode ||
        !department ||
        !level ||
        units === undefined ||
        !semester
      ) {
        return res.status(400).send({
          success: false,
          message: "All required fields must be provided",
        });
      }

      const newCourse = new Course({
        courseName: CourseName,
        courseCode: CourseCode,
        department,
        level,
        units,
        semester,
        shared,
        createdBy: req.user._id,
      });

      await newCourse.save();

      return res.status(201).send({
        success: true,
        message: "Course created Successfully!",
        course: newCourse,
      });
    } else {
      return res.status(403).send({
        success: false,
        message: "Unauthorized: Only admins or super_admin can create courses",
      });
    }
  } catch (error) {
    res.status(500).send({ success: false, message: error.message });
  }
};

// Get all courses or filtered by department, level, course code, course name
export const getCourses = async (req, res) => {
  try {
    const getEnumValues = (schema, field) => {
      const path = schema.path(field);
      if (!path) return [];

      // If it's an array, get the enum from its 'caster'
      if (path.instance === "Array" && path.caster?.enumValues) {
        return path.caster.enumValues;
      }

      // If it's a single field
      return path.enumValues || [];
    };
    // Dynamically get enum values
    const departmentEnum = getEnumValues(Course.schema, "department");
    const levelEnum = getEnumValues(Course.schema, "level");
    console.log(departmentEnum, levelEnum);
    const allowedQueryParams = [
      "department",
      "level",
      "courseCode",
      "courseName",
    ];
    const filters = {};
    const queryKeys = Object.keys(req.query);

    // 3. Validate query keys (make sure only allowed ones are passed)
    const invalidParams = queryKeys.filter(
      (key) => !allowedQueryParams.includes(key)
    );
    if (invalidParams.length > 0) {
      return res.status(400).send({
        success: false,
        message: `Invalid query parameter(s): ${invalidParams.join(", ")}`,
      });
    }

    // 4. Handle each param with enum validation if needed
    if (req.query.department) {
      if (!departmentEnum.includes(req.query.department)) {
        return res.status(400).send({
          success: false,
          message: `Invalid department. Allowed: ${departmentEnum.join(", ")}`,
        });
      }
      filters.department = req.query.department;
    }

    if (req.query.level) {
      if (!levelEnum.includes(req.query.level)) {
        return res.status(400).send({
          success: false,
          message: `Invalid level. Allowed: ${levelEnum.join(", ")}`,
        });
      }
      filters.level = req.query.level;
    }

    if (req.query.courseCode) {
      filters.courseCode = req.query.courseCode;
    }

    if (req.query.courseName) {
      filters.courseName = req.query.courseName;
    }

    // 5. Perform the actual query
    const courses = await Course.find(filters);

    return res.status(200).send({
      success: true,
      message: "Courses fetched successfully",
      courses,
    });
  } catch (error) {
    res.status(500).send({ success: false, message: error.message });
  }
};

// Get single course by code
export const getCourseDetails = async (req, res) => {
  try {
    const course = await Course.findOne({ courseCode: req.params.courseCode });
    if (!course)
      return res
        .status(404)
        .send({ success: false, message: "Course not found" });
    res.status(200).send({
      success: true,
      message: "Course details successfully fetched!",
      course,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Update course details
export const updateCourse = async (req, res) => {
  try {
    const userRole = req.user?.role;

    if (userRole === "admin" || userRole === "super_admin") {
      const { courseName, department, level, units, semester } =
        req.body;

      const updateFields = {};

      if (courseName) updateFields.courseName = courseName;
      if (department) updateFields.department = department;
      if (level) updateFields.level = level;
      if (units) updateFields.units = units;
      if (semester) updateFields.semester = semester;

      const updatedCourse = await Course.findOneAndUpdate(
        { _id: req.params.id },
        updateFields,
        { new: true }
      );
      if (!updatedCourse)
        return res
          .status(404)
          .send({ success: false, message: "Course not found" });
      res.status(200).send({
        success: true,
        message: "Course SUccessfully Updated!",
        updateCourse,
      });
    } else {
      return res.status(403).send({
        success: false,
        message: "Unauthorized: Only admins or super_admin can create courses",
      });
    }
  } catch (error) {
    res.status(400).send({ success: false, message: error.message });
  }
};

// Delete a course
export const deleteCourse = async (req, res) => {
  try {
    const userRole = req.user?.role;

    if (userRole === "admin" || userRole === "super_admin") {
      const course = await Course.findOneAndDelete({ code: req.params.code });
      if (!course)
        return res
          .status(404)
          .send({ success: false, message: "Course not found" });
      res.status(200).send({ success: true, message: "Course deleted" });
    } else {
      return res.status(403).send({
        success: false,
        message: "Unauthorized: Only admins or super_admin can update course",
      });
    }
  } catch (error) {
    res.status(500).send({ success: false, message: error.message });
  }
};

// Sync a course across multiple departments
export const syncCourse = async (req, res) => {
    try {
        const userRole = req.user?.role;
        if (userRole === "admin" || userRole === "super_admin") {
      const { courseCode } = req.params;
      const { departmentsToAdd } = req.body; // Example: ['Engineering', 'Computer Science']
  
      if (!Array.isArray(departmentsToAdd) || departmentsToAdd.length === 0) {
        return res.status(400).send({
          success: false,
          message: "Provide departments to sync the course with.",
        });
      }
  
      const course = await Course.findOne(courseCode);
      if (!course) {
        return res.status(404).send({
          success: false,
          message: "Course not found.",
        });
      }
  
      // Combine and remove duplicates
      const updatedDepartments = Array.from(
        new Set([...course.department, ...departmentsToAdd])
      );
  
      course.department = updatedDepartments;
      course.shared = true;
  
      await course.save();
  
      res.status(200).send({
        success: true,
        message: "Course synced successfully to new departments.",
        course,
      });
    }  else {
        return res.status(403).send({
          success: false,
          message: "Unauthorized: Only admins or super_admin can sync courses",
        });
      }
    } catch (error) {
        console.log(error);
      res.status(500).send({ success: false, message: error.message });
    }
  };
  
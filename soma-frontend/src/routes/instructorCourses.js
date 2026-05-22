const router = require("express").Router();
const {
  getMyCourses, createCourse, updateCourse, deleteCourse,
  getLectures, addLecture, updateLecture, deleteLecture, togglePublish,
  getMyProfile, updateMyProfile
} = require("../controllers/instructorCourseController");
const { authenticate } = require("../middleware/auth");

router.use(authenticate);

router.get   ("/profile",                           getMyProfile);
router.put   ("/profile",                           updateMyProfile);
router.get   ("/",                                  getMyCourses);
router.post  ("/",                                  createCourse);
router.put   ("/:courseId",                         updateCourse);
router.delete("/:courseId",                         deleteCourse);
router.patch ("/:courseId/publish",                 togglePublish);
router.get   ("/:courseId/lectures",                getLectures);
router.post  ("/:courseId/lectures",                addLecture);
router.put   ("/:courseId/lectures/:lectureId",     updateLecture);
router.delete("/:courseId/lectures/:lectureId",     deleteLecture);

module.exports = router;

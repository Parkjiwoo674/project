const router = require("express").Router();
const { getInstructors, getInstructorById } = require("../controllers/instructorController");

router.get("/",    getInstructors);
router.get("/:id", getInstructorById);

module.exports = router;

const router = require("express").Router({ mergeParams: true });
const { getQnas, createQuestion, createAnswer } = require("../controllers/qnaController");
const { authenticate } = require("../middleware/auth");

router.get ("/"                    , getQnas);
router.post("/"                    , authenticate, createQuestion);
router.post("/:questionId/answers" , authenticate, createAnswer);

module.exports = router;

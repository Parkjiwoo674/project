const db = require("../config/db");

// ── Q&A 목록 조회 ────────────────────────────────────────────
const getQnas = async (req, res) => {
  const courseId = Number(req.params.courseId);

  try {
    // JOIN으로 한 번에 조회 (N+1 제거)
    const [rows] = await db.query(
      `SELECT
          q.id AS q_id, q.content AS q_content, q.created_at AS q_created_at,
          q.user_id AS q_user_id,
          uq.nickname AS q_author_nickname,
          a.id AS a_id, a.content AS a_content, a.created_at AS a_created_at,
          ua.nickname AS a_author_nickname, ua.role AS a_role
       FROM qna_questions q
       JOIN users uq ON uq.id = q.user_id
  LEFT JOIN qna_answers a ON a.question_id = q.id
  LEFT JOIN users ua ON ua.id = a.user_id
      WHERE q.course_id = ?
      ORDER BY q.created_at DESC, a.created_at ASC`,
      [courseId]
    );

    // 메모리에서 그룹화
    const questionMap = new Map();
    for (const row of rows) {
      if (!questionMap.has(row.q_id)) {
        questionMap.set(row.q_id, {
          id: row.q_id,
          content: row.q_content,
          created_at: row.q_created_at,
          user_id: row.q_user_id,
          author_nickname: row.q_author_nickname,
          answer_count: 0,
          answers: [],
        });
      }
      if (row.a_id) {
        const q = questionMap.get(row.q_id);
        q.answers.push({
          id: row.a_id,
          content: row.a_content,
          created_at: row.a_created_at,
          author_nickname: row.a_author_nickname,
          role: row.a_role,
        });
        q.answer_count = q.answers.length;
      }
    }

    return res.json({ success: true, data: Array.from(questionMap.values()) });
  } catch (err) {
    console.error("[getQnas]", err);
    return res.status(500).json({ success: false, message: "서버 오류가 발생했습니다." });
  }
};

// ── 질문 등록 ────────────────────────────────────────────────
const createQuestion = async (req, res) => {
  const userId   = req.user.id;
  const courseId = Number(req.params.courseId);
  const { content } = req.body;

  if (!content?.trim()) {
    return res.status(400).json({ success: false, message: "질문 내용을 입력해주세요." });
  }

  try {
    const [result] = await db.query(
      "INSERT INTO qna_questions (user_id, course_id, content) VALUES (?, ?, ?)",
      [userId, courseId, content.trim()]
    );

    const [[question]] = await db.query(
      `SELECT q.id, q.content, q.created_at, u.nickname AS author_nickname
         FROM qna_questions q JOIN users u ON u.id = q.user_id
        WHERE q.id = ?`,
      [result.insertId]
    );

    return res.status(201).json({ success: true, data: { ...question, answers: [] } });
  } catch (err) {
    console.error("[createQuestion]", err);
    return res.status(500).json({ success: false, message: "서버 오류가 발생했습니다." });
  }
};

// ── 답변 등록 ────────────────────────────────────────────────
const createAnswer = async (req, res) => {
  const userId     = req.user.id;
  const questionId = Number(req.params.questionId);
  const { content } = req.body;

  if (!content?.trim()) {
    return res.status(400).json({ success: false, message: "답변 내용을 입력해주세요." });
  }

  try {
    const [result] = await db.query(
      "INSERT INTO qna_answers (user_id, question_id, content) VALUES (?, ?, ?)",
      [userId, questionId, content.trim()]
    );

    const [[answer]] = await db.query(
      `SELECT a.id, a.content, a.created_at, u.nickname AS author_nickname, u.role
         FROM qna_answers a JOIN users u ON u.id = a.user_id
        WHERE a.id = ?`,
      [result.insertId]
    );

    return res.status(201).json({ success: true, data: answer });
  } catch (err) {
    console.error("[createAnswer]", err);
    return res.status(500).json({ success: false, message: "서버 오류가 발생했습니다." });
  }
};

module.exports = { getQnas, createQuestion, createAnswer };

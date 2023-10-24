const express = require("express");
const timerRouter = require("./timers.js");
const {
  findUserByUserName,
  createUser,
  createSession,
  deleteSession,
  findUserByUsernameAndPassword,
} = require("./DB/db.js");
const { auth } = require("./helpers.js");

const app = express();

app.use(express.json());
app.use("/api/timers", timerRouter);

app.post("/login", async (req, res) => {
  const { username, password } = req.query;

  const user = await findUserByUsernameAndPassword(username, password);

  if (user.rowCount === 0) {
    return res.json({
      error: "Wrong username or password!",
    });
  }

  const sessionId = await createSession(user.rows[0].id);

  res.json({ sessionId });
});

app.post("/signup", async (req, res) => {
  const { username, password } = req.query;
  const user = await findUserByUserName(username);

  if (user) {
    return res.json({
      error: "There is already a user with this nickname",
    });
  } else if (password === "") {
    return res.json({
      error: "You must enter password",
    });
  } else {
    const id = await createUser(username, password);
    const sessionId = await createSession(id);

    res.json({ sessionId });
  }
});

app.get("/logout", auth(), async (req, res) => {
  if (!req.user) {
    return res.json({ message: "Nobody was authorized" });
  }

  await deleteSession(req.query.sessionId);

  res.json({ message: "Logged out successfully!" });
});

const port = process.env.PORT || 3000;

app.listen(port, () => {
  console.log(`  Listening on http://localhost:${port}`);
});

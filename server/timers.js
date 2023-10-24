const express = require("express");
const { auth } = require("./helpers.js");
const { findTimersByUser, createTimer, stopTimer, findTimerById } = require("./DB/db.js");

const timerRouter = express.Router();

timerRouter.get("/", auth(), async (req, res) => {
  const isActive = req.query.isActive;
  const user = req.user;

  if (!user) {
    return res.json({ message: "You must log in" });
  }

  const userTimers = await findTimersByUser(user.id);

  const timerForSend = [];

  for (const timer of userTimers) {
    if (`${timer.isActive}` === isActive) {
      if (timer.isActive) {
        timer.start = Number(timer.start);
        timer.progress = Date.now() - Number(timer.start);
      } else {
        timer.start = Number(timer.start);
        timer.end = Number(timer.end);
        timer.duration = timer.end - timer.start;
      }

      timerForSend.push(timer);
    }
  }

  if (timerForSend.length === 0 && isActive === "true") {
    res.json({ message: "You haven't got active timers" });
  } else if (timerForSend.length === 0 && isActive === "false") {
    res.json({ message: "You haven't got old timers" });
  } else {
    res.json(timerForSend);
  }
});

timerRouter.post("/", auth(), async (req, res) => {
  const description = req.query.description;
  const user = req.user;

  if (!user) {
    return res.json({ message: "You must log in" });
  }

  const newTimerId = await createTimer(user.id, description);

  res.json(newTimerId[0].id);
});

timerRouter.post("/:id/stop", auth(), async (req, res) => {
  const idTimer = req.params.id;
  const user = req.user;

  if (!user) {
    return res.json({ message: "You must log in" });
  }

  const oldTimer = await stopTimer(idTimer, user.id);

  res.json(oldTimer);
});

timerRouter.get("/:id", auth(), async (req, res) => {
  const idTimer = req.params.id;
  const user = req.user;

  if (!user) {
    return res.json("You must log in");
  }

  const timer = await findTimerById(idTimer, user.id);

  if (timer.length === 0) {
    res.json({ message: `You haven't got timer with ID: ${idTimer}` });
  } else {
    res.json(timer);
  }
});

module.exports = timerRouter;

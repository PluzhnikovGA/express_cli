const { findUserBySessionId } = require("./DB/db.js");

const auth = () => async (req, res, next) => {
  if (!req.query.sessionId) {
    return next();
  }

  const user = await findUserBySessionId(req.query.sessionId);

  req.user = user;
  req.sessionId = req.sessionId;
  next();
};

module.exports = { auth };

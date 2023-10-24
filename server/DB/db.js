require("dotenv").config();

const { nanoid } = require("nanoid");

const knex = require("knex")({
  client: "pg",
  connection: {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
  },
  pool: { min: 0, max: 1 },
});

const findUserByUserName = async (username) => await knex("users").select().where({ username }).first();

const findUserByUsernameAndPassword = async (username, password) => {
  return knex.raw(
    `SELECT id FROM users
      WHERE username = ? AND password = crypt(?, password)`,
    [username, password]
  );
};

const findUserBySessionId = async (sessionId) => {
  const session = await knex("sessions").select("userId").where({ sessionId }).first();

  if (!session) {
    return false;
  }

  return knex("users").select().where({ id: session.userId }).first();
};

const createUser = async (username, password) => {
  const res = await knex.raw(
    `INSERT INTO users (username, password)
      VALUES (?, crypt(?, gen_salt('md5')))
      RETURNING id`,
    [username, password]
  );

  return res.rows[0].id;
};

const createSession = async (userId) => {
  const sessionId = nanoid();

  await knex("sessions").insert({
    userId: userId,
    sessionId: sessionId,
  });

  return sessionId;
};

const deleteSession = async (sessionId) => {
  await knex("sessions").where({ sessionId: sessionId }).delete();
};

const findTimersByUser = async (userId) => {
  return knex("timers").where({ userId });
};

const createTimer = async (userId, description) => {
  const start = Date.now();

  return knex("timers")
    .insert({
      userId: userId,
      start: start,
      description: description,
    })
    .returning("id");
};

const stopTimer = async (id, userId) => {
  const end = Date.now();

  return await knex("timers").where({ id, userId, isActive: true }).update({
    end: end,
    isActive: false,
  });
};

const findTimerById = async (id, userId) => {
  const end = Date.now();

  return await knex("timers").where({ id, userId });
};

module.exports = {
  findUserByUserName,
  findUserByUsernameAndPassword,
  findUserBySessionId,
  createUser,
  createSession,
  deleteSession,
  findTimersByUser,
  createTimer,
  stopTimer,
  findTimerById,
};

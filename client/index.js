require("dotenv").config(0);
const os = require("os");
const path = require("path");
const inquirer = require("inquirer");
const DraftLog = require("draftlog");
const { writeFileSync, stat, readFileSync } = require("fs");
const { rimraf } = require("rimraf");
const Table = require("cli-table");

const command = process.argv[2];
const anotherInfo = process.argv[3];
const SERVER = process.env.SERVER;
DraftLog(console);

const filePath = () => {
  const homeDir = os.homedir();
  const isWindows = os.type().match(/windows/i);
  return path.join(homeDir, `${isWindows ? "_" : "."}sb-timers-session`);
};

const createTable = (timers) => {
  const table = new Table({
    head: ["ID", "Task", "Time"],
    colWidths: [40, 40, 40],
  });

  for (const timer of timers) {
    let time;
    if (timer.isActive) {
      time = Date.now() - timer.start;
    } else {
      time = timer.end - timer.start;
    }
    const seconds =
      Math.round(time / 1000) % 60 > 9 ? Math.round(time / 1000) % 60 : `0${Math.round(time / 1000) % 60}`;
    const minutes =
      Math.round(time / 1000 / 60) > 9 ? Math.round(time / 1000 / 60) : `0${Math.round(time / 1000 / 60)}`;

    table.push([timer.id, timer.description, `${minutes}:${seconds}`]);
  }

  return table;
};

const loginSignup = async (param) => {
  const sessionFileName = filePath();
  // eslint-disable-next-line
  stat(sessionFileName, async (err, _stats) => {
    if (err) {
      let { username, password } = await inquirer.prompt(questionUP);
      const log = console.draft("Please, wait. Your request is being processed");

      username = username.trim();
      const response = await fetch(`${SERVER}/${param}?username=${username}&password=${password}`, {
        method: "POST",
      });

      const responseAnswer = await response.json();

      if (responseAnswer.sessionId) {
        writeFileSync(sessionFileName, `${responseAnswer.sessionId}`, "utf-8");

        if (param === "login") {
          log("Logged in successfully!");
        } else {
          log("Signed up successfully!");
        }
      } else {
        log(responseAnswer.error);
      }
    } else {
      console.log("You are already logged in");
    }
  });
};

const logout = async () => {
  const log = console.draft("Please, wait. Your request is being processed");
  const sessionFileName = filePath();
  // eslint-disable-next-line
  stat(sessionFileName, async (err, _stats) => {
    if (err) {
      log("You haven't got an active session");
    } else {
      const sessionId = readFileSync(sessionFileName, "utf-8");
      rimraf(sessionFileName);

      const response = await fetch(`${SERVER}/logout?sessionId=${sessionId}`);

      const responseAnswer = await response.json();

      log(responseAnswer.message);
    }
  });
};

const status = async (isActive) => {
  const log = console.draft("Please, wait. Your request is being processed");
  const sessionFileName = filePath();
  // eslint-disable-next-line
  stat(sessionFileName, async (err, _stats) => {
    if (err) {
      log("You haven't got an active session");
    } else {
      const sessionId = readFileSync(sessionFileName, "utf-8");

      const response = await fetch(`${SERVER}/api/timers?sessionId=${sessionId}&isActive=${isActive}`);

      const responseAnswer = await response.json();

      if (responseAnswer.message) {
        log(responseAnswer.message);
      } else {
        const table = createTable(responseAnswer);

        log(table.toString());
      }
    }
  });
};

const statusOneTimer = (timerId) => {
  const log = console.draft("Please, wait. Your request is being processed");
  const sessionFileName = filePath();
  // eslint-disable-next-line
  stat(sessionFileName, async (err, _stats) => {
    if (err) {
      log("You haven't got an active session");
    } else {
      const sessionId = readFileSync(sessionFileName, "utf-8");
      const response = await fetch(`${SERVER}/api/timers/${timerId}?sessionId=${sessionId}`);

      const responseAnswer = await response.json();

      if (responseAnswer.message) {
        log(responseAnswer.message);
      } else {
        const table = createTable(responseAnswer);

        log(table.toString());
      }
    }
  });
};

const start = async (description) => {
  const log = console.draft("Please, wait. Your request is being processed");
  const sessionFileName = filePath();
  // eslint-disable-next-line
  stat(sessionFileName, async (err, _stats) => {
    if (err) {
      log("You haven't got an active session");
    } else {
      const sessionId = readFileSync(sessionFileName, "utf-8");
      const response = await fetch(`${SERVER}/api/timers?sessionId=${sessionId}&description=${description}`, {
        method: "POST",
      });

      const responseAnswer = await response.json();

      log(`Started timer ${description}, ID: ${responseAnswer}.`);
    }
  });
};

const stop = async (timerId) => {
  const log = console.draft("Please, wait. Your request is being processed");
  const sessionFileName = filePath();
  // eslint-disable-next-line
  stat(sessionFileName, async (err, _stats) => {
    if (err) {
      log("You haven't got an active session");
    } else {
      const sessionId = readFileSync(sessionFileName, "utf-8");
      const response = await fetch(`${SERVER}/api/timers/${timerId}/stop?sessionId=${sessionId}`, {
        method: "POST",
      });

      const responseAnswer = await response.json();

      if (responseAnswer === 1) {
        log(`Timer ${timerId} stopped.`);
      } else {
        log(`You haven't got timer with id ${timerId} or this timer is old.`);
      }
    }
  });
};

const questionUP = [
  { type: "input", name: "username", message: "Username:" },
  { type: "password", name: "password", message: "Password", mask: "*" },
];

if (command === "login") {
  loginSignup("login");
} else if (command === "signup") {
  loginSignup("signup");
} else if (command === "status" && anotherInfo === undefined) {
  status(true);
} else if (command === "status" && Number(anotherInfo)) {
  statusOneTimer(Number(anotherInfo));
} else if (command === "status" && anotherInfo === "old") {
  status(false);
} else if (command === "start" && anotherInfo) {
  start(anotherInfo);
} else if (command === "stop" && Number(anotherInfo)) {
  stop(Number(anotherInfo));
} else if (command === "logout") {
  logout();
} else {
  console.log("Uncorrected command");
}

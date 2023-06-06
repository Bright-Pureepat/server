var express = require("express");
var cors = require("cors");
const multer = require("multer");
var app = express();
var bodyParser = require("body-parser");
var jsonParser = bodyParser.json();

const PORT = process.env.PORT || 5000;

const bcrypt = require("bcrypt");
const saltRounds = 10;
var jwt = require("jsonwebtoken");
const secret = "Login";

app.use(cors());
app.use(express.static("public"));
const mysql = require("mysql2");

const connection = mysql.createConnection({
  host: "grp6m5lz95d9exiz.cbetxkdyhwsb.us-east-1.rds.amazonaws.com",
  user: "df2qb0g2w04tcnkn",
  password: "bx5bh53j6jkto8y4",
  database: "j1lchzb4s6du3p01",
  port: 3306,
});

var storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "public/image");
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-image-${file.originalname}`);
  },
});

var upload = multer({
  storage: storage,
});

app.post("/upload", upload.single("image"), (req, res, next) => {
  const image = req.file.filename;
  connection.query(
    "INSERT INTO employees (pic) VALUE (?)",
    [image],
    (err, result) => {
      if (err) {
        return res.json({ messeage: "Error" });
      } else {
        res.json({ status: "ok" });
      }
    }
  );
});

app.put("/upload/:id", upload.single("image"), (req, res, next) => {
  const id = req.params.id;
  const image = req.file.filename;
  connection.query(
    "UPDATE employees SET pic = ? WHERE employeeid = ?",
    [image, id],
    (err, result) => {
      if (err) {
        return res.json({ messeage: err });
      } else {
        res.json({ status: "ok" });
      }
    }
  );
});

app.post("/register", jsonParser, function (req, res, next) {
  bcrypt.hash(req.body.password, saltRounds, function (err, hash) {
    connection.query(
      "INSERT INTO employees (username, password, identityNo, employeeName, gender, birthday, jobPosition, position, phoneNo, email, address, province, amphur, disdrict, zipCode) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
      [
        req.body.username,
        hash,
        req.body.identityNo,
        req.body.employeeName,
        req.body.gender,
        req.body.birthday,
        req.body.jobPosition,
        req.body.position,
        req.body.phoneNo,
        req.body.email,
        req.body.address,
        req.body.province,
        req.body.amphur,
        req.body.disdrict,
        req.body.zipCode,
      ],
      function (err, results, fields) {
        if (err) {
          res.json({ status: "error", messeage: err });
          return;
        }
        res.json({ status: "ok" });
      }
    );
  });
});

app.post("/login", jsonParser, function (req, res, next) {
  connection.execute(
    "SELECT * FROM employees WHERE username = ?",
    [req.body.username],
    function (err, employees, fields) {
      if (err) {
        res.json({ status: "error", messeage: err });
        return;
      }
      if (employees.length == 0) {
        res.json({ status: "error", messeage: "no user" });
        return;
      }
      bcrypt.compare(
        req.body.password,
        employees[0].password,
        function (err, isLogin) {
          if (isLogin) {
            let isActive = employees[0].active;
            let isAdmin = employees[0].isadmin;
            if (isActive === 1 && isAdmin === 1) {
              var token = jwt.sign(
                { username: employees[0].username },
                secret,
                {
                  expiresIn: "2h",
                }
              );
              res.json({ status: "Admin", messeage: "Admin Login", token });
            } else if (isActive === 1 && isAdmin !== 1) {
              var token = jwt.sign(
                { username: employees[0].username },
                secret,
                {
                  expiresIn: "2h",
                }
              );
              res.json({ status: "HR", messeage: "Hr Login", token });
            } else if (isActive !== 1) {
              res.json({ status: "Not Active", messeage: "Not Active", token });
            }
          } else {
            res.json({
              status: "username or password is incorrect",
              messeage: "Login Fail",
            });
          }
        }
      );
    }
  );
});

app.get("/users", jsonParser, function (req, res, next) {
  connection.execute(
    "SELECT * FROM employees order by employeeid",
    function (err, users, fields) {
      if (err) {
        console.log(err);
      }
      res.json(users);
    }
  );
});

app.get("/users/notadmin/active", jsonParser, function (req, res, next) {
  connection.execute(
    "SELECT employeeid FROM employees WHERE isadmin = false and active = true",
    function (err, users, fields) {
      if (err) {
        console.log(err);
      }
      res.json(users);
    }
  );
});

app.get("/users/:id", jsonParser, function (req, res, next) {
  const id = req.params.id;
  connection.execute(
    "SELECT * FROM employees WHERE employeeid = ?",
    [id],
    function (err, results, fields) {
      res.json(results);
    }
  );
});

app.put("/update/users/:id", jsonParser, function (req, res, next) {
  const id = req.params.id;
  connection.query(
    "UPDATE employees SET jobPosition = ?, position = ?, employeeName = ?, phoneNo = ?, email = ?, address = ?, disdrict = ?, amphur = ?, province = ?, zipCode = ?, active = ? WHERE employeeid = ?",
    [
      req.body.jobPosition,
      req.body.position,
      req.body.employeeName,
      req.body.phoneNo,
      req.body.email,
      req.body.address,
      req.body.disdrict,
      req.body.amphur,
      req.body.province,
      req.body.zipCode,
      req.body.active,
      id,
    ],
    (err, results) => {
      if (err) {
        console.log(err);
      } else {
        res.json({
          status: `User modified with ID: ${id}`,
          messeage: "Success",
        });
      }
    }
  );
});

app.get("/leave/admin", jsonParser, function (req, res, next) {
  connection.execute(
    "SELECT * FROM history WHERE l_subject IS NOT NULL and l_limit_m IS NOT NULL and l_limit_y IS NOT NULL ORDER BY date DESC;",
    function (err, datas, fields) {
      if (err) {
        console.log(err);
      }
      res.json(datas);
    }
  );
});

app.post("/add/leave/admin", jsonParser, function (req, res, next) {
  connection.execute(
    "SELECT * FROM leaves WHERE subjects = ? ",
    [req.body.subjects],
    function (err, results, fields) {
      if (err) {
        console.log(err);
      }
      if (results.length > 0) {
        res.json({ status: "error", messeage: "Leave already registered" });
      } else {
        connection.execute(
          "INSERT INTO leaves (subjects ,limit_m ,limit_y)VALUES (? ,? ,?)",
          [req.body.subjects, req.body.limit_m, req.body.limit_y],
          (err, results) => {
            if (err) {
              console.log(err);
            } else {
              res.json({
                status: "ok",
                messeage: "Success",
              });
            }
          }
        );
      }
    }
  );
});

app.get("/leave/admin/:id", jsonParser, function (req, res, next) {
  const id = req.params.id;
  connection.execute(
    "SELECT * FROM history WHERE historyId = ?",
    [id],
    function (err, results, fields) {
      res.json(results);
    }
  );
});

app.put("/update/leave/admin/:id", jsonParser, function (req, res, next) {
  const id = req.params.id;
  connection.query(
    "UPDATE history SET l_subject = ?, l_limit_m = ?, l_limit_y = ? WHERE historyId = ?",
    [req.body.l_subject, req.body.l_limit_m, req.body.l_limit_y, id],
    (err, results) => {
      if (err) {
        console.log(err);
      } else {
        res.json({
          status: `Leave modified with ID: ${id}`,
          messeage: "Success",
        });
      }
    }
  );
});

app.delete("/leave/delete/admin/:id", jsonParser, function (req, res, next) {
  const id = req.params.id;
  connection.execute(
    "DELETE FROM history WHERE historyId = ?",
    [id],
    function (err, results, fields) {
      if (err) {
        console.log(err);
      } else {
        res.json({
          status: `Leave Delete with ID: ${id}`,
          messeage: "Delete Success",
        });
      }
    }
  );
});

app.get("/events", jsonParser, function (req, res, next) {
  connection.execute(
    "SELECT * FROM calendar order by CalendarID",
    function (err, events, fields) {
      if (err) {
        console.log(err);
      }
      res.json(events);
    }
  );
});

app.get("/event/:id", jsonParser, function (req, res, next) {
  const id = req.params.id;
  connection.execute(
    "SELECT * FROM calendar WHERE calendarID = ?",
    [id],
    function (err, event, fields) {
      if (err) {
        console.log(err);
      }
      res.json(event);
    }
  );
});

app.delete("/event/delete/:id", jsonParser, function (req, res, next) {
  const id = req.params.id;
  connection.execute(
    "DELETE FROM calendar WHERE calendarID = ?",
    [id],
    function (err, results, fields) {
      if (err) {
        console.log(err);
      } else {
        res.json({
          status: `Event Delete with ID: ${id}`,
          messeage: "Delete Success",
        });
      }
    }
  );
});

app.put("/update/event/:id", jsonParser, function (req, res, next) {
  const id = req.params.id;
  connection.execute(
    "UPDATE calendar SET subject = ?, teamID = ?, s_time = ?, e_time = ?, detail = ?, latitude = ?, longitude = ? WHERE calendarID = ?",
    [
      req.body.subject,
      req.body.teamID,
      req.body.s_time,
      req.body.e_time,
      req.body.detail,
      req.body.latitude,
      req.body.longitude,
      id,
    ],
    function (err, results) {
      if (err) {
        console.log(err);
      }
      res.json({
        status: `Event modified with ID: ${id}`,
        messeage: "Success",
      });
    }
  );
});

app.post("/add/event", jsonParser, (req, res, next) => {
  connection.query(
    "INSERT INTO calendar (subject, teamID, s_time, e_time, detail, latitude, longitude, canEdit)VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
    [
      req.body.subject,
      req.body.teamID,
      req.body.s_time,
      req.body.e_time,
      req.body.detail,
      req.body.latitude,
      req.body.longitude,
      req.body.canEdit,
    ],
    (err, results) => {
      if (err) {
        console.log(err);
      } else {
        res.json({ status: "ok", messeage: "Success" });
      }
    }
  );
});

app.get("/teams", jsonParser, function (req, res, next) {
  connection.execute(
    "SELECT * FROM teams order by teamID",
    function (err, teams, fields) {
      if (err) {
        console.log(err);
      }
      res.json(teams);
    }
  );
});

app.get("/team/:id", jsonParser, function (req, res, next) {
  const id = req.params.id;
  connection.execute(
    "SELECT * FROM teams WHERE teamID = ?",
    [id],
    function (err, team, fields) {
      res.json(team);
    }
  );
});

app.post("/add/team", jsonParser, (req, res, next) => {
  connection.query(
    "SELECT * FROM teams WHERE teamname = ?",
    [req.body.teamname],
    (err, results) => {
      if (results.length > 0) {
        res.json({ status: "error", messeage: "Team Name is already used" });
      } else {
        connection.query(
          "INSERT INTO teams (teamname, leadername, member1, member2, member3, member4, member5)VALUES (?, ?, ?, ?, ?, ?, ?)",
          [
            req.body.teamname,
            req.body.leadername,
            req.body.member1,
            req.body.member2,
            req.body.member3,
            req.body.member4,
            req.body.member5,
          ],
          (err, results) => {
            if (err) {
              console.log(err);
            } else {
              res.json({ status: "ok", messeage: "Team Added" });
            }
          }
        );
      }
    }
  );
});

app.delete("/team/delete/:id", jsonParser, function (req, res, next) {
  const id = req.params.id;
  connection.execute(
    "DELETE FROM teams WHERE teamID = ?",
    [id],
    function (err, results, fields) {
      if (err) {
        console.log(err);
      } else {
        res.json({
          status: `Team Delete with ID: ${id}`,
          messeage: "Delete Success",
        });
      }
    }
  );
});

app.put("/update/team/:id", jsonParser, function (req, res, next) {
  const id = req.params.id;
  connection.query(
    "UPDATE teams SET teamname = ?, leadername = ?, member1 = ?, member2 = ?, member3 = ?, member4 = ?, member5 = ? WHERE teamid = ?",
    [
      req.body.teamname,
      req.body.leadername,
      req.body.member1,
      req.body.member2,
      req.body.member3,
      req.body.member4,
      req.body.member5,
      id,
    ],
    (err, results) => {
      if (err) {
        console.log(err);
      } else {
        res.json({
          status: "Success",
          messeage: `Team modified with ID: ${id}`,
        });
      }
    }
  );
});

app.get("/history", jsonParser, function (req, res, next) {
  connection.execute(
    "SELECT * FROM history ORDER BY date DESC",
    function (err, leave, fields) {
      if (err) {
        console.log(err);
      }
      res.json(leave);
    }
  );
});

app.get("/leave", jsonParser, function (req, res, next) {
  connection.execute(
    "SELECT * FROM history WHERE l_subject IS NOT NULL and l_limit_m IS NULL and l_limit_y IS NULL ORDER BY date DESC;",
    function (err, leave, fields) {
      if (err) {
        console.log(err);
      }
      res.json(leave);
    }
  );
});

app.get("/rollcall", jsonParser, function (req, res, next) {
  connection.execute(
    "SELECT * FROM history WHERE r_subject IS NOT NULL ORDER BY date DESC",
    function (err, rollcall, fields) {
      if (err) {
        console.log(err);
      }
      res.json(rollcall);
    }
  );
});

app.get("/rollcall/in", jsonParser, function (req, res, next) {
  connection.execute(
    `SELECT employees.employeeid, employees.employeeName, history.rollcall, history.date
    FROM j1lchzb4s6du3p01.history
    RIGHT JOIN j1lchzb4s6du3p01.employees
    ON employees.employeeid = history.employeeid
    WHERE DATE_FORMAT(date, '%Y-%m-%d') = CURDATE() and rollcall = true`,
    function (err, rollcallIn, fields) {
      if (err) {
        console.log(err);
      }
      res.json(rollcallIn);
    }
  );
});

app.get("/rollcall/null", jsonParser, function (req, res, next) {
  connection.execute(
    `SELECT employees.employeeid, employees.employeeName, history.rollcall, history.date
    FROM j1lchzb4s6du3p01.history
    RIGHT JOIN j1lchzb4s6du3p01.employees
    ON employees.employeeId = history.employeeId AND DATE_FORMAT(date, '%Y-%m-%d') = CURDATE() AND r_subject is not null
    WHERE date is null AND isAdmin = false AND active = true`,
    function (err, rollcallNull, fields) {
      if (err) {
        console.log(err);
      }
      res.json(rollcallNull);
    }
  );
});

app.get("/rollcall/out", jsonParser, function (req, res, next) {
  connection.execute(
    "SELECT employeeId, rollcall, DATE_FORMAT(date, '%Y-%m-%d') FROM history WHERE DATE_FORMAT(date, '%Y-%m-%d') = CURDATE() and rollcall = false;",
    function (err, rollcallOut, fields) {
      if (err) {
        console.log(err);
      }
      res.json(rollcallOut);
    }
  );
});

app.get("/leave1", jsonParser, function (req, res, next) {
  connection.execute(
    "SELECT employeeId, employeeName, leaves, l_subject, date FROM j1lchzb4s6du3p01.history WHERE DATE_FORMAT(date, '%Y-%m-%d') = CURDATE() and leaves = true",
    function (err, leave1, fields) {
      if (err) {
        console.log(err);
      }
      res.json(leave1);
    }
  );
});

app.get("/history/rollcall/1", jsonParser, function (req, res, next) {
  connection.execute(
    "SELECT * FROM history WHERE MONTH(date) = 1 AND YEAR(date) = YEAR(CURDATE()) AND rollcall = true",
    function (err, rollcallIn, fields) {
      if (err) {
        console.log(err);
      }
      res.json(rollcallIn);
    }
  );
});

app.get("/history/rollcall/2", jsonParser, function (req, res, next) {
  connection.execute(
    "SELECT * FROM history WHERE MONTH(date) = 2 AND YEAR(date) = YEAR(CURDATE()) AND rollcall = true",
    function (err, rollcallIn, fields) {
      if (err) {
        console.log(err);
      }
      res.json(rollcallIn);
    }
  );
});

app.get("/history/rollcall/3", jsonParser, function (req, res, next) {
  connection.execute(
    "SELECT * FROM history WHERE MONTH(date) = 3 AND YEAR(date) = YEAR(CURDATE()) AND rollcall = true",
    function (err, rollcallIn, fields) {
      if (err) {
        console.log(err);
      }
      res.json(rollcallIn);
    }
  );
});

app.get("/history/rollcall/4", jsonParser, function (req, res, next) {
  connection.execute(
    "SELECT * FROM history WHERE MONTH(date) = 4 AND YEAR(date) = YEAR(CURDATE()) AND rollcall = true",
    function (err, rollcallIn, fields) {
      if (err) {
        console.log(err);
      }
      res.json(rollcallIn);
    }
  );
});

app.get("/history/rollcall/5", jsonParser, function (req, res, next) {
  connection.execute(
    "SELECT * FROM history WHERE MONTH(date) = 5 AND YEAR(date) = YEAR(CURDATE()) AND rollcall = true",
    function (err, rollcallIn, fields) {
      if (err) {
        console.log(err);
      }
      res.json(rollcallIn);
    }
  );
});

app.get("/history/rollcall/6", jsonParser, function (req, res, next) {
  connection.execute(
    "SELECT * FROM history WHERE MONTH(date) = 6 AND YEAR(date) = YEAR(CURDATE()) AND rollcall = true",
    function (err, rollcallIn, fields) {
      if (err) {
        console.log(err);
      }
      res.json(rollcallIn);
    }
  );
});

app.get("/history/rollcall/7", jsonParser, function (req, res, next) {
  connection.execute(
    "SELECT * FROM history WHERE MONTH(date) = 7 AND YEAR(date) = YEAR(CURDATE()) AND rollcall = true",
    function (err, rollcallIn, fields) {
      if (err) {
        console.log(err);
      }
      res.json(rollcallIn);
    }
  );
});

app.get("/history/rollcall/8", jsonParser, function (req, res, next) {
  connection.execute(
    "SELECT * FROM history WHERE MONTH(date) = 8 AND YEAR(date) = YEAR(CURDATE()) AND rollcall = true",
    function (err, rollcallIn, fields) {
      if (err) {
        console.log(err);
      }
      res.json(rollcallIn);
    }
  );
});

app.get("/history/rollcall/9", jsonParser, function (req, res, next) {
  connection.execute(
    "SELECT * FROM history WHERE MONTH(date) = 9 AND YEAR(date) = YEAR(CURDATE()) AND rollcall = true",
    function (err, rollcallIn, fields) {
      if (err) {
        console.log(err);
      }
      res.json(rollcallIn);
    }
  );
});

app.get("/history/rollcall/10", jsonParser, function (req, res, next) {
  connection.execute(
    "SELECT * FROM history WHERE MONTH(date) = 10 AND YEAR(date) = YEAR(CURDATE()) AND rollcall = true",
    function (err, rollcallIn, fields) {
      if (err) {
        console.log(err);
      }
      res.json(rollcallIn);
    }
  );
});

app.get("/history/rollcall/11", jsonParser, function (req, res, next) {
  connection.execute(
    "SELECT * FROM history WHERE MONTH(date) = 11 AND YEAR(date) = YEAR(CURDATE()) AND rollcall = true",
    function (err, rollcallIn, fields) {
      if (err) {
        console.log(err);
      }
      res.json(rollcallIn);
    }
  );
});

app.get("/history/rollcall/12", jsonParser, function (req, res, next) {
  connection.execute(
    "SELECT * FROM history WHERE MONTH(date) = 12 AND YEAR(date) = YEAR(CURDATE()) AND rollcall = true",
    function (err, rollcallIn, fields) {
      if (err) {
        console.log(err);
      }
      res.json(rollcallIn);
    }
  );
});

app.get("/history/leaves/1", jsonParser, function (req, res, next) {
  connection.execute(
    "SELECT * FROM history WHERE MONTH(date) = 1 AND YEAR(date) = YEAR(CURDATE()) AND leaves = true",
    function (err, leaves, fields) {
      if (err) {
        console.log(err);
      }
      res.json(leaves);
    }
  );
});

app.get("/history/leaves/2", jsonParser, function (req, res, next) {
  connection.execute(
    "SELECT * FROM history WHERE MONTH(date) = 2 AND YEAR(date) = YEAR(CURDATE()) AND leaves = true",
    function (err, leaves, fields) {
      if (err) {
        console.log(err);
      }
      res.json(leaves);
    }
  );
});

app.get("/history/leaves/3", jsonParser, function (req, res, next) {
  connection.execute(
    "SELECT * FROM history WHERE MONTH(date) = 3 AND YEAR(date) = YEAR(CURDATE()) AND leaves = true",
    function (err, leaves, fields) {
      if (err) {
        console.log(err);
      }
      res.json(leaves);
    }
  );
});

app.get("/history/leaves/4", jsonParser, function (req, res, next) {
  connection.execute(
    "SELECT * FROM history WHERE MONTH(date) = 4 AND YEAR(date) = YEAR(CURDATE()) AND leaves = true",
    function (err, leaves, fields) {
      if (err) {
        console.log(err);
      }
      res.json(leaves);
    }
  );
});

app.get("/history/leaves/5", jsonParser, function (req, res, next) {
  connection.execute(
    "SELECT * FROM history WHERE MONTH(date) = 5 AND YEAR(date) = YEAR(CURDATE()) AND leaves = true",
    function (err, leaves, fields) {
      if (err) {
        console.log(err);
      }
      res.json(leaves);
    }
  );
});

app.get("/history/leaves/6", jsonParser, function (req, res, next) {
  connection.execute(
    "SELECT * FROM history WHERE MONTH(date) = 6 AND YEAR(date) = YEAR(CURDATE()) AND leaves = true",
    function (err, leaves, fields) {
      if (err) {
        console.log(err);
      }
      res.json(leaves);
    }
  );
});

app.get("/history/leaves/7", jsonParser, function (req, res, next) {
  connection.execute(
    "SELECT * FROM history WHERE MONTH(date) = 7 AND YEAR(date) = YEAR(CURDATE()) AND leaves = true",
    function (err, leaves, fields) {
      if (err) {
        console.log(err);
      }
      res.json(leaves);
    }
  );
});

app.get("/history/leaves/8", jsonParser, function (req, res, next) {
  connection.execute(
    "SELECT * FROM history WHERE MONTH(date) = 8 AND YEAR(date) = YEAR(CURDATE()) AND leaves = true",
    function (err, leaves, fields) {
      if (err) {
        console.log(err);
      }
      res.json(leaves);
    }
  );
});

app.get("/history/leaves/9", jsonParser, function (req, res, next) {
  connection.execute(
    "SELECT * FROM history WHERE MONTH(date) = 9 AND YEAR(date) = YEAR(CURDATE()) AND leaves = true",
    function (err, leaves, fields) {
      if (err) {
        console.log(err);
      }
      res.json(leaves);
    }
  );
});

app.get("/history/leaves/10", jsonParser, function (req, res, next) {
  connection.execute(
    "SELECT * FROM history WHERE MONTH(date) = 10 AND YEAR(date) = YEAR(CURDATE()) AND leaves = true",
    function (err, leaves, fields) {
      if (err) {
        console.log(err);
      }
      res.json(leaves);
    }
  );
});

app.get("/history/leaves/11", jsonParser, function (req, res, next) {
  connection.execute(
    "SELECT * FROM history WHERE MONTH(date) = 11 AND YEAR(date) = YEAR(CURDATE()) AND leaves = true",
    function (err, leaves, fields) {
      if (err) {
        console.log(err);
      }
      res.json(leaves);
    }
  );
});

app.get("/history/leaves/12", jsonParser, function (req, res, next) {
  connection.execute(
    "SELECT * FROM history WHERE MONTH(date) = 12 AND YEAR(date) = YEAR(CURDATE()) AND leaves = true",
    function (err, leaves, fields) {
      if (err) {
        console.log(err);
      }
      res.json(leaves);
    }
  );
});

app.get("/history/rollcall/year", jsonParser, function (req, res, next) {
  connection.execute(
    "SELECT * FROM history WHERE YEAR(date) = YEAR(CURDATE()) AND rollcall = true",
    function (err, rollcallYear, fields) {
      if (err) {
        console.log(err);
      }
      res.json(rollcallYear);
    }
  );
});

app.get("/history/leave/year", jsonParser, function (req, res, next) {
  connection.execute(
    "SELECT * FROM history WHERE YEAR(date) = YEAR(CURDATE()) AND leaves = true",
    function (err, leavesYear, fields) {
      if (err) {
        console.log(err);
      }
      res.json(leavesYear);
    }
  );
});

app.get("/certificate", jsonParser, function (req, res, next) {
  connection.execute(
    "SELECT * FROM history WHERE certificateName IS NOT NULL ORDER BY date DESC",
    function (err, certificate, fields) {
      if (err) {
        console.log(err);
      }
      res.json(certificate);
    }
  );
});

app.put("/history/update/status/:id", jsonParser, function (req, res, next) {
  const id = req.params.id;
  connection.query(
    "UPDATE history SET status = 'Read' WHERE historyId = ?",
    [id],
    (err, results) => {
      if (err) {
        console.log(err);
      } else {
        res.json({
          status: "Success",
          messeage: `Status modified with ID: ${id}`,
        });
      }
    }
  );
});

app.put("/history/update/approve1/:id", jsonParser, function (req, res, next) {
  const id = req.params.id;
  connection.query(
    "UPDATE history SET leaves = 1, approve = 1, status = 'Approve' WHERE historyId = ?",
    [id],
    (err, results) => {
      if (err) {
        console.log(err);
      } else {
        res.json({
          status: "Success",
          messeage: `Approve modified with ID: ${id}`,
        });
      }
    }
  );
});

app.put("/history/update/approve0/:id", jsonParser, function (req, res, next) {
  const id = req.params.id;
  connection.query(
    "UPDATE history SET leaves = 0, approve = 0, status = 'Not Approve' WHERE historyId = ?",
    [id],
    (err, results) => {
      if (err) {
        console.log(err);
      } else {
        res.json({
          status: "Success",
          messeage: `Approve modified with ID: ${id}`,
        });
      }
    }
  );
});

app.put("/history/update/cer1/:id", jsonParser, function (req, res, next) {
  const id = req.params.id;
  connection.query(
    "UPDATE history SET certificate = 1, approve = 1, status = 'Approve' WHERE historyId = ?",
    [id],
    (err, results) => {
      if (err) {
        console.log(err);
      } else {
        res.json({
          status: "Success",
          messeage: `Approve modified with ID: ${id}`,
        });
      }
    }
  );
});

app.put("/history/update/cer0/:id", jsonParser, function (req, res, next) {
  const id = req.params.id;
  connection.query(
    "UPDATE history SET certificate = 0, approve = 0, status = 'Not Approve' WHERE historyId = ?",
    [id],
    (err, results) => {
      if (err) {
        console.log(err);
      } else {
        res.json({
          status: "Success",
          messeage: `Approve modified with ID: ${id}`,
        });
      }
    }
  );
});

app.get("/history/:id", jsonParser, function (req, res, next) {
  const id = req.params.id;
  connection.execute(
    "SELECT * FROM history WHERE historyId = ?",
    [id],
    function (err, history, fields) {
      res.json(history);
    }
  );
});

app.put("/update/password/:id", jsonParser, function (req, res, next) {
  const id = req.params.id;
  bcrypt.hash(req.body.password, saltRounds, function (err, hash) {
    connection.query(
      "UPDATE employees SET password = ? WHERE employeeid = ?",
      [hash, id],
      function (err, results, fields) {
        if (err) {
          console.log(err);
        } else {
          res.json({
            status: "Success",
            messeage: `Password modified with ID: ${id}`,
          });
        }
      }
    );
  });
});

app.post("/authen", jsonParser, function (req, res, next) {
  try {
    const token = req.headers.authorization.split(" ")[1];
    var decoded = jwt.verify(token, secret);
    res.json({ status: "ok", decoded });
  } catch (err) {
    res.json({ status: "error", messeage: err.messeage });
  }
});

app.post("/authen/hr", jsonParser, function (req, res, next) {
  try {
    const token = req.headers.authorization.split(" ")[1];
    var decoded = jwt.verify(token, secret);
    res.json({ status: "ok", decoded });
  } catch (err) {
    res.json({ status: "error", messeage: err.messeage });
  }
});

app.listen(PORT, function () {
  console.log("CORS-enabled web server listening on port 5000");
});

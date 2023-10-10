const express = require("express");
const app = express();
const bodyParser = require("body-parser");
const path = require("path");

var csrf = require("tiny-csrf");
var cookeParser = require("cookie-parser");

const { User } = require("./models");
const cookieParser = require("cookie-parser");

const passport = require("passport");
const connectEnsureLogin = require("connect-ensure-login");
const session = require("express-session");
const LocalStrategy = require("passport-local");

const flash = require("connect-flash");

const bcrypt = require("bcrypt");
const saltRounds = 10;

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser("shh! some secret string"));
app.use(csrf("this_should_be_32_character_long", ["POST", "PUT", "DELETE"]));
app.use(flash());

app.use(
  session({
    secret: "my-super-secret-key-21728172615261562",
    cookie: {
      maxAge: 24 * 60 * 60 * 1000,
    },
  })
);

app.use(function (request, response, next) {
  response.locals.messages = request.flash();
  next();
});

app.use(passport.initialize());
app.use(passport.session());

passport.use(
    new LocalStrategy(
      {
        usernameField: "email",
        passwordField: "password",
      },
      (username, password, done) => {
        User.findOne({ where: { email: username } })
          .then(async function (user) {
            const result = await bcrypt.compare(password, user.password);
            if (result) {
              return done(null, user);
            } else {
              return done(null, false, { message: "Invalid password" });
            }
          })
          .catch((error) => {
            return done(err);
          });
      }
    )
  );
  

passport.serializeUser((user, done) => {
  console.log("Serializing in session", user.id);
  done(null, user.id);
});

passport.deserializeUser((id, done) => {
  User.findByPk(id)
    .then((user) => {
      done(null, user);
    })
    .catch((error) => {
      done(error, null);
    });
});

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

app.get("/", (req, res) => {
  res.render("index", {
    title: "Welcome , This is Home page",
    csrfToken: req.csrfToken(),
  });
});

app.get("/signup", (req, res) => {
  res.render("signup", {
    title: "Create a new account",
    csrfToken: req.csrfToken(),
  });
});

app.get("/login", (req, res) => {
  res.render("login", {
    title: "Log in to your account",
    csrfToken: req.csrfToken(),
  });
});

app.get("/signout", (req, res) => {
    req.logout((err) => {
      if (err) {
        return next(err);
      }
      res.redirect("/");
    });
  });
   
app.get("/first", connectEnsureLogin.ensureLoggedIn(), async (req, res) => {
  res.render("first", {
    firstName: req.user.firstName,
  });
});

app.post("/users", async (req, res) => {
  if (req.body.firstName.length == 0) {
    req.flash("error", "Please fill the first name");
    return res.redirect("/signup");
  }
  if (req.body.lastName.length == 0) {
    req.flash("error", "Please fill the last name");
    return res.redirect("/signup");
  }
  if (req.body.email.length == 0) {
    req.flash("error", "Please fill the email");
    return res.redirect("/signup");
  }
  if (req.body.password.length == 0) {
    req.flash("error", "Please fill the password");
    return res.redirect("/signup");
  }

  const hashedPwd = await bcrypt.hash(req.body.password, saltRounds);
  try {
    //const user = await User.create({firstName: req.body.firstName,lastName: reqlastName,email: email,password: password,role: role})
    const user = await User.create({
      firstName: req.body.firstName,
      lastName: req.body.lastName,
      email: req.body.email,
      password: hashedPwd,
      role: "user",
    });
    req.login(user, (err) => {
      if (err) {
        console.log(err);
      } else {
        req.flash("success", "sign up successfull");
      }
      res.redirect("/first");
    });
  } catch (err) {
    console.log(err);
    req.flash("error", "User already exists");
    return res.redirect("/signup");
  }
});

app.post(
  "/session",
  passport.authenticate("local", {
    failureRedirect: "/login",
    failureFlash: true,
  }),
  (req, res) => {
    res.redirect("/first");
  }
);

module.exports = app;

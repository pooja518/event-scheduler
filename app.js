const express = require("express");
const app = express();
const bodyParser = require("body-parser");
const path = require("path");

var csrf = require("tiny-csrf");
var cookeParser = require("cookie-parser");

const { Event,User } = require("./models");
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
app.use(express.static(path.join(__dirname, "public")));
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
            return done(error);
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
   

app.get("/event",connectEnsureLogin.ensureLoggedIn(),(req,res)=> {
  res.render('event',{
    title: "Schedule an event",
    csrfToken: req.csrfToken()
  })
})

app.get('/destination',connectEnsureLogin.ensureLoggedIn(), async (req, res) => {
  // Logic for the destination page goes here
  try{
    const userId = req.user.id
    console.log(userId)
    const userEvents = await Event.fetchUserEvents(userId);
    const otherEvents = await Event.fetchOtherEvents(userId)
    res.render('destination',{
      title: "Events",
      userEvents: userEvents,
      otherEvents: otherEvents,
      csrfToken: req.csrfToken()
    });
  }
  catch (err) {
    console.log(err);
    return res.send("No events to display");
  }
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
      res.redirect("/destination");
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
    res.redirect("/destination");
  }
);

var no_of_participants = 0;
// POST endpoint to create a new event and associate it with a user
app.post('/create-event',connectEnsureLogin.ensureLoggedIn(), async (req, res) => {
  const { eventName, eventDescription, eventDate, participants, eventVenue} = req.body;
  console.log(eventName, eventDescription, eventDate, participants, eventVenue);
  const userId = req.user.id;
  if (!eventName || !eventDescription || !eventDate || !participants || !eventVenue) {
    req.flash("error", "Fill all the details");
    return res.redirect("/event");
  }

  try {
    // Check if the user exists
    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Create a new event associated with the user
    const newEvent = await Event.create({
      name: req.body.eventName,
      description: req.body.eventDescription,
      date: req.body.eventDate,
      no_of_participants,
      capacity: req.body.participants,
      venue: req.body.eventVenue,
      userId: userId,
    });

    // Respond with the newly created event
    res.redirect("/destination")
  } catch (error) {
    // Handle database errors
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post(
  "/destination/:id/",
  async (req, res) => {
    const event = await Event.findByPk(req.params.id);

    const status = event.no_of_participants;
    try {
      const updatedEvent = await event.setCompletionStatus(status+1);
      return res.send(true);
    } catch (error) {
      console.log(error);
      return res.status(422);
    }
  }
);

module.exports = app;

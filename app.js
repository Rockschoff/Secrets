//jshint esversion:6
require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");
// const bcrypt = require('bcrypt');
// const saltRounds = 10;
const session = require('express-session');
const passport = require("passport");
const passportLocalMongoose = require('passport-local-mongoose');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const findOrCreate = require('mongoose-findorcreate');


const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({
  extended: true
}));
app.use(express.static("public"));

app.use(session({
  secret: "our little secret",
  resave: false,
  saveUninitialized: false
}));
app.use(passport.initialize());
app.use(passport.session());



mongoose.connect('mongodb://localhost:27017/secretsDb', {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

const userSchema = new mongoose.Schema({
  userName: String,
  password: String,
  googleId: String,
  secrets : String
});



userSchema.plugin(passportLocalMongoose);
userSchema.plugin(findOrCreate);

const userModel = new mongoose.model("User", userSchema);
mongoose.set('useCreateIndex', true);
passport.use(userModel.createStrategy());

passport.serializeUser(function(user, done) {
  done(null, user.id);
});

passport.deserializeUser(function(id, done) {
  userModel.findById(id, function(err, user) {
    done(err, user);
  });
});

passport.use(new GoogleStrategy({
    clientID: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    callbackURL: "http://localhost:3000/auth/google/secrets",
    userProfileURL: "https://www.googleapis.com/oauth2/v3/userinfo"
  },
  function(accessToken, refreshToken, profile, cb) {
    userModel.findOrCreate({
      googleId: profile.id
    }, function(err, user) {
      return cb(err, user);
    });
  }
));




//TODO
app.get("/", function(req, res) {
  res.render("home");
});

app.get('/auth/google',
  passport.authenticate('google', {
    scope: ['profile']
  }));

app.get('/auth/google/secrets',
  passport.authenticate('google', {
    failureRedirect: '/login'
  }),
  function(req, res) {
    // Successful authentication, redirect home.
    res.redirect('/secrets');
  });

app.get("/login", function(req, res) {
  res.render("login");
});

app.get("/register", function(req, res) {
  res.render("register");
});

app.get("/submit" ,  function(req, res) {
  if (req.isAuthenticated()) {
    res.render("submit");
  } else {
    res.redirect("/login");
  }
});

app.post("/submit" , function(req , res){
  const secret = req.body.secret;
  console.log("finding the user");
  userModel.findOne({username : req.user.username} , function(err , docs){
    if(err){
      console.log(err);
    }else{
      console.log("no err");
      if(docs){
        console.log("user found");
        console.log(docs)
        docs.secrets=secret;
        docs.save(function(){
          res.redirect("/secrets");
        })
      }
    }
  })
});

app.post("/register", function(req, res) {
  userModel.register({
    username: req.body.username
  }, req.body.password, function(err, user) {
    if (err) {
      console.log(err);
      res.redirect("/register");
    } else {
      passport.authenticate("local")(req, res, function() {
        res.redirect("/secrets");
      })
    }
  })

  // bcrypt.hash(req.body.password, saltRounds, function(err, hash) {
  //   const newUser = new userModel({
  //     userName : req.body.username,
  //     password : hash
  //   });
  //   newUser.save(function(err){
  //     if(err){
  //       console.log(err);
  //     }else{
  //       res.render("secrets");
  //     }
  //   });
  //   });

});


app.get("/secrets", function(req, res) {
  // if (req.isAuthenticated()) {
  //   res.render("secrets");
  // } else {
  //   res.redirect("/login");
  // }
  userModel.find({"secrets": {$ne : null}} , function(err  , docs){
    if(err){
      console.log(err);
    }else{
      if (docs){
        res.render("secrets" , {userWithSecrets : docs});
      }
    }
  })
});

app.get("/logout", function(req, res) {
  req.logout();
  res.redirect("/")
})


app.post("/login", function(req, res) {
  const user = new userModel({
    username: req.body.username,
    password: req.body.passport
  })

  req.login(user, function(err) {
    if (err) {
      console.log(err);
      res.redirect("/login");
    } else {
      passport.authenticate("local")(req, res, function() {
        res.redirect("/secrets")
      })
    }
  })
  //   userModel.findOne({userName : req.body.username} , function(err , docs){
  //     if(err){
  //       console.log(err);
  //
  //     }else{
  //       if(docs){
  //         bcrypt.compare(req.body.password, docs.password, function(err, result) {
  //     if (result){
  //       res.render("secrets");
  //     }
  // });
  //       }
  //     }
  //   });
});


app.listen(3000, function() {
  console.log("Server started on port 3000");
})

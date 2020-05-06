//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");

mongoose.connect('mongodb://localhost:27017/secretsDb', {useNewUrlParser: true, useUnifiedTopology: true});

const userSchema = new mongoose.Schema({
  userName : String,
  password : String
});

const userModel = new mongoose.model("User" , userSchema);




const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({
  extended: true
}));
app.use(express.static("public"));

//TODO
app.get("/" , function(req , res){
  res.render("home");
});

app.get("/login" , function(req , res){
  res.render("login");
});

app.get("/register" , function(req , res){
  res.render("register");
});

app.post("/register" , function(req , res){
  const newUser = new userModel({
    userName : req.body.username,
    password : req.body.password
  });
  newUser.save(function(err){
    if(err){
      console.log(err);
    }else{
      res.render("secrets");
    }
  })
})

app.post("/login" , function(req , res){
  userModel.findOne({userName : req.body.username} , function(err , docs){
    if(err){
      console.log(err);

    }else{
      if(docs){
        if(docs.password === req.body.password){
          res.render("secrets");
        }else{
          console.log("invalid credentials");
        }
      }
    }
  });
});


app.listen(3000, function() {
  console.log("Server started on port 3000");
})

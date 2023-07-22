//jshint esversion:6

const express = require("express");
const ejs = require("ejs");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");

const app = express();

app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

mongoose.connect("mongodb://0.0.0.0:27017/userDB");
const userSchema = new mongoose.Schema({ email: String, password: String });
const userModel = mongoose.model("User", userSchema)







app.route("/")
    .get((req, res) => {
        res.render("home");
    });









app.route("/login")
    .get((req, res) => {
        res.render("login");
    })
    .post((req,res)=>{
        userModel.findOne({  email: req.body.username }).then(doc=>{
            if(doc){
                if(doc.password === req.body.password){
                      res.render("secrets");
                }else{
                    res.redirect("/login");
                }
              
            }else{
                res.send("kayıt ol");
            }
        }).catch(err=>{
            console.log(err);
        });
        
    });







app.route("/register")
    .get((req, res) => {
        res.render("register");
    })
    .post((req, res) => {
        const newUser = new userModel({
            email: req.body.username,
            password: req.body.password
        });
        newUser.save().then(() => {
            res.render("secrets");
        }).catch(err => {
            console.log(err);
        });
    });






app.listen(3000, () => {
    console.log("sunucu 3000 portunda çalışıyor.");
});
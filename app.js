//jshint esversion:6
require('dotenv').config()
const express = require("express");
const ejs = require("ejs");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");

// const encrypt =  require("mongoose-encryption");
// const md5 = require('md5');
// const bcrypt = require('bcrypt');
// const saltRounds = 10;

const session = require('express-session');
const passport = require('passport');
const passportLocalMongoose = require('passport-local-mongoose');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const FacebookStrategy = require('passport-facebook');


const app = express();


app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

app.use(session({ secret: "anahtardizi", resave: false, saveUninitialized: false }));
app.use(passport.initialize());
app.use(passport.session());


mongoose.connect("mongodb://0.0.0.0:27017/userDB");

const userSchema = new mongoose.Schema({ email: String, password: String, googleId: String, fbId: String ,secret:String});

userSchema.plugin(passportLocalMongoose);



const userModel = mongoose.model("User", userSchema)

passport.use(userModel.createStrategy());


passport.serializeUser(function (user, done) {
    done(null, user);
});

passport.deserializeUser(function (user, done) {
    done(null, user);
});

passport.use(new GoogleStrategy({

    clientID: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    callbackURL: process.env.GOOGLE_CALLBACK_URL,
},
    function (accessToken, refreshToken, profile, cb) {

        userModel.findOne({ googleId: profile.id }).then((foundUser) => {
            if (foundUser) {
                return foundUser;

            } else {
                const user = new userModel({

                    googleId: profile.id,
                    username: profile.emails[0].value

                });
                return user.save();
            }
        }).then((user) => {
            return cb(null, user);
        }).catch((err) => {
            return cb(err);
        });
    }
));

passport.use(new FacebookStrategy({

    clientID: process.env.FACEBOOK_APP_ID,
    clientSecret: process.env.FACEBOOK_APP_SECRET,
    callbackURL: process.env.FACEBOOK_CALLBACK_URL,
    profileFields: ["emails", "displayName", "name"]
},
    function (accessToken, refreshToken, profile, cb) {

        userModel.findOne({ fbId: profile.id }).then((foundUser) => {
            if (foundUser) {
                console.log(profile);
                return foundUser;
            } else {
                const user = new userModel({

                    fbId: profile.id,
                    username: profile.emails[0].value

                });
                return user.save();
            }
        }).then((user) => {
            return cb(null, user);
        }).catch((err) => {
            return cb(err);
        });
    }
));



app.route("/auth/facebook")

    .get(passport.authenticate('facebook', {
        scope: ['public_profile', 'email']
    }));


app.route("/auth/facebook/secrets")
    .get(passport.authenticate('facebook', { failureRedirect: "/login", successRedirect: "/secrets" }));


app.route("/auth/google")

    .get(passport.authenticate("google", { scope: ["profile", "email"] }), (req, res) => {
    });


app.route("/auth/google/secrets")

    .get(passport.authenticate("google", { failureRedirect: "/login" }), (req, res) => {

        res.redirect("/secrets");
    });


app.route("/")

    .get((req, res) => {
        res.render("home");
    });


app.route("/login")

    .get((req, res) => {
        res.render("login");
    })

    .post((req, res) => {

        const user = new userModel({ username: req.body.username, password: req.body.password });

        req.login(user, (err) => {
            if (err) {
                console.log(err);
            } else {
                passport.authenticate("local")(req, res, () => {
                    res.redirect("/secrets");

                });
            }
        });
    });






app.route("/register")

    .get((req, res) => {
        res.render("register");
    })

    .post((req, res) => {
        userModel.register({ username: req.body.username }, req.body.password).then(user => {

            passport.authenticate("local")(req, res, () => {
                res.redirect("/secrets");

            });
        }).catch(err => {
            console.log(err);
            res.redirect("/register");
        });

    });

app.route("/secrets")
    .get((req, res) => {

        userModel.find({"secret" : {$ne : null}}).then(foundUsers => {
            if(foundUsers){
                res.render("secrets" , {userWithSecrets : foundUsers})
            }
        }).catch(err=> {
        console.log(err);
    });

    });

app.route("/logout")
    .get((req, res) => {
        req.logout((err) => {
            if (err) {
                return next(err);
            } else {
                res.redirect('/');
            }
        });
    });

app.route("/submit")
    .get((req, res) => {
        
        if (req.isAuthenticated) {

            res.render("submit");
        }
        else {

            res.redirect("/login");
        }
    })
    .post((req,res) => {
      

        userModel.findById(req.user._id).then(foundUser =>{
            if(foundUser){
                foundUser.secret =req.body.secret ;
                foundUser.save().then(() => {
                    res.redirect("/secrets")
                });
            }
        }).catch(err => {
        console.log(err);})
    });




app.listen(3000, () => {
    console.log("sunucu 3000 portunda çalışıyor.");
});
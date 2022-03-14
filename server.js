/*
CSCI3916 HW3
File: Server.js
Description: Web API scaffolding for Movie API
 */

let envPath = __dirname + "/.env"
require('dotenv').config({path:envPath});
var express = require('express');
var bodyParser = require('body-parser');
var passport = require('passport');
var authController = require('./auth');
var authJwtController = require('./auth_jwt');
var jwt = require('jsonwebtoken');
var cors = require('cors');
var User = require('./Users');

var app = express();
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

app.use(passport.initialize());

var router = express.Router();
var Movie = require('./movies');

router.route('/movie')
    //save movie
    .post(authJwtController.isAuthenticated, function (req, res) {
        console.log(req.body);
        var movie = new Movie();
        movie.title = req.body.title;
        movie.yearReleased = req.body.yearReleased;
        movie.genre = req.body.genre;
        movie.actors = req.body.actors;

        //check if movies exist, maybe error or it has <3 errors.
        Movie.findOne({title: req.body.title}, function(err, found){
            if(err){
                res.json({message: "Read error \n", error: err});
            }
            else if(found){
                res.json({message: "Movie already exist"});
            }
            else if (movie.actors.length < 3){
                res.json({message: "Need at least 3 actors"});
            }
            else{
                movie.save(function (err) {
                    if(err){
                        res.json({message: "Something went wrong, check your fields\n", error: err});
                    }
                    else{
                        res.json({message: "Movie is saved to DB"});
                    }
                })
            }
        });
    })

    //finds all movies
    .get(authJwtController.isAuthenticated, function (req, res) {
        Movie.find(function (err, movie) {
            if(err) res.json({message: "Ooops, something is wrong. Read error. \n", error: err});
            res.json(movie);
        })
    })

    //delete movie by title.
    .delete(authJwtController.isAuthenticated, function (req, res){
        Movie.findOneAndDelete({title: req.body.title}, function (err, movie) {
            if (err)
            {
                res.status(400).json({message: "Read error, something wrong", msg: err})
            }
            else if(movie == null)
            {
                res.json({msg : "The movie is not found"})
            }
            else
                res.json({msg :"Movie is deleted"})
        })
    });

//find movie by id
router.route('/movie/:movieid')
    .get(authJwtController.isAuthenticated, function (req, res) {
        var id = req.params.movieid;
        Movie.findById(id, function (err, movie) {
            if (err) res.send(err);
            res.json(movie);
        })
    });

//update movie
router.route('/movie/:id')
    .put(authJwtController.isAuthenticated, function (req, res) {
        var conditions = {_id: req.params.id};
        Movie.findOne({title: req.body.title}, function(err, found) {
            if (err) {
                res.json({message: "Read error \n", error: err});
            }
                //if (found) {
            //  res.json({message: "Movie already exist"});
            else {
                Movie.updateOne(conditions, req.body)
                    .then(mov => {
                        if (!mov) {
                            return res.status(404).end();
                        }
                        return res.status(200).json({msg: "Movie is updated"})
                    })
                    .catch(err => console.log(err))
            }
        })
    });

router.route('/users/:userId')
    .get(authJwtController.isAuthenticated, function (req, res) {
        var id = req.params.userId;
        User.findById(id, function(err, user) {
            if (err) res.send(err);
            // return that user
            res.json(user);
        });
    });

router.route('/users')
    .get(authJwtController.isAuthenticated, function (req, res) {
        User.find(function (err, users) {
            if (err) res.send(err);
            // return the users
            res.json(users);
        });
    });

//{name : 'oleksiy', username : 'oleksiy', password : 'password'}
router.post('/signup', function(req, res) {
    if (!req.body.username || !req.body.password) {
        res.json({success: false, message: 'Please pass username and password.'});
    }
    else {
        var user = new User();
        user.name = req.body.name;
        user.username = req.body.username;
        user.password = req.body.password;
        // save the user
        user.save(function(err) {
            if (err) {
                // duplicate entry
                if (err.code == 11000)
                    return res.json({ success: false, message: 'A user with that username already exists. '});
                else
                    return res.send(err);
            }
            res.json({ success: true, message: 'User created!' });
        });
    }
});

router.post('/signin', function(req, res) {
    var userNew = new User();
    userNew.name = req.body.name;
    userNew.username = req.body.username;
    userNew.password = req.body.password;

    User.findOne({ username: userNew.username }).select('name username password').exec(function(err, user) {
        if (err) res.send(err);

        user.comparePassword(userNew.password, function(isMatch){
            if (isMatch) {
                var userToken = {id: user._id, username: user.username};
                var token = jwt.sign(userToken, process.env.SECRET_KEY);//change here
                res.json({success: true, token: 'JWT ' + token});
            }
            else {
                res.status(401).send({success: false, message: 'Authentication failed.'});
            }
        });
    });
});

//All other routes and methods
router.all('*', function(req, res) {
    res.json({
        error: 'Your HTTP method is not supported. Fix it please.👮‍'
    });
});

app.use('/', router);
app.listen(process.env.PORT || 8080);
module.exports = app; // for testing only

/*
CSC3916 HW3
File: Server.js
Description: Web API scaffolding for Movie API
 */

var express = require('express');
var bodyParser = require('body-parser');
var passport = require('passport');
var authController = require('./auth');
var authJwtController = require('./auth_jwt');
var jwt = require('jsonwebtoken');
var cors = require('cors');
var User = require('./Users');
var Movies = require('./Movies');

var app = express();
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

app.use(passport.initialize());
var router = express.Router();


router.route('/movies')
    .get(authJwtController.isAuthenticated, function(req, res){
        Movies.find(function (err, movies) {
            if(err) res.json({message: "Bad news: Couldn't get the movies. Good news: You're smart and can figure out why!"})
            res.json(movies);
        })
    })

    .post(authJwtController.isAuthenticated, function(req, res){
            var movie = new Movies();
            movie.title = req.body.title;
            movie.year = req.body.year;
            movie.genre = req.body.genre;
            movie.actors = req.body.actors;
    
            if(movie.actors.length < 3){
                return res.status(400).json({message: "Movie must have at least 3 actors."})
            }

            movie.save(function(err){
                if (err) {
                    return res.status(400).json(err);
                }
                res.json({success: true, message: req.body.title + ' was successfully saved.'})
            });
    })

    .put(authJwtController.isAuthenticated, function(req, res) {
        Movies.findOne({title: req.body.title}, function(err, found) {
            if (err) {
                res.json({message: "Read error \n", error: err});
            }
            else {
                Movies.updateOne({title: req.body.title}, req.body.modify)
                    .then(mov => {
                        if (!mov) {
                            return res.status(404).end();
                        }
                        return res.status(200).json({message: "Movie is updated"})
                    })
                    .catch(err => console.log(err))
            }
        });
    })

        /*
        var query = {title: req.body.title};
        var newValues = {$set: req.body.modify};
        Movies.updateOne(query, newValues)
         */

    .delete(authJwtController.isAuthenticated, function(req, res) {
        Movies.remove({title: req.body.title}, function (err, movie) {
            if (err) {
                res.status(400).json(err);
            } else if (movie == null) {
                res.json({message: 'This movie isn\'t in the database'});
            } else {
                res.json({message: req.body.title + ' was successfully deleted'});
            }
        });
    });


router.post('/signup', function(req, res) {
    if (!req.body.username || !req.body.password) {
        res.json({success: false, msg: 'Please include both username and password to signup.'})
    } else {
        var user = new User();
        user.name = req.body.name;
        user.username = req.body.username;
        user.password = req.body.password;

        user.save(function(err){
            if (err) {
                if (err.code == 11000)
                    return res.json({ success: false, message: 'A user with that username already exists.'});
                else
                    return res.json(err);
            }

            res.json({success: true, msg: 'Successfully created new user.'})
        });
    }
});

router.post('/signin', function (req, res) {
    var userNew = new User();
    userNew.username = req.body.username;
    userNew.password = req.body.password;

    User.findOne({ username: userNew.username }).select('name username password').exec(function(err, user) {
        if (err) {
            res.send(err);
        }

        user.comparePassword(userNew.password, function(isMatch) {
            if (isMatch) {
                var userToken = { id: user.id, username: user.username };
                var token = jwt.sign(userToken, process.env.SECRET_KEY);
                res.json ({success: true, token: 'JWT ' + token});
            }
            else {
                res.status(401).send({success: false, msg: 'Authentication failed.'});
            }
        })
    })
});

app.use('/', router);
app.listen(process.env.PORT || 8080);
module.exports = app; // for testing only

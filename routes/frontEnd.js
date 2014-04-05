
/*
 * Browser routing, for clients
 */
var fs = require('fs')
    , config = JSON.parse(fs.readFileSync('./config.json'))
    , passport = require('passport')
    , moment = require('moment')
    , User = require('../models/user');

module.exports = function (app, ensureAuth, io) {
  app.get('/', function(req, res) {
    res.render('index', { title: [config.name, config.tagline].join(' | '),
                          user: req.user,
                          req: req,
                          message: req.flash('message'), 
                          error: req.flash('error') });
  });

  app.get('/settings', ensureAuth, function(req, res) {
    res.render('settings', { title: 'Your settings', 
                            user: req.user, 
                            req: req,
                            message: req.flash('message'), 
                            error: req.flash('error') });
  });
  app.post('/settings', ensureAuth, function(req, res) {
    if (req.body.password && (req.body.password != req.body.password_conf)) {
      req.flash('error', 'New password and password confirmation must match.')
      res.redirect('/settings');
    } else if(!req.body.username || !req.body.email){
      req.flash('error', 'Please supply a username and email.')
      res.redirect('/settings');
    } else {
      User.findById(req.user._id, function(err,user){
        if(err){
          req.flash('error', 'Updates were unsuccessful: '+err);
          res.redirect('/settings');
        }
        if(req.body.password){
          user.setPassword(req.body.password, function setPassword(err, resetAccount){
            if(err) {
              req.flash('error', 'There was a problem in saving that information: '+err);
              res.redirect('/settings');
              throw err;
            }
            resetAccount.username = req.body.username;
            resetAccount.email = req.body.email;
            if(req.body.getUpdates){resetAccount.getUpdates = true;}else{resetAccount.getUpdates = false;};
            resetAccount.save(function(err, saved){
              if(err) {
                req.flash('error', 'There was a problem in saving that information: '+err);
                res.redirect('/settings');
                throw err;
              }
              req.flash('message', 'Updates were successful.');
              res.redirect('/');
            });
          });
        } else {
          user.username = req.body.username;
          user.email = req.body.email;
          if(req.body.getUpdates){user.getUpdates = true;}else{user.getUpdates = false;};
          user.save(function(err, saved){
            if(err) {
              req.flash('error', 'There was a problem in saving that information: '+err);
              res.redirect('/settings');
              throw err;
            }
            req.flash('message', 'Updates were successful.');
            res.redirect('/');
          });
        }
      });
    }
  });

  app.get('/register', function(req, res) {
    res.render('signIn', { title: 'Register for '+config.name, 
                          type: 'register',
                          user: req.user, 
                          req: req,
                          message: req.flash('message'), 
                          error: req.flash('error') });
  });
  app.post('/register', function(req, res) {
    if (req.body.password != req.body.password_conf) {
      req.flash('error', 'Password and password confirmation must match.');
      res.redirect('/');
    }
    User.register(new User({ email : req.body.email, username: req.body.email.match(/^[^@]*/) }), req.body.password, function(err, account) {
        if (err) {
            req.flash('error', 'That email is already in use.');
            return res.redirect('/');
        }
        passport.authenticate('local')(req, res, function () {
          req.flash('message', 'Welcome, '+account.username+'!');
          res.redirect('/settings');
        });
    });
  });
  app.get('/sign-in', function(req, res) {
    res.render('signIn', { title: 'Sign In to ' + config.name, 
                            user: req.user, 
                            type: 'signin',
                            req: req,
                            message: req.flash('message'), 
                            error: req.flash('error') });
  });
  app.post('/sign-in', passport.authenticate('local', { failureRedirect: '/sign-in', failureFlash: 'Invalid email or password.' }), function(req, res) {
    res.redirect('/');
  });
  app.get('/auth/twitter', passport.authenticate('twitter'));
  app.get('/auth/twitter/callback', passport.authenticate('twitter', { successRedirect: '/', failureRedirect: '/sign-in', failureFlash: 'Something is whack with your Twitter account!' }), function(req, res) {
    req.flash('message', 'Connected via Twitter!');
    res.redirect('/settings');
  });
  app.get('/sign-out', function(req, res) {
    req.logout();
    req.flash('message', 'You have been signed out.');
    res.redirect('/');
  });
};
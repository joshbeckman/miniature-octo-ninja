require('newrelic');
var express = require('express')
  , http = require('http')
  , path = require('path')
  , app = express()
  , server = http.createServer(app)
  , passport = require('passport')
  , pass = require('./config/passport')
  , mongoose = require('mongoose')
  , flash = require('connect-flash')
  , io = require('socket.io').listen(server)
  , fs = require('fs')
  , config = JSON.parse(fs.readFileSync('./config.json'))
  , pkg = JSON.parse(fs.readFileSync('./package.json'));

// all environments
app.set('port', process.env.PORT || 5001);
app.set('views', __dirname + '/views');
app.set('view engine', 'jade');
app.use(express.favicon());
app.use(express.logger('dev'));
app.use(express.bodyParser());
app.use(express.methodOverride());
app.use(flash());
app.use(express.cookieParser('You know you wanna'));
app.use(express.cookieSession({ secret: 'Oh come on mama', cookie: { maxAge: 1000*60*60*24*30 } })); // CHANGE THIS SECRET!
app.use(passport.initialize());
app.use(passport.session());
app.use(express.compress());
app.use(app.router);
app.use(express.static(path.join(__dirname, 'public')));
app.use(logErrors);
app.use(clientErrorHandler);
app.use(errorHandler);
app.use(function(req, res, next){
  res.status(404);
  if (req.accepts('html')) {
    res.render('404', { url: req.url, title: '404 - '+config.name });
    return;
  }
  if (req.accepts('json')) {
    res.send(404, config.status['404']);
    return;
  }
  res.type('txt').send('404: Not found');
});
function logErrors(err, req, res, next) {
  console.error(err.stack);
  next(err);
}
function clientErrorHandler(err, req, res, next) {
  if (req.xhr) {
    res.send(500, config.status['500']);
  } else {
    next(err);
  }
}
function errorHandler(err, req, res, next) {
  res.status(500);
  res.render('error', { error: err });
}

// Define what/which mongo to yell at
var mongoUri = process.env.MONGOLAB_URI
                || process.env.MONGOHQ_URL
                || config.mongo.url;
mongoose.connect(mongoUri);

// For Heroku sockets to work
io.configure(function () {
  io.set("transports", ["xhr-polling"]);
  io.set("polling duration", 10);
});

// development only
app.configure('development', function(){
  app.use(express.errorHandler({ showStack: true }));
  var repl = require('repl').start('liverepl> ');
  repl.context.io = io;
  // repl.context.Post = Post;
});

// Set up routes
require('./routes/frontEnd')(app, pass.ensureAuth, io);
require('./routes/backEnd')(app, pass.ensureAuth, io);
require('./routes/api')(app, pass.ensureAuth, io);
require('./routes/io')(app, io);

server.listen(app.get('port'), function(){
  console.log("Express server listening on port %d in %s mode", app.get('port'), app.settings.env);
});

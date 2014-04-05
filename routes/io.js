
/*
 * socket.io routing
 */

var fs = require('fs')
    , config = JSON.parse(fs.readFileSync('./config.json'))
    , passport = require('passport')
    , moment = require('moment')
    , User = require('../models/user');

module.exports = function (app, io) {

  io.sockets.on('connection', function (socket) {
    
    // socket.on('updatePlayer', function (data) {
    //   Bench.updatePlayer(data, io);
    // });

  });

};
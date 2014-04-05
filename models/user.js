/**
  * User: A person, owning data
  *
  */
var mongoose = require('mongoose'),
    Schema = mongoose.Schema,
    troop = require('mongoose-troop'),
    passportLocalMongoose = require('passport-local-mongoose'),
    fs = require('fs'),
    config = JSON.parse(fs.readFileSync('./config.json'));

var User = new Schema({
  username: {type: String, default: ''},
  email: {type: String, required: true},
  emailActive: {type: Boolean, default: true},
  image: {type: String, default: ''},
  admin: { type: Boolean, default: false },
  fullAccess: { type: Boolean, default: false },
  getUpdates: { type: Boolean, default: true },
  key: { type: String, default: ( Math.random().toString(36).substr(2) + Math.random().toString(36).substr(2) ) },
  twitterToken: {type: String},
  twitterTokenSecret: {type: String},
  twitterUid: {type: String},
  twitterName: {type: String},
  accessToken: String,
  provider: String
});

User.plugin(passportLocalMongoose, {usernameField: 'email'});
User.plugin(troop.timestamp);

User.statics.generateRandomToken = function () {
  var user = this,
      chars = "_!abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890",
      token = new Date().getTime() + '_';
  for ( var x = 0; x < 16; x++ ) {
    var i = Math.floor( Math.random() * 62 );
    token += chars.charAt( i );
  }
  return token;
};

module.exports = mongoose.model('User', User);
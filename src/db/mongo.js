//@ts-nocheck
var bluebird = require('bluebird')
var config = require("../config/config");
var mongoose = require("mongoose");
mongoose.Promise = bluebird;



module.exports = {
  database: mongoose,
  connectFunc: function MONGODATABSE(bluebird) {
    return new Promise((resolve, reject) => {
      mongoose.connect(config.DB.MONGO.URL)
      .catch(err => reject(err));
      var db = mongoose.connection;
      db.on("error", err => reject(err));
      db.on("open", _ => resolve(db));
    });
  }
};
// module.exports = function MONGODATABSE(bluebird) {
//   return new Promise((resolve, reject) => {
//     mongoose.connect(config.DB.MONGO.URL);
//     var db = mongoose.connection;
//     db.on("error", err => reject(e));
//     db.on("open", _ => resolve([mongoose, db]));
//   });

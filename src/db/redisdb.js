var config = require("../config/config");
var redis = require("redis");

module.exports = function REDISDATABASE(bluebird) {
  //bluebird.promisifyAll(redis);
  return new Promise((resolve, reject) => {
    var client = redis.createClient(config.DB.REDIS.URL);
    client.auth('d2lyelPupN024z8RLQctozS0YcZhwQkT');
    resolve(client);
    //client.on("error", err => reject(err));
    //client.on("open", () => resolve(client));
  });
}

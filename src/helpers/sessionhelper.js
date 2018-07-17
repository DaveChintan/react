//import { timeout } from "rxjs-compat/operator/timeout";

var rl = require("redlock");
var using = require("bluebird").using;

function SessionHelper(lck) {

  //constructor(lck) {
  this._lck = lck;
  //}

  return {
    Set: (req, key, value, timeOut) => {
      if (!req.session) return;
      using(
        this._lck.disposer(key, timeOut || 1000, err => console.log(err)), inner => {
          req.session[key] = value;
          inner.unlock();
        })
    },

    Remove: (req, key, timeOut) => {
      if (!req.session) return;
      using(
        this._lck.disposer(key, timeOut || 1000, err => console.log(err)), inner => {
          delete req.session[key];
          inner.unlock();
        })
    },

    unlockErrorHandler: (err) => {
      console.error(err);
    },

    Get: (req, key, timeOut) => {
      return new Promise((resolve, reject) => {
        if (!req.session)
          resolve(null);
        else {
          try {
            using(this._lck.disposer(key, timeOut || 1000, err => reject(err)), inner => {
              var value = req.session[key];
              inner.unlock();
              resolve(value);
            })
          }
          catch(err) {
            reject(err);
          }
        }
      });
    }
  }
}

module.exports = SessionHelper

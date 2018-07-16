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
      if (!req.session) return null;
      using(this._lck.disposer(key, timeOut || 1000, err => console.log(err)), inner => {
        var value = req.session[key];
        inner.unlock();
        return Promise.resolve(value);
      })
    }
  }
}

module.exports = SessionHelper

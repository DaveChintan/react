var rl = require("redlock");
var lock = new rl();
var using = require("bluebird").using;

class SessionHelper {
  _lck = lck;

  constructor(lck) {
    this._lck = lck;
  }

  Set = (req, key, value) => {
    if (!req.session) return;
    using(
      this._lck.disposer(key, 1000, inner => {
        req.session[key] = value;
        inner.unlock();
      })
    );
  };
  Remove = (req, key) => {
    if (!req.session) return;
    using(
      this._lck.disposer(key, 1000, inner => {
        delete req.session[key];
        inner.unlock();
      })
    );
  };
  Get = (req, key) => {
    if (!req.session) return null;
    return req.session[key];
  };
}

export default SessionHelper;

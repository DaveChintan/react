var express = require("express");
var passport = require("passport");
var router = express.Router();

router.post("/callback", function(req, res, next) {
  passport.authenticate(
    "azuread-openidconnect",
    {
      response: res,
      session: false
    },
    (err, user, info) => {
      if (err) res.render("index", { err: err });
      else {
        req.session.user = user;
        res.redirect("/");
      }
    }
  )(req, res, next);
});

router.post("/validatetoken", async function(req, res, next) {
  passport.authenticate(
    "bearer",
    { session: false },
    async (err, user, info) => {
      const email = req.body.email;
      req.client.get(email, async function(err, reply) {
        const data = JSON.parse(reply);
        const profile = data.profile;
        const cachedToken = data.oauthToken;
        var oho = req.oauth2.accessToken.create(cachedToken);
        const oauthToken = await oho.refresh();
        await req.client.set(profile["email"], { profile, oauthToken });
        res.json({ success: true, token: oauthToken.accessToken });
      });
    }
  )(req, res, next);
});

module.exports = router;

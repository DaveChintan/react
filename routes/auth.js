var express = require("express");
var passport = require("passport");
var axios = require("axios");
const querystring = require("querystring");
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
        if (err) {
          res.json({ success: false, err: err });
          return;
        }
        const data = JSON.parse(reply);
        const profile = data.profile;
        const cachedToken = data.oauthToken;
        var oho = req.oauth2.accessToken.create(cachedToken.token);
        var payload = {
          client_id: process.env.clientID,
          client_secret: process.env.clientSecret,
          grant_type: "refresh_token",
          refresh_token: oho.token.refresh_token,
          scope: oho.token.scope
        };
        var what = querystring.stringify(payload);
        axios.default
          .post(
            "https://login.microsoftonline.com/common/oauth2/v2.0/token",
            what,
            {
              headers: {
                "Content-Type": "application/x-www-form-urlencoded"
              }
            }
          )
          .then(ress => {
            const t = ress.data;
            req.client.get(email, (err, reply) => {
              var cachedCredentials = JSON.parse(reply);
              var newToken = { ...cachedCredentials.oauthToken.token, ...t };
              cachedCredentials.oauthToken.token = newToken;
              req.client.set(
                "email",
                JSON.stringify({
                  profile: cachedCredentials.profile,
                  oauthToken: cachedCredentials.oauthToken
                }),
                err => {
                  if (err) {
                    res.json({ success: false, err: err });
                  } else {
                    res.json({ success: true, data: t.access_token });
                  }
                }
              );
            });
          })
          .catch(err => {
            res.json({ success: false, err: err });
          });
        //await req.client.set(profile["email"], { profile, oauthToken });
        //res.json({ success: true, token: oauthToken.accessToken });
      });
    }
  )(req, res, next);
});

module.exports = router;

const express = require("express");
const router = express.Router();
const graph = require("../graph");
const passport = require("passport");

// router.use(function (req, res, next) {
//     passport.authenticate('bearer'), function (req, res) {
//         req.token = req.user;
//     }
// });

router.post(
  "/",
  passport.authenticate("bearer", { session: false }),
  async (req, res, next) => {
    let query = req.body.query;
    const token = req.user;
    //let query = req.param("query");
    graph
      .getMessages(token, query)
      .then(messages => {
        res.json({ success: true, data: messages });
      })
      .catch(err => {
        res.json({ success: true, data: err });
      });
  }
);

module.exports = router;

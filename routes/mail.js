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
        res.json({ success: false, data: err });
      });
  }
);

router.get(
  "/folders",
  passport.authenticate("bearer", { session: false }),
  async (req, res, next) => {
    const token = req.user;
    let id = req.param("id", "0");
    graph
      .getMailFolders(token)
      .then(folders => {
        res.json({ success: true, data: folders });
      })
      .catch(err => {
        res.json({ success: false, data: err });
      });
  }
);

router.get(
  "/:id",
  passport.authenticate("bearer", { session: false }),
  async (req, res, next) => {
    const token = req.user;
    let id = req.param("id", "0");
    graph
      .getMessage(token, id)
      .then(messages => {
        res.json({ success: true, data: messages });
      })
      .catch(err => {
        res.json({ success: false, data: err });
      });
  }
);

router.patch(
  "/:id",
  passport.authenticate("bearer", { session: false }),
  async (req, res, next) => {
    const token = req.user;
    const body = req.body;
    let id = req.param("id", "0");
    graph
      .updateMessage(token, id, body)
      .then(result => {
        res.json({ success: true, data: result });
      })
      .catch(err => {
        res.json({ success: false, data: err });
      });
  }
);

module.exports = router;

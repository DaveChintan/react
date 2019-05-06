const express = require('express');
const router = express.Router();
const graph = require('../graph');
const passport = require('passport');

// router.use(function (req, res, next) {
//     passport.authenticate('bearer'), function (req, res) {
//         req.token = req.user;
//     }
// });

router.get('/', passport.authenticate('bearer', { session: false }), async (req, res, next) => {
    const token = req.user;
    graph.getMessages(token).then(messages => { 
        res.json({ success: true, data: messages });
    }).catch(err => {
        res.json({ success: true, data: err });
    });
    
});

module.exports = router;

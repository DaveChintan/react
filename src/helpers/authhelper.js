exports.authenticate = function (req, res, next) {
    if (req.session == null) {
        if (req.xhr) {
            res.sendStatus(404);
        }
        else {
            res.redirect('/');
        }
    }
    else {
        req.isAuthenticated = true;
    }
};

exports.restrict = function (req, res, next) {
    if (req.session == null || !req.session.user) {
        if (req.xhr) {
            res.sendStatus(404);
        }
        else {
            res.redirect('/');
        }
    }
    else {
        req.isAuthenticated = true;
        next();
    }
};
exports.isModerator = function isModerator(req, res, next) {
    if (!res.locals.game) return next();
    if (res.locals.game.moderatorSID==req.sessionID) res.locals.isModerator = true;
    else res.locals.isModerator = false;
    next();
};
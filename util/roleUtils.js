const db = require('./db.js');
const playerUtils = require('./playerUtils.js');
            
const dailyPowerRoles = ["Werewolf", "Seer", "Apprentice Seer", "Bump"]
exports.resetPower = function resetPower(req, res, next) {
    if (!res.locals.game) return next(new Error("game doesn't exist"));
    if (res.locals.game.phase!="Movement") return next();
    console.log("Refreshing Powers");
    let roleQuery = `role="${dailyPowerRoles[0]}"`
    for (let i = 1; i < dailyPowerRoles.length; i++ ) {
        roleQuery += ` OR role="${dailyPowerRoles[i]}"`
    }
    
    db.run(`UPDATE players SET canPower=? WHERE roomCode=? AND (${roleQuery});`,
        [1, res.locals.game.roomCode],
        (err) => {
            if (err) return next(err);
            next();
        }
    )
}
            
exports.usePower = function usePower(req, res, next) {
    if (!res.locals.game) return next(new Error("game doesn't exist"));
    console.log("Attempting Power");
    if (res.locals.player && res.locals.player.canPower==0) {
        res.locals.alert = "Already used power";
        return next();
    }
    console.log("Using power");
    db.run("UPDATE players SET canPower=canPower-1 WHERE roomCode=? AND sessionID=?;",
        [res.locals.game.roomCode, req.sessionID], 
        (err) => {
            if (err) return next(err);
            next();
        });
}

exports.attackPlayer = function attackPlayer(req, res, next) {
    if (!res.locals.game) return next(new Error("game doesn't exist"));
    if (res.locals.alert) {
        console.log(res.locals.alert);
        return next();
    }
    console.log("Attacking");
    db.run("UPDATE players SET attacks=attacks+1 WHERE id=?;",
        [req.params.targetID],
        (err) => {
            if (err) return next(err);
            next();
        }
    )
}

exports.resolveAttacks = function resolveAttacks(req, res, next) {
    if (!res.locals.game) return next(new Error("game doesn't exist"));
    if (res.locals.game.phase!="Night") return next();
    console.log("Resolving Attacks");

    db.run("UPDATE players SET log=json_insert(log, '$[#]', ?) WHERE attacks>?;",
        ["You were attacked in the night", 0],
        (err) => {
            if (err) {
                console.log(err);
            }
        }
    )

    next();
}
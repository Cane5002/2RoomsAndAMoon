const db = require('./db.js');
const Game = require('../public/classes/game.js');
const playerUtils = require('./playerUtils.js');

exports.getGame = function getGame(req, res, next) {
    let roomCode;
    if (req.params.roomCode) roomCode = req.params.roomCode;
    if (req.body.roomCode) roomCode = req.body.roomCode;
    db.get("SELECT * FROM games WHERE roomCode=?;", 
    roomCode, 
    (err, row) => {
        if (err) return next(err);
        
        if (!row) return res.redirect('/join');
        
        res.locals.game = new Game(row);
        next();
    })
}
    
exports.addGame = function addGame(req, res, next) {

    db.run("INSERT INTO games (roomCode, moderatorSID, roomCnt, playerCnt, roles, started, phase, nullVotes, vVotes, wVotes) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?);",
        [req.body.roomCode, req.sessionID, req.body.roomCnt, req.body.playerCnt, JSON.stringify(req.body.roles), 0, 0, JSON.stringify(new Array(req.body.roomCnt).fill(0)), 0, 0],
        (err) => {
            if (err) {
                if (err.errno == 19) {
                    res.locals.success = false;
                    return next();
                }
                return next(err);
            }
            res.locals.success = true;
            next();
        });
};

exports.deleteGame = function deleteGame(req, res, next) {
    if (!res.locals.game) return next(new Error("game doesn't exist"));
    db.run("DELETE FROM games WHERE roomCode=?;",
        [res.locals.game.roomCode],
        (err) => {
            if (err) return next(err);
            next();
        })
}

const Roles = new Map([
    ["Werewolf", 1],
    ["Seer", 1],
    ["Village", 0],
]);
exports.startGame = function startGame(req, res, next) {
    if (!res.locals.game) return next(new Error("game doesn't exist"));
    console.log("Started? " + res.locals.game.started);
    if (res.locals.game.started) return next();
    console.log("Starting game...")
    db.run("UPDATE games SET started=? WHERE roomCode=?;",
        [true, res.locals.game.roomCode],
        (err) => {
            if (err) return next(err);

            console.log("assigning roles");

            let players = playerUtils.initPlayerData(res.locals.players, res.locals.game.roles);
            console.log("Init players...")
            console.log(players);
            players.forEach(p => {
                console.log(`Assinging ${p.id}: ${p.role}`)
                db.run("UPDATE players SET role=? WHERE id=?",
                    [p.role, p.id],
                    (err) => {
                        if(err) {
                            console.log(err);
                            return next(err);
                        } 
                        if (p.role.includes("[Hidden]")) playerUtils.logPlayer(p.id, `My role: Villager`);
                        else playerUtils.logPlayer(p.id, `My role: ${p.role}`);
                        next();
                    });
            });

            console.log(res.locals.game.roles);
            let log = "Roles:\n"
            let cur = ""
            let cnt = 0;
            res.locals.game.roles.forEach((r) => {
                if(r!=cur) {
                    if (cnt!=0) log += `${cnt}x ${cur}\n`
                    cur = r;
                    cnt =1;
                }
                else cnt++;
            })
            if (cnt!=0) log += `${cnt}x ${cur}\n`
            playerUtils.logRoom(res.locals.game.roomCode, log)
        })

}

exports.nextPhase = function nextPhase(req, res, next) {
    if (!res.locals.game) return next(new Error("game doesn't exist"));
    db.run("UPDATE games SET phase=phase+1 WHERE roomCode=?;",
        [res.locals.game.roomCode],
        (err) => {
            if (err) {
                console.log(err);
                return next(err);
            }
            next();
        })
}

exports.pollV = function pollV(req, res, next) {
    if (!res.locals.game) return next(new Error("game doesn't exist"));
    if (res.locals.player && !res.locals.player.canVote) {
        res.locals.alert = "Already voted";
        return next();
    }
    db.run("UPDATE games SET vVotes=vVotes+1 WHERE roomCode=?;",
        [res.locals.game.roomCode],
        (err) => {
            if (err) {
                console.log(err);
                return next(err);
            }
    })
    db.run("UPDATE players SET canVote=? WHERE roomCode=? AND sessionID=?;",
        [false, res.locals.game.roomCode, req.sessionID],
        (err) => {
            if (err) return next(err);
            next();
        }
    )

}

exports.pollW = function pollW(req, res, next) {
    if (!res.locals.game) return next(new Error("game doesn't exist"));
    if (res.locals.player && !res.locals.player.canVote) {
        res.locals.alert = "Already voted";
        return next();
    }
    db.run("UPDATE games SET wVotes=wVotes+1 WHERE roomCode=?;",
        [res.locals.game.roomCode],
        (err) => {
            if (err) {
                console.log(err);
                return next(err);
            }
    })
    db.run("UPDATE players SET canVote=? WHERE roomCode=? AND sessionID=?;",
        [false, res.locals.game.roomCode, req.sessionID],
        (err) => {
            if (err) return next(err);
            next();
        }
    )
}
const fs = require('fs');
const db = require('./db.js');
const Player = require('../public/classes/player.js');

exports.getPlayer = function getPlayer(req, res, next) {
    console.log("Getting player")
    if (!res.locals.game) return next(new Error("game doesn't exist"));
    db.get("SELECT * FROM players WHERE roomCode=? AND sessionID=?;",
        [res.locals.game.roomCode, req.sessionID],
        (err, row) => {
            if (err) {
                console.log(err);
                return next(err);
            }
            if (row) {
                res.locals.player = new Player(row);
            }
            next();
        });
}
    
exports.getPlayers = function getPlayers(req, res, next) {
    var players = [];
    let roomCode;
    if (res.locals.game) roomCode = res.locals.game.roomCode;
    if (req.params.roomCode) roomCode = req.params.roomCode;
    if (req.body.roomCode) roomCode = req.body.roomCode;
    db.all("SELECT * FROM players WHERE roomCode=?;",
        roomCode,
        (err, rows) => {
            if (err) return next(err);
            if (rows) {
                rows.forEach((row) => {
                    players.push(new Player(row));
                });
            }
            res.locals.players = players;
            next();
        }
    );
}

exports.addPlayer = function addPlayer(req, res, next) {
    console.log("Adding Player");
    if (!res.locals.game) {
        res.locals.alert = "Room \"" + req.body.roomCode + "\" doesn't exist";
        return next();
    }
    if (isPlayer(req.sessionID, res.locals.players)) {
        console.log("Already a player");
        return next();
    }
    console.log("current: " + res.locals.players.length + " | max: " + res.locals.game.playerCnt)
    if (res.locals.players.length==res.locals.game.playerCnt) {
        res.locals.alert = "Room full";
        return next();
    }
    db.run("INSERT INTO players (sessionID, roomCode, name, room, log, alive, canVote, canPower, canSus, attacks, votes, voteTarget, susses, destination, flags) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);",
        [req.sessionID, req.body.roomCode, req.body.name, 1, '[]', true, true, 1, 3, 0, 0, "None", 0, -1, 0],
        (err) => {
            if (err) return next(err);
            next();
        }
    );
}

    function isPlayer(sid, players) {
        if (players.find(p => p.sessionID == sid)) return true;
        return false;
    }
    
exports.initPlayerData = function initPlayerData(players, roles) {
    let shuffledRoles = shuffle(roles)
    
    players.forEach((p, i) => {
        p.role = shuffledRoles[i];
    })
    
    return players;
}

function shuffle(array) {
    let shuffled = []
    for (let i = (array.length-1); i >= 0; i--) {
        let index = randomNumber(i)
        shuffled.push(array[index])
        array.splice(index, 1)
    }
    
    return shuffled;
}

exports.removePlayer = function removePlayer(req, res, next) {
    db.run("DELETE FROM players WHERE id=?;",
        [req.params.playerId],
        (err) => {
            if (err) return next(err);
            next();
        }
    );
}
    
exports.deletePlayers = function deletePlayers(req, res, next) {
    if (!res.locals.game) return next(new Error("game doesn't exist"));
    db.run("DELETE FROM players WHERE roomCode=?;",
        [res.locals.game.roomCode],
        (err) => {
            if (err) return next(err);
            next();
        }
    );
}

exports.setDestination = function setDestination(req, res, next) {
    if (!res.locals.game) return next(new Error("game doesn't exist"));
    console.log("Setting Destination");
    db.run("UPDATE players SET destination=? WHERE roomCode=? AND sessionID=?;",
        [req.params.dest, res.locals.game.roomCode, req.sessionID],
        (err) => {
            if (err) {
                console.log(err);
                return next(err);
            }
            exports.logSession(res.locals.game.roomCode, req.sessionID, `Moving to room ${req.params.dest}`);
            next();
        }
    )
}

exports.susPlayer = function susPlayer(req, res, next) {
    if (!res.locals.game) return next(new Error("game doesn't exist"));
    if (res.locals.player && res.locals.player.canSus==0) {
        res.locals.alert = "Already Sussed";
        return next();
    }
    db.run("UPDATE players SET susses=susses+1 WHERE id=?;",
        [req.params.targetID],
        (err) => {
            if (err) return next(err);
        }
    )
    db.run("UPDATE players SET canSus=canSus-1 WHERE roomCode=? AND sessionID=?;",
        [res.locals.game.roomCode, req.sessionID],
        (err) => {
            if (err) return next(err);
            next();
        }
    )
}

exports.votePlayer = function votePlayer(req, res, next) {
    if (!res.locals.game) return next(new Error("game doesn't exist"));
    if (res.locals.player && !res.locals.player.canVote) {
        res.locals.alert = "Already voted";
        return next();
    }
    if (req.params.targetID==-1) {
        console.log(`Voting to sleep in room ${res.locals.player.room}`);
        let query = (`UPDATE games SET nullVotes=JSON_replace(nullVotes, '$[${res.locals.player.room-1}]', JSON_extract(nullVotes,'$[${res.locals.player.room-1}]')+1) WHERE roomCode='${res.locals.game.roomCode}';`)
        // db.run("UPDATE games SET nullVotes=JSON_replace(nullVotes, '$[?]', JSON_extract(nullVotes,'$[?]')+1) WHERE roomCode=?;",
        db.run(query,
            // [res.locals.player.room-1, res.locals.player.room-1, res.locals.game.roomCode],
            (err) => {
                if (err) return next(err);
                console.log("Sucess");
            }
        )
    }
    else { 
        console.log("Voting for player");
        db.run('UPDATE players SET votes=votes+1 WHERE id=? AND role!="Prince" AND role!="[Hidden]Prince";',
            [req.params.targetID],
            (err) => {
                if (err) return next(err);
                console.log("Sucess");
            }
        )
    }
    db.run("UPDATE players SET canVote=?, voteTarget=? WHERE roomCode=? AND sessionID=?;",
        [false, req.body.targetName, res.locals.game.roomCode, req.sessionID],
        (err) => {
            if (err) return next(err);
            next();
        }
    )
}

const Statuses = new Map([
    ["Lost", 1<<0],
]);
exports.setPlayerStatus = function setPlayerStatus(req, res, next) {
    if (!res.locals.game) return next(new Error("game doesn't exist"));
    console.log(`Setting Status ${req.body.status}:${Statuses.get(req.body.status)}`);
    
    db.run("UPDATE players SET flags=(flags|?) WHERE id=?;",
        [Statuses.get(req.body.status), req.params.targetID],
        (err) => {
            if (err) {
                console.log(err);
                return next(err);
            } 
            console.log("Success");
            next();
        }
    )
}
exports.clearPlayerStatus = function setPlayerStatus(req, res, next) {
    if (!res.locals.game) return next(new Error("game doesn't exist"));
    console.log("Clearing Status");
    
    db.run("UPDATE players SET flags=flags&(~?) WHERE id=?;",
        [Statuses.get(req.body.status), req.params.targetID],
        (err) => {
            if (err) {
                console.log(err);
                return next(err);
            } 
            console.log("Success");
            next();
        }
    )
}

exports.movePlayers = function movePlayer(req, res, next) {
    if (!res.locals.game) return next(new Error("game doesn't exist"));
    if (res.locals.game.phase!="Movement") return next();
    console.log("Moving players");
    db.run("UPDATE players SET room=destination, destination=-1 WHERE roomCode=? AND destination!=-1;",
        [res.locals.game.roomCode],
        (err) => {
            if (err) {
                console.log(err);
                return next(err);
            } 
            console.log("Success");
            next();
        }
    )
}

exports.shufflePlayers = function movePlayer(req, res, next) {
    if (!res.locals.game) return next(new Error("game doesn't exist"));
    console.log("Shuffling players");
    let shuffledPlayers = shuffle(res.locals.players)
    
    console.log(shuffledPlayers);
    for (let i = 0; i < shuffledPlayers.length; i++) {
        console.log(`${shuffledPlayers[i]} to ${(i%res.locals.game.roomCnt)+1}`)
        setRoom(shuffledPlayers[i].id, (i%res.locals.game.roomCnt)+1);
    }
    console.log("Success");
    next();
}
function setRoom(pid, room) {
    db.run("Update players Set room=? WHERE id=?",
        [room, pid],
        (err) => {
            if (err) {
                console.log(err);
            } 
        }
    )
}
                
exports.resetPlayers = function resetPlayers(req, res, next) {
    if (!res.locals.game) return next(new Error("game doesn't exist"));
    if (res.locals.game.phase!="Discussion") return next();
    console.log("Resetting Players");
    db.run("UPDATE players SET attacks=?, votes=?, canVote=?, voteTarget=? WHERE roomCode=? AND alive=?;",
        [0, 0, true, "None", res.locals.game.roomCode, true],
        (err) => {
            if (err) {
                console.log(err);
                return next(err);
            } 
            console.log("Success");
        }
    )
    db.run("UPDATE games SET nullVotes=? WHERE roomCode=?",
        [JSON.stringify(new Array(res.locals.game.roomCnt).fill(0)), res.locals.game.roomCode],
        (err) => {
            if (err) {
                console.log(err);
                return next(err);
            } 
            console.log("Success");
            next();
        }
    )
}

exports.killPlayer = function killPlayer(req, res, next) {
    if (!res.locals.game) return next(new Error("game doesn't exist"));
    db.run("UPDATE players SET alive=?, canVote=? WHERE id=?;",
        [false, true, req.params.targetID],
        (err) => {
            if (err) {
                console.log(err);
                return next(err);
            }
            exports.logPlayer(req.params.targetID, "I've been killed :(");
            next();
        }
    )
}

exports.logPlayer = function logPlayer(playerID, msg) {
    db.run("UPDATE players SET log=json_insert(log, '$[#]', ?) WHERE id=?;",
        [msg, playerID],
        (err) => {
            if (err) {
                console.log(err);
            }
        }
    )
}

exports.logRoom = function logRoom(roomCode, msg) {
    db.run("UPDATE players SET log=json_insert(log, '$[#]', ?) WHERE roomCode=?;",
        [msg, roomCode],
        (err) => {
            if (err) {
                console.log(err);
            }
        }
    )
}

exports.logSession = function logSession(roomCode, sessionID, msg) {
    db.run("UPDATE players SET log=json_insert(log, '$[#]', ?) WHERE roomCode=? AND sessionID=?;",
        [msg, roomCode, sessionID],
        (err) => {
            if (err) {
                console.log(err);
            }
        }
    )
}

exports.logRole = function logRole(role, msg) {
    db.run("UPDATE players SET log=json_insert(log, '$[#]', ?) WHERE role=?;",
        [msg, role],
        (err) => {
            if (err) {
                console.log(err);
            } 
        }
    )
}

function randomNumber(max) {
    return Math.floor(Math.random() * max)
}
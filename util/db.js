const sqlite3 = require('sqlite3');
const mkdirp = require('mkdirp');

mkdirp.sync('var/db');

var db = new sqlite3.Database('var/db/werewolfx.db');

db.serialize(function() {
    // create db schema
    db.run("CREATE TABLE IF NOT EXISTS games ( \
        roomCode TEXT PRIMARY KEY, \
        moderatorSID TEXT, \
        roomCnt INTEGER, \
        playerCnt INTEGER, \
        roles TEXT, \
        started INTEGER, \
        phase INTEGER, \
        nullVotes INTEGER, \
        vVotes INTEGER, \
        wVotes INTEGER \
        );")
    
    db.run("CREATE TABLE IF NOT EXISTS players ( \
        id INTEGER PRIMARY KEY, \
        sessionID TEXT NOT NULL, \
        roomCode TEXT NOT NULL, \
        name TEXT NOT NULL, \
        room INTEGER NOT NULL, \
        role TEXT, \
        log TEXT, \
        alive INTEGER NOT NULL, \
        canVote INTEGER NOT NULL, \
        canPower INTEGER NOT NULL, \
        canSus INTEGER NOT NULL, \
        attacks INTEGER NOT NULL, \
        votes INTEGER NOT NULL, \
        susses INTEGER NOT NULL, \
        destination INTEGER \
        );")
});

module.exports = db;
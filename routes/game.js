var express = require('express');
var router = express.Router();
var gameUtils = require('../util/gameUtils');
var playerUtils = require('../util/playerUtils');
var roleUtils = require('../util/roleUtils.js');
var modUtils = require('../util/moderatorUtils');

router.get('/', (req, res) => {
    if (res.locals.game) {
        if (res.locals.game.started) {
            res.redirect(`/${res.locals.game.roomCode}/village`);
        }
        else {
            res.render('lobby', { game: res.locals.game });
        }
    }
    else res.redirect('/join');
})

router.post('/start', playerUtils.getPlayers, gameUtils.startGame, (req, res) => {
    console.log("posted")
    res.status(201).send();
});

var streamRouter = require('./stream');
router.use('/stream', streamRouter);

router.get('/village', playerUtils.getPlayer, modUtils.isModerator, (req, res) => {
    if (res.locals.isModerator) res.redirect(`/${res.locals.game.roomCode}/moderator`);
    if (!res.locals.player) res.redirect('/');
    res.render('game/village', {    playerID: res.locals.player.id,
                                    roomNum: res.locals.player.room, 
                                    roomCode: res.locals.game.roomCode,
                                    dayCnt: res.locals.game.dayCnt,
                                    phase: res.locals.game.phase
                                }
    );
})

router.get('/moderator', modUtils.isModerator, (req, res) => {
    if (!res.locals.isModerator) res.redirect(`/${res.locals.game.roomCode}/village`);
    res.render('game/moderator', {  roomCode: res.locals.game.roomCode,
                                    roomCnt: res.locals.game.roomCnt,
                                    dayCnt: res.locals.game.dayCnt,
                                    phase: res.locals.game.phase
                                }
    );
}) 

router.put('/phase', gameUtils.nextPhase, playerUtils.movePlayers, playerUtils.resetPlayers, roleUtils.resetPower, roleUtils.resolveAttacks, (req, res) => {
// router.put('/phase', gameUtils.nextPhase, playerUtils.movePlayers, (req, res) => {
    console.log(`Ending ${res.locals.game.phase}`);
    if (res.locals.game.phase=="Night") playerUtils.logRoom(res.locals.game.roomCode, `Day ${res.locals.game.dayCnt+1}`);
    res.status(201).send();
})

router.put('/move/:dest', playerUtils.setDestination, (req, res) => {
    console.log("Moved");
    res.status(201).send();
})

router.put('/sus/:targetID', playerUtils.getPlayer, playerUtils.susPlayer, (req, res) => {
    console.log("Sussed");
    res.status(201).send();
})

router.put('/vote/:targetID', playerUtils.getPlayer, playerUtils.votePlayer, (req, res) => {
    console.log("Voting");
    res.status(201).send();
})

router.put('/pollV', playerUtils.getPlayer, gameUtils.pollV, (req, res) => {
    console.log("Voting");
    res.status(201).send();
})
router.put('/pollW', playerUtils.getPlayer, gameUtils.pollW, (req, res) => {
    console.log("Voting");
    res.status(201).send();
})

router.put('/kill/:targetID', playerUtils.killPlayer, (req, res) => {
    console.log("Killing Player");
    res.status(201).send();
})

var roleRouter = require('./roles');
router.use('/role', playerUtils.getPlayer, roleUtils.usePower, roleRouter);

router.delete('/player/:playerId', playerUtils.removePlayer, (req, res) => {
    res.status(201).send();
})

router.delete('/endGame', playerUtils.deletePlayers, gameUtils.deleteGame, (req, res) => {
    res.status(201).send();
})

module.exports = router;
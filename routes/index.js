var express = require('express');
var router = express.Router();
var gameUtils = require('../util/gameUtils');
var playerUtils = require('../util/playerUtils');

router.get('/', (req, res) => {
    res.render('index');
});

router.get('/create', (req, res) => {
    res.render('create-game');
});
router.post('/create', gameUtils.addGame, (req, res) => {
    res.status(201).json({ success: res.locals.success, roomCode: req.body.roomCode });;
});

router.get('/join', (req, res) => {
    res.render('join-game');
});
router.post('/join', gameUtils.getGame, playerUtils.getPlayers, playerUtils.addPlayer, (req, res) => {
    res.status(201).json( { alert: res.locals.alert } );
})

router.get('/test', (req, res) => {
    res.render('game/testVillage')
})

router.get('/test/moderator', (req, res) => {
    res.render('game/testModerator')
})

var gameRouter = require('./game');
router.use('/:roomCode', gameUtils.getGame, gameRouter);

module.exports = router;
var express = require('express');
var router = express.Router();
var gameUtils = require('../util/gameUtils.js');
var playerUtils = require('../util/playerUtils.js');

router.get('/lobby', (req, res) => {
    console.log('Player Stream connection opened');
    
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Access-Control-Allow-Origin', '*');
    req.body = { roomCode: res.locals.game.roomCode };

    const playerInterval = setInterval(() => {
        gameUtils.getGame(req, res, ()=>{return});
        playerUtils.getPlayers(req, res, ()=> {return});
        res.write('data: ' + JSON.stringify({ players: res.locals.players,
                                              started: res.locals.game.started }) + '\n\n');
    }, 1000);

    res.on('close', () => {
        console.log('Player Stream connection closed');
        clearInterval(playerInterval);
        res.end();
    });
})

router.get('/game', (req, res) => {
    console.log('Start Stream connection opened');
    
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Access-Control-Allow-Origin', '*');
    req.body = { roomCode: res.locals.game.roomCode };

    const playerInterval = setInterval(() => {
        gameUtils.getGame(req, res, ()=> {return});
        playerUtils.getPlayers(req, res, ()=> {return});
        res.write('data: ' + JSON.stringify({ players: res.locals.players,
                                              game: res.locals.game }) + '\n\n');
    }, 1000);

    res.on('close', () => {
        console.log('Start Stream connection closed');
        clearInterval(playerInterval);
        res.end();
    });
})

module.exports = router;
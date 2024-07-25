var express = require('express');
var router = express.Router();
var db = require('../util/db');
var playerUtils = require('../util/playerUtils');
var gameUtils = require('../util/gameUtils');
var roleUtils = require('../util/roleUtils.js');

router.put('/attack/:targetID', roleUtils.attackPlayer, (req, res) => {
    console.log("Attacked");
    res.status(201).send();
})

router.put('/seer/:targetID', playerUtils.getPlayers, (req, res) => {
    if (res.locals.alert) {
        console.log(res.locals.alert);
        return next();
    }
    console.log("Seering");
    let target = res.locals.players.find(p => p.id==req.params.targetID)
    let wwBool = false;
    if (target) wwBool = (target.role=="Werewolf" || target.role.replace("[Hidden]", "")=="Lycan");
    playerUtils.logPlayer(res.locals.player.id, `${target.name} is ${wwBool ? "" : "not "} a Werewolf`);

    let apSeer = res.locals.players.find(p => p.role=="Apprentice Seer");
    if (apSeer && res.locals.player.room == apSeer.room) playerUtils.logPlayer(apSeer.id, `${target.name} is ${wwBool ? "" : "not "} a Werewolf`);

    res.status(201).send();
})

router.get('/count/:room', playerUtils.getPlayers, (req, res) => {
    if (res.locals.alert) {
        console.log(res.locals.alert);
        return next();
    }
    console.log("Counting");
    let count = res.locals.players.filter((p) => ((p.role=="Werewolf" || p.role.replace("[Hidden]", "")=="Lycan") && p.alive && p.room==req.params.room)).length;
    playerUtils.logPlayer(res.locals.player.id, `There are ${count} Werewolves`);

    if (res.locals.player.role=="Apprentice Seer") {
        let seer = res.locals.players.find(p => p.role=="Seer");
        if (seer && res.locals.player.room == seer.room) playerUtils.logPlayer(seer.id, `There are ${count} Werewolves`);
    }

    res.status(201).send();
})

router.put('/sorcerer/:targetID', playerUtils.getPlayers, (req, res) => {
    if (res.locals.alert) {
        console.log(res.locals.alert);
        return next();
    }
    console.log("Sorcering");
    let target = res.locals.players.find(p => p.id==req.params.targetID)
    let seerBool = false;
    if (target) seerBool = (target.role=="Seer");
    playerUtils.logPlayer(res.locals.player.id, `${target.name} is ${seerBool ? "" : "not "} the Seer`);

    res.status(201).send();
})

router.put('/bump/:targetID', (req, res) => {
    if (res.locals.alert) {
        console.log(res.locals.alert);
        return next();
    }
    console.log("Bumping");
    playerUtils.logPlayer(req.params.target, "I was bumped :o");
    res.status(201).send();
})

router.put('/setStatus/:targetID', playerUtils.setPlayerStatus, (req, res) => {
    console.log(`Set status ${req.body.status}`);
    res.status(201).send();
})

router.put('/clearStatus/:targetID', playerUtils.clearPlayerStatus, (req, res) => {
    console.log(`Cleared status ${req.body.status}`);
    res.status(201).send();
})

module.exports = router;
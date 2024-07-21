const PHASES = ["Movement", "Night", "Discussion", "Voting"];
class Game {
    constructor(game) {
        this.roomCode = game.roomCode
        this.moderatorSID = game.moderatorSID
        this.roomCnt = game.roomCnt;
        this.playerCnt = game.playerCnt
        this.roles = JSON.parse(game.roles)
        this.started = (game.started == 1 ? true : false);
        this.dayCnt = Math.floor((game.phase+2)/4);
        this.phase = PHASES[game.phase%4];
        this.nullVotes = game.nullVotes;
        this.vVotes = game.vVotes;
        this.wVotes = game.wVotes;
    }
}

module.exports = Game;

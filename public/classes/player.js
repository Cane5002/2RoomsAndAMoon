class Player {
    constructor(player) {
        this.id = player.id
        this.sessionID = player.sessionID
        this.roomCode = player.roomCode
        this.name = player.name
        this.room = player.room
        this.role = player.role
        this.log = JSON.parse(player.log);
        this.alive = (player.alive == 1 ? true: false);
        this.canVote = (player.canVote == 1 ? true : false);
        this.canPower = player.canPower
        this.canSus = player.canSus;
        this.attacks = player.attacks;
        this.votes = player.votes;
        this.susses = player.susses;
        this.destination = player.destination;
    }
}

module.exports = Player;

const script = document.getElementById('villageScript');
const roomCode = script.getAttribute('roomCode');
var players = [];
var game;

console.log(`RC:${roomCode}`)

const villageStream = new EventSource(`http://werewolfx.com/${roomCode}/stream/game`);

villageStream.onmessage = function (ev) {
    let data = JSON.parse(ev.data);
    if (data.game && (!game || game!=data.game)) {
        if (data.players) updatePlayers(data.players);
        updateGame(data.game);
    }
    else if (data.players && (!players || players!=data.players)) updatePlayers(data.players);
}

villageStream.onerror = function () {
    console.log("Village Stream error: Closing...");
    villageStream.close();
}

let nextPhaseBtn = document.getElementById('nextPhaseBtn');
nextPhaseBtn.addEventListener('click', function () {
    nextPhase()
    .then(() => {
        console.log("Phase++");
    })
});
async function nextPhase() {
    let response = fetch(`/${roomCode}/phase`, {
        method: "PUT",
        headers: {
            "Content-Type": "application/json"
        }
    });
    return response;
}

const villagesContainer = document.getElementById('villages');
function updatePlayers(players_) {
    removeChildNodes(villagesContainer);

    let villages = [];
    for (let i = 1; i <= game.roomCnt; i++) {
        villages.push(createVillage(i));
    }
    players = players_;
    players.forEach((p) => {
        addPlayer(villages[p.room-1], p);
    })
    
    updateWWCnt();
}

function createVillage(i) {
    let village = document.createElement('div');
    village.setAttribute("class","village");

    let h2 = document.createElement('h2');
    h2.textContent = `Village ${i}`;
    village.appendChild(h2);

    let h3 = document.createElement('h3');
    h3.textContent = `${game.nullVotes[i-1]} votes for sleep`;
    village.appendChild(h3);

    let pList = document.createElement('div');
    pList.setAttribute("class", "playerList");
    pList.setAttribute("id", `playerList${i}`);
    village.appendChild(pList);
    villagesContainer.appendChild(village);
    return pList;
}

function addPlayer(pList, player_) {
    let playerDiv = document.createElement('div');
    if (player_.alive) playerDiv.setAttribute("class", "player");
    else playerDiv.setAttribute("class", "deadPlayer");
    playerDiv.textContent = `(${player_.susses} sus) ${player_.name}(${player_.role}): ${player_.votes} votes | ${player_.attacks} attacks` 
    
    let removePlayerBtn = document.createElement('button');
    removePlayerBtn.textContent = "kill";
    removePlayerBtn.addEventListener('click', function() {
        killPlayer(player_.id).then(() => {
            console.log("removed player");
        })
    });
    playerDiv.appendChild(removePlayerBtn);
    pList.appendChild(playerDiv);
}

async function removePlayer(playerId) {
    let response = await fetch(`/${roomCode}/player/${playerId}`, {
        method: "DELETE",
        headers: {
            "Content-Type": "application/json"
        }
    });
    return response;
}
async function killPlayer(playerId) {
    let response = await fetch(`/${roomCode}/kill/${playerId}`, {
        method: "PUT",
        headers: {
            "Content-Type": "application/json"
        }
    });
    return response;
}

function removeChildNodes(parent) {
    if(!parent.firstChild) return;
    while(parent.firstChild) {
        parent.removeChild(parent.firstChild);
    }
}

function updateGame(game_) {
    game = game_;
    updateDayCnt();
    updatePoll();
}

const bg = document.getElementById("bg");
const moonImg = document.getElementById('night');
const sunImg = document.getElementById('day');
const dayCnt = document.getElementById('dayCnt');
const phaseDiv = document.getElementById('phase');
function updateDayCnt() {
    bg.setAttribute("class", game.phase == "Night" ? "night" : "day" )
    moonImg.setAttribute("style", game.phase == "Night" ? "display: block" : "display: none");
    sunImg.setAttribute("style", game.phase != "Night" ? "display: block" : "display: none");
    dayCnt.textContent = game.dayCnt;
    phaseDiv.textContent = game.phase;
}

const poll = document.getElementById("pollBar");
function updatePoll() {
    let tot = game.vVotes + game.wVotes;
    if (tot==0) return;
    let per = game.vVotes / tot * 100;
    poll.setAttribute("style", `width: ${per}%;`);
}

const wwCnt = document.getElementById('wwCnt');
function updateWWCnt() {
    let alive = players.filter((p) => p.alive);
    let wwCnt = alive.filter((p) => p.role == "Werewolf").length;
    wwCnt.textContent = `${wwCnt} Werewolves | ${alive.length} Villagers`;
}

let endGameBtn = document.getElementById('endBtn');
endGameBtn.addEventListener('click', function () {
    endGame()
    .then(() => {
        console.log("Ended game");
    })
});
async function endGame() {
    let response = fetch(`/${roomCode}/endGame`, {
        method: "DELETE",
        headers: {
            "Content-Type": "application/json"
        }
    });
    return response;
}

const shuffleBtn = document.getElementById('shuffleBtn');
shuffleBtn.addEventListener('click', function () {
    shufflePlayers()
    .then(() => {
        console.log("Shuffled players");
    })
});
async function shufflePlayers() {
    let response = fetch(`/${roomCode}/shuffle`, {
        method: "PUT",
        headers: {
            "Content-Type": "application/json"
        }
    });
    return response;
}
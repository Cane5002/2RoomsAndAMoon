const script = document.getElementById('villageScript');
const roomCode = script.getAttribute('roomcode');
const playerID = parseInt(script.getAttribute('playerid'));
var players = [];
var player;
var game;

console.log(`RC:${roomCode} | PID:${playerID}`)

const villageStream = new EventSource(`http://werewolfx.com/${roomCode}/stream/game`);

var init = false;
villageStream.onmessage = function (ev) {
    let data = JSON.parse(ev.data);
    if (data.game && (!game || game!=data.game)) {
        if (data.players) {
            let player_ = data.players.find((p) => p.id == playerID);
            if (!player || player != player_) {
                updatePlayer(player_);
            }
            updatePlayers(data.players);
        }
        updateGame(data.game);
    }
    else if (data.players && (!players || players!=data.players)) {
        let player_ = data.players.find((p) => p.id == playerID);
        if (!player || player != player_) {
            player= player_;
            updatePlayer();
        }
        updatePlayers(data.players);
    }
    if (game && players && player && !init) {
        addVillageSelector();
        init = true;
    }

}

villageStream.onerror = function () {
    console.log("Village Stream error: Closing...");
    villageStream.close();
}

const playerList = document.getElementById('playerList');
function updatePlayers(players_) {
    removeChildNodes(playerList);
    players = players_;
    players.forEach((p) => {
        if (p.alive && p.room == player.room) addPlayer(p);
    })
}

function addPlayer(player_) {
    let playerDiv = document.createElement('div');
    playerDiv.setAttribute("class", "player");

    let susBtn = document.createElement('button');
    susBtn.setAttribute("class","img");
    addImage(susBtn, "susIcon", "https://static-00.iconduck.com/assets.00/thinking-face-emoji-1935x2048-ul7zt5ry.png");
    let susTxt = document.createElement('div');
    susTxt.setAttribute("class", "susTxt");
    susTxt.textContent = player_.susses;
    if (game.phase=="Night") susTxt.setAttribute("style","opacity:0;");
    susBtn.addEventListener('click', function() {
        if (game.phase!="Night" || player.canSus==0 || !player.alive) return;
        player.canSus--;
        sus(player_.id)
        .then(() => {
            console.log("Sussed");
        })
    })
    susBtn.appendChild(susTxt);
    playerDiv.appendChild(susBtn);

    let nameDiv = document.createElement('div');
    if (game.phase == "Movement") nameDiv.textContent = `${player_.name} voted ${player_.voteTarget}`;
    else nameDiv.textContent = `${player_.name}`;
    playerDiv.appendChild(nameDiv);

    if (player.alive) {
        // Vote button
        switch(game.phase) {
            case "Voting":
                if(!player.canVote) break;
                let voteBtn = document.createElement('button');
                voteBtn.setAttribute("class", "img");
                voteBtn.setAttribute("title", "Vote");
                addImage(voteBtn, "voteBtn", "http://werewolfx.com/resources/VoteIcon.png");
                voteBtn.addEventListener('click', function() {
                    if(!player.canVote) return;
                    player.canVote = false;
                    if (player.role.replace("[Hidden]", "")=="Idiot") vote(player.id, player.name);
                    else vote(player_.id, player_.name)
                    .then(() => {
                        console.log("Voted");
                    });
                });
                playerDiv.appendChild(voteBtn);
                break;                
            case "Night":
                switch(player.role) {
                    case "Seer":
                        if (player_.role=="Apprentice Seer") {
                            addImage(playerDiv, "apSeerIcon", "http://werewolfx.com/resources/ApSeerIcon.png");
                            break;
                        }
                        if(player.canPower==0) break;
                        let seerBtn = document.createElement('button');
                        seerBtn.setAttribute("class", "img");
                        seerBtn.setAttribute("title", "Check");
                        addImage(seerBtn, "seerBtn", "http://werewolfx.com/resources/CheckIcon.png");
                        seerBtn.addEventListener('click', function() {
                            if(player.canPower==0) return;
                            player.canPower--;
                            seer(player_.id)
                            .then(() => {
                                console.log("Used Power");
                            });
                        });
                        playerDiv.appendChild(seerBtn);
                        break;
                    case "Apprentice Seer":
                        if (player_.role=="Seer") {
                            addImage(playerDiv, "seerIcon", "http://werewolfx.com/resources/SeerIcon.png");
                        }
                        break;
                    case "Beholder":
                        if (player_.role=="Seer") {
                            addImage(playerDiv, "seerIcon", "http://werewolfx.com/resources/SeerIcon.png");
                        }
                        break;
                    case "Mason":
                        if (player_.role=="Mason") {
                            addImage(playerDiv, "masonIcon", "http://werewolfx.com/resources/MasonIcon.png");
                        }
                        break;
                    case "Illuminati":
                        if (player_.role=="Illuminati") {
                            addImage(playerDiv, "illuminatiIcon", "http://werewolfx.com/resources/IlluminatiIcon.png");
                        }
                        break;
                    case "Bump":
                        if(player.canPower==0) break;
                        let bumpBtn = document.createElement('button');
                        bumpBtn.setAttribute("class", "img");
                        bumpBtn.setAttribute("title", "Bump");
                        addImage(bumpBtn, "bumpBtn", "http://werewolfx.com/resources/BumpIcon.png");
                        bumpBtn.addEventListener('click', function() {
                            if(player.canPower==0) return;
                            player.canPower--;
                            bump(player_.id)
                            .then(() => {
                                console.log("Bumped");
                            });
                        });
                        playerDiv.appendChild(bumpBtn);
                        break;
                    case "Twister":
                        if(player.canPower==0) break;
                        let twisterBtn = document.createElement('button');
                        twisterBtn.setAttribute("class", "img");
                        twisterBtn.setAttribute("title", "Lost");
                        addImage(twisterBtn, "twisterBtn", "http://werewolfx.com/resources/TwisterIcon.png");
                        twisterBtn.addEventListener('click', function() {
                            if(player.canPower==0) return;
                            player.canPower--;
                            setStatus(player_.id, "Lost")
                            .then(() => {
                                console.log("Used Power");
                            });
                        });
                        playerDiv.appendChild(twisterBtn);
                        break;
                    case "Minion":
                        if (player_.role=="Werewolf") {
                            addImage(playerDiv, "wwIcon", "https://cdn3.emoji.gg/emojis/86623-wolvesville-werewolf.png");
                        }
                        break;
                    case "Sorcerer":
                        if (player_.role=="Werewolf") {
                            addImage(playerDiv, "wwIcon", "https://cdn3.emoji.gg/emojis/86623-wolvesville-werewolf.png");
                        }
                        if(player.canPower==0) break;
                        let sorcererBtn = document.createElement('button');
                        sorcererBtn.setAttribute("class", "img");
                        sorcererBtn.setAttribute("title", "Check");
                        addImage(sorcererBtn, "sorcererBtn", "http://werewolfx.com/resources/SorcererCheckIcon.png");
                        sorcererBtn.addEventListener('click', function() {
                            if(player.canPower==0) return;
                            player.canPower--;
                            sorcerer(player_.id)
                            .then(() => {
                                console.log("Used Power");
                            });
                        });
                        playerDiv.appendChild(sorcererBtn);
                        break;
                    case "Werewolf":
                        if (player_.role=="Werewolf") {
                            addImage(playerDiv, "wwIcon", "https://cdn3.emoji.gg/emojis/86623-wolvesville-werewolf.png");
                            break;
                        }
                        if (player_.role.replace("[Hidden]","")=="Lycan") {
                            addImage(playerDiv, "wwIcon", "https://cdn3.emoji.gg/emojis/86623-wolvesville-werewolf.png");
                            break;
                        }
                        if(player.canPower==0) break;
                        let attackBtn = document.createElement('button');
                        attackBtn.setAttribute("class", "img");
                        attackBtn.setAttribute("title", "Attack");
                        addImage(attackBtn, "attackBtn", "http://werewolfx.com/resources/AttackIcon.png");
                        attackBtn.addEventListener('click', function() {
                            if(player.canPower==0) return;
                            player.canPower--;
                            attack(player_.id)
                            .then(() => {
                                console.log("Attacked");
                            });
                        });
                        playerDiv.appendChild(attackBtn);
                        break;
                }
                break;
        }
    }
    playerList.appendChild(playerDiv);
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
    if(game.phase=="Movement" && player && player.alive && player.destination==-1) showVillageSelector();
    else hideVillageSelector();
}

const villageSelect = document.getElementById("villageSelect");
function addVillageSelector() {
    for(let i = 1; i <= game.roomCnt; i++) {
        let villageBtn = document.createElement('button');
        villageBtn.setAttribute("class", "img");
        villageBtn.setAttribute("Title", `Move to village ${i}`);
        villageBtn.addEventListener('click', function() {
            if (player.role.replace("[Hidden]", "")=="Lost") setDestination(Math.floor(Math.random() * (game.roomCnt-1))+1)
            else if (player.lost) {
                setDestination(Math.floor(Math.random() * (game.roomCnt-1))+1)
                clearStatus(player.id, "Lost");
            }
            else setDestination(i)
            .then(() => {
                console.log("Moved");
            });
            hideVillageSelector();
        });
        addImage(villageBtn, "villageIcon", "http://werewolfx.com/resources/VillageIcon.png");
        let btnTxt = document.createElement('div');
        btnTxt.setAttribute("class", "villageTxt");
        btnTxt.textContent = i;
        villageBtn.appendChild(btnTxt);
        villageSelect.appendChild(villageBtn);
    }
}
function showVillageSelector() {
    villageSelect.setAttribute("style", "display: flex;");
}
function hideVillageSelector() {
    villageSelect.setAttribute("style", "display: none;");
}

const villageTitle = document.getElementById('villageTitle');
const susCntr = document.getElementById("susCntr");
function updatePlayer(player_) {
    player= player_;
    updatePower();
    updateLog();
    villageTitle.textContent = `Village ${player.room}`;
    if (game.phase=="Night") susCntr.textContent = `Remaining Suspicion: ${player.canSus}`;
    else susCntr.textContent = "";
}

const powers = document.getElementById("powers");
function updatePower() {
    removeChildNodes(powers);
    switch(game.phase) {
        case "Night":
            if (!player.canPower) return;
            switch(player.role) {
                case "Apprentice Seer":
                    let apSeerBtn = document.createElement("button");
                    apSeerBtn.textContent = "Count";
                    apSeerBtn.setAttribute("title", "Count");
                    apSeerBtn.setAttribute("class", "power");
                    apSeerBtn.addEventListener('click', function() {
                        if(!player.canPower) return;
                        player.canPower = false;
                        count()
                        .then(() => {
                            console.log("Counted");
                        });
                    });
                    powers.appendChild(apSeerBtn);
                    break;
                case "The Count":
                    let countBtn = document.createElement("button");
                    countBtn.textContent = "Count";
                    countBtn.setAttribute("title", "Count");
                    countBtn.setAttribute("class", "power");
                    countBtn.addEventListener('click', function() {
                        if(!player.canPower) return;
                        player.canPower = false;
                        count()
                        .then(() => {
                            console.log("Counted");
                        });
                    });
                    powers.appendChild(countBtn);
                    break;
            }
            break;
        case "Voting":
            if (!player.canVote) break;
            let noVote = document.createElement("button");
            noVote.textContent = "Vote for Sleep";
            noVote.setAttribute("title", "Vote");
            noVote.setAttribute("class", "power");
            noVote.addEventListener('click', function() {
                if(!player.canVote) return;
                player.canVote = false;
                if (player.role.replace("[Hidden]", "")=="Idiot") vote(player.id, player.name);
                else vote(-1, "Sleep")
                .then(() => {
                    console.log("Voted");
                });
            });
            powers.appendChild(noVote);
            break;
    }
}

const log = document.getElementById("msgList");
function updateLog() {
    removeChildNodes(log);
    player.log.forEach((msg) => {
        let msgDiv = document.createElement('p');
        msgDiv.textContent = msg;
        log.appendChild(msgDiv);
    })
}

const poll = document.getElementById("pollBar");
document.getElementById("vPollBtn").addEventListener('click', function() {
    if(!player || !player.canVote || player.alive) return;
    player.canVote = false;
    pollV()
    .then(() => {
        console.log("Voted");
    });
});
document.getElementById("wPollBtn").addEventListener('click', function() {
    if(!player || !player.canVote || player.alive) return;
    player.canVote = false;
    pollW()
    .then(() => {
        console.log("Voted");
    });
});
function updatePoll() {
    let tot = game.vVotes + game.wVotes;
    if (tot==0) return;
    let per = game.vVotes / tot * 100;
    poll.setAttribute("style", `width: ${per}%;`);
}

async function setDestination(dest) {
    console.log("Move!");
    response = fetch(`/${roomCode}/move/${dest}`, {
        method: "PUT",
        headers: {
            "Content-Type": "application/json"
        }
    })
}
async function sus(targetID) {
    console.log("Sus!");
    response = fetch(`/${roomCode}/sus/${targetID}`, {
        method: "PUT",
        header: {
            "Content-Type": "application/json"
        }
    })
    return response;
}
async function vote(targetID, targetName) {
    console.log("Vote!");
    response = fetch(`/${roomCode}/vote/${targetID}`, {
        method: "PUT",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({ targetName: targetName })
    });
    return response;
}
async function setStatus(targetID, status) {
    console.log("Status!");
    response = fetch(`/${roomCode}/role/setStatus/${targetID}`, {
        method: "PUT",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({ status: status })
    });
    return response;
}
async function clearStatus(targetID, status) {
    console.log("No Status!");
    response = fetch(`/${roomCode}/role/clearStatus/${targetID}`, {
        method: "PUT",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({ status: status })
    });
    return response;
}
async function attack(targetID) {
    console.log("Attack!");
    response = fetch(`/${roomCode}/role/attack/${targetID}`, {
        method: "PUT",
        headers: {
            "Content-Type": "application/json"
        }
    });
    return response;
}
async function seer(targetID) {
    console.log("Seer!");
    response = fetch(`/${roomCode}/role/seer/${targetID}`, {
        method: "PUT",
        headers: {
            "Content-Type": "application/json"
        }
    });
    return response;
}
async function sorcerer(targetID) {
    console.log("Sorcerer!");
    response = fetch(`/${roomCode}/role/sorcerer/${targetID}`, {
        method: "PUT",
        headers: {
            "Content-Type": "application/json"
        }
    });
    return response;
}
async function count() {
    console.log("Count!");
    response = fetch(`/${roomCode}/role/count/${player.room}`, {
        method: "GET",
        headers: {
            "Content-Type": "application/json"
        }
    });
    return response;
}
async function bump(targetID) {
    console.log("Bump!");
    response = fetch(`/${roomCode}/role/bump/${targetID}`, {
        method: "PUT",
        headers: {
            "Content-Type": "application/json"
        }
    })
    return response;
}
async function pollV() {
    console.log("Vote!");
    response = fetch(`/${roomCode}/pollV`, {
        method: "PUT",
        headers: {
            "Content-Type": "application/json"
        }
    })
    return response;
}
async function pollW() {
    console.log("Vote!");
    response = fetch(`/${roomCode}/pollW`, {
        method: "PUT",
        headers: {
            "Content-Type": "application/json"
        }
    })
    return response;
}

function addImage(div, cls, url) {
    let img = document.createElement('img');
    img.setAttribute("class", cls);
    img.setAttribute("src", url);
    div.appendChild(img);
}
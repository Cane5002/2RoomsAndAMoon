const script = document.getElementById('playerViewScript');
const roomCode = script.getAttribute('roomCode');
const playerId = parseInt(script.getAttribute('playerId'));
var players_ = [];
var player_;
var gameData_;

console.log(`rc: ${roomCode} | pid: ${playerID}`);

const playerStream = new EventSource(`https://www.werewolfx.com/${roomCode}/stream/game`);

playerStream.onmessage = function (ev) {
    let dayChanged = false;
    if (!player_) dayChanged = true;

    let data = JSON.parse(ev.data);
    if (data.players) {
        players_ = data.players;
        player_ = players_.find(p => p.id==playerID);
    }
    if (data.gameData) {
        if (!gameData_ || data.gameData.night!=gameData_.night) dayChanged = true;
        gameData_ = data.gameData;
    }

    updateInfo();
    if (dayChanged) updateRole();
}

playerStream.onerror = function () {
    console.log("Player Stream error: Closing...");
    playerStream.close();
}

const updateInfoDiv = document.getElementById('updateInfo');

function updateInfo() {
    removeChildNodes(updateInfoDiv);

    updateInfoDiv.appendChild(isPowerAvailableDiv());

    if (player_ && player_.role=="Werewolf") {
        let myVoteDiv = document.createElement('div');
        myVoteDiv.textContent = `My Vote: ${player_.vote}`;
        updateInfoDiv.appendChild(myVoteDiv);
    }
}

const updateRoleDiv = document.getElementById('updateRole');

function updateRole() {
    removeChildNodes(updateRoleDiv);
    if (!player_) return;
    switch(player_.role) {
        case "Villager":
            updateVillager();
            break;
        case "Seer": 
            updateSeer();
            break;
        case "PI":
            updatePI();
            break;
        case "Werewolf":
            updateWerewolf();
            break;
        case "Minion":
            updateMinion();
            break;
    }
}

function updateVillager() {
}

function updateSeer() {
    if (gameData_.night) {
        let seerDiv = document.createElement('div');
        seerDiv.textContent = "Seer:"
        updateRoleDiv.appendChild(seerDiv);

        let targetInput = document.createElement('input');
        targetInput.type = "text";
        targetInput.name = "seerTarget";
        targetInput.id = "seertarget";
        updateRoleDiv.appendChild(targetInput);
        
        let seerBtn = document.createElement('button');
        seerBtn.textContent = "Check Player";
        seerBtn.addEventListener('click', function() {
            seer(targetInput.value)
            .then(data => {
                if (data.alert) {
                    alert(data.alert);
                }
                else if (data.werewolf) {
                    alert("WEREWOLF!!!")
                }
                else {
                    alert("Not a werewolf");
                }
            })
        })
        updateRoleDiv.appendChild(seerBtn);
    }
}

async function seer(target) {
    let response = await fetch(`/${roomCode}/role/seer`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({ target: target })
    });
    return response.json();
}

function updateWerewolf() {
    console.log("update ww");

    let wwNamesDiv = document.createElement('div');
    wwNames = ""
    players_.forEach(p => {
        if (p.role=="Werewolf") wwNames+=`${p.name} `;
    });
    wwNamesDiv.textContent = `Werewolves: ${wwNames}`;
    updateRoleDiv.appendChild(wwNamesDiv);


    if (gameData_.night) {
        let werewolfDiv = document.createElement('div');
        werewolfDiv.textContent = "Werewolf:"
        updateRoleDiv.appendChild(werewolfDiv);

        let targetInput = document.createElement('input');
        targetInput.type = "text";
        targetInput.name = "targetName";
        targetInput.id = "targetName";
        updateRoleDiv.appendChild(targetInput);

        let wwBtn = document.createElement('button');
        wwBtn.textContent ="Kill Target";
        wwBtn.addEventListener('click', function() {
            vote(targetInput.value)
            .then(() => {
                console.log("target submitted");
            })
        })
        updateRoleDiv.appendChild(wwBtn);
    }
}

async function vote(vote) {
    response = fetch(`/${roomCode}/vote`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({ vote: vote })
    });
    return response;
}

function isPowerAvailableDiv() {
    let powerDiv = document.createElement('div');
    if (player_) powerDiv.textContent = (player_.canPower ? "Power Available" : "Power Unavailable" );
    return powerDiv;
}

function removeChildNodes(parent) {
    if(!parent.firstChild) return;
    while(parent.firstChild) {
        parent.removeChild(parent.firstChild);
    }
}
const createButton = document.getElementById("createGame");
const joinButton = document.getElementById("joinGame");
const roomInput = document.getElementById("roomCode");
const status = document.getElementById("status");

const game = document.getElementById("game");
const hand = document.getElementById("hand");
const topCard = document.getElementById("topCard");
const turnStatus = document.getElementById("turnStatus");

const colors = ["red", "blue", "green", "yellow"];
const values = ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"];

let playerHand = [];

function makeRoomCode() {
    const characters = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    let code = "";

    for (let i = 0; i < 6; i++) {
        code += characters[Math.floor(Math.random() * characters.length)];
    }

    return code;
}

function createStartingHand() {
    playerHand = [];

    for (let i = 0; i < 7; i++) {
        const color = colors[Math.floor(Math.random() * colors.length)];
        const value = values[Math.floor(Math.random() * values.length)];

        playerHand.push({
            color: color,
            value: value
        });
    }

    renderHand();
}

function renderHand() {
    hand.innerHTML = "";

    playerHand.forEach((card, index) => {
        const cardElement = document.createElement("div");

        cardElement.className = "card " + card.color;
        cardElement.textContent = card.value;

        cardElement.addEventListener("click", () => {
            playCard(index);
        });

        hand.appendChild(cardElement);
    });
}

function playCard(index) {
    const card = playerHand[index];

    topCard.textContent = card.value;
    topCard.className = "";
    topCard.classList.add(card.color);

    playerHand.splice(index, 1);

    renderHand();

    turnStatus.textContent = "You played a " + card.color + " " + card.value + "!";
    
    if (playerHand.length === 0) {
        turnStatus.textContent = "🎉 YOU WIN!";
    }
}

function startGame(roomCode) {
    game.style.display = "block";
    createStartingHand();

    status.textContent = "Room: " + roomCode;
    turnStatus.textContent = "Your turn!";
}

createButton.addEventListener("click", () => {
    const roomCode = makeRoomCode();

    database.ref("rooms/" + roomCode).set({
        players: 1,
        status: "waiting"
    });

    roomInput.value = roomCode;

    startGame(roomCode);
});

joinButton.addEventListener("click", () => {
    const roomCode = roomInput.value.trim().toUpperCase();

    if (roomCode.length !== 6) {
        status.textContent = "Enter a 6-character room code.";
        return;
    }

    database.ref("rooms/" + roomCode).once("value").then((snapshot) => {
        if (snapshot.exists()) {
            const room = snapshot.val();

            database.ref("rooms/" + roomCode + "/players").set(
                (room.players || 0) + 1
            );

            startGame(roomCode);
        } else {
            status.textContent = "Room not found.";
        }
    });
});

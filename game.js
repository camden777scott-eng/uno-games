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

let currentRoom = null;

function getPlayerId() {
    let id = localStorage.getItem("unoPlayerId");

    if (!id) {
        id = "player_" + Math.random().toString(36).substring(2, 10);
        localStorage.setItem("unoPlayerId", id);
    }

    return id;
}

const playerId = getPlayerId();

function makeRoomCode() {
    const characters = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    let code = "";

    for (let i = 0; i < 6; i++) {
        code += characters[Math.floor(Math.random() * characters.length)];
    }

    return code;
}

function randomCard() {
    return {
        color: colors[Math.floor(Math.random() * colors.length)],
        value: values[Math.floor(Math.random() * values.length)]
    };
}

function createStartingHand() {
    const newHand = [];

    for (let i = 0; i < 7; i++) {
        newHand.push(randomCard());
    }

    return newHand;
}

function showGame(roomCode) {
    currentRoom = roomCode;

    game.style.display = "block";
    status.textContent = "Room: " + roomCode;

    database.ref("rooms/" + roomCode).on("value", (snapshot) => {
        if (!snapshot.exists()) {
            status.textContent = "Room no longer exists.";
            return;
        }

        renderGame(snapshot.val());
    });
}

function renderGame(room) {
    const players = room.players || {};
    const order = room.order || [];
    const myPlayer = players[playerId];

    if (!myPlayer) {
        return;
    }

    const playerCount = order.length;

    status.textContent =
        "Room: " + currentRoom + " | Players: " + playerCount + "/4";

    if (room.topCard) {
        topCard.textContent = room.topCard.value;
        topCard.className = "";
        topCard.classList.add(room.topCard.color);
    }

    renderHand(myPlayer.hand || []);

    if (room.winner) {
        if (room.winner === playerId) {
            turnStatus.textContent = "🎉 YOU WIN!";
        } else {
            turnStatus.textContent = "Game over!";
        }

        return;
    }

    if (playerCount < 2) {
        turnStatus.textContent = "Waiting for another player...";
        return;
    }

    const currentPlayer = order[room.turnIndex || 0];

    if (currentPlayer === playerId) {
        turnStatus.textContent = "🔥 YOUR TURN!";
    } else {
        turnStatus.textContent = "Opponent's turn...";
    }
}

function renderHand(playerHand) {
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
    if (!currentRoom) return;

    const roomRef = database.ref("rooms/" + currentRoom);

    roomRef.once("value").then((snapshot) => {
        const room = snapshot.val();

        if (!room) return;

        const order = room.order || [];
        const players = room.players || {};
        const currentPlayer = order[room.turnIndex || 0];

        if (currentPlayer !== playerId) {
            turnStatus.textContent = "It's not your turn!";
            return;
        }

        const myPlayer = players[playerId];

        if (!myPlayer || !myPlayer.hand) return;

        const card = myPlayer.hand[index];

        if (!card) return;

        const top = room.topCard;

        if (card.color !== top.color && card.value !== top.value) {
            turnStatus.textContent = "You can't play that card!";
            return;
        }

        const newHand = [...myPlayer.hand];
        newHand.splice(index, 1);

        if (newHand.length === 0) {
            roomRef.update({
                ["players/" + playerId + "/hand"]: newHand,
                topCard: card,
                winner: playerId
            });

            return;
        }

        const nextTurn = (room.turnIndex + 1) % order.length;

        roomRef.update({
            ["players/" + playerId + "/hand"]: newHand,
            topCard: card,
            turnIndex: nextTurn
        });
    });
}

function drawCard() {
    if (!currentRoom) return;

    const roomRef = database.ref("rooms/" + currentRoom);

    roomRef.once("value").then((snapshot) => {
        const room = snapshot.val();

        if (!room) return;

        const order = room.order || [];
        const currentPlayer = order[room.turnIndex || 0];

        if (currentPlayer !== playerId) {
            turnStatus.textContent = "It's not your turn!";
            return;
        }

        const myPlayer = room.players[playerId];

        if (!myPlayer) return;

        const newHand = [...(myPlayer.hand || []), randomCard()];

        const nextTurn = (room.turnIndex + 1) % order.length;

        roomRef.update({
            ["players/" + playerId + "/hand"]: newHand,
            turnIndex: nextTurn
        });
    });
}

createButton.addEventListener("click", () => {
    const roomCode = makeRoomCode();
    const startingHand = createStartingHand();
    const startingCard = randomCard();

    database.ref("rooms/" + roomCode).set({
        players: {
            [playerId]: {
                hand: startingHand
            }
        },

        order: [playerId],

        topCard: startingCard,

        turnIndex: 0,

        winner: null
    }).then(() => {
        roomInput.value = roomCode;
        showGame(roomCode);
    });
});

joinButton.addEventListener("click", () => {
    const roomCode = roomInput.value.trim().toUpperCase();

    if (roomCode.length !== 6) {
        status.textContent = "Enter a 6-character room code.";
        return;
    }

    const roomRef = database.ref("rooms/" + roomCode);

    roomRef.once("value").then((snapshot) => {
        if (!snapshot.exists()) {
            status.textContent = "Room not found.";
            return;
        }

        const room = snapshot.val();
        const order = room.order || [];

        if (order.length >= 4) {
            status.textContent = "Room is full.";
            return;
        }

        if (order.includes(playerId)) {
            showGame(roomCode);
            return;
        }

        const newHand = createStartingHand();
        const newOrder = [...order, playerId];

        roomRef.update({
            ["players/" + playerId]: {
                hand: newHand
            },

            order: newOrder
        }).then(() => {
            showGame(roomCode);
        });
    });
});

document.getElementById("drawCard").addEventListener("click", drawCard);

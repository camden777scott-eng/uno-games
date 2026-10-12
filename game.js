const createButton = document.getElementById("createGame");
const joinButton = document.getElementById("joinGame");
const roomInput = document.getElementById("roomCode");
const status = document.getElementById("status");

function makeRoomCode() {
    const characters = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    let code = "";

    for (let i = 0; i < 6; i++) {
        code += characters[Math.floor(Math.random() * characters.length)];
    }

    return code;
}

createButton.addEventListener("click", () => {
    const roomCode = makeRoomCode();

    database.ref("rooms/" + roomCode).set({
        players: 1,
        status: "waiting"
    });

    status.textContent = "Room created! Code: " + roomCode;
    roomInput.value = roomCode;
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

            status.textContent = "Joined room " + roomCode + "!";
        } else {
            status.textContent = "Room not found.";
        }
    });
});

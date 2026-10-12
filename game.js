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

    status.textContent = "Your room code is: " + roomCode;
    roomInput.value = roomCode;
});

joinButton.addEventListener("click", () => {
    const roomCode = roomInput.value.trim().toUpperCase();

    if (roomCode.length !== 6) {
        status.textContent = "Enter a 6-character room code.";
        return;
    }

    status.textContent = "Joining room " + roomCode + "...";
});

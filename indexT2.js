const startBtn = document.getElementById("startBtn");
const nameInput = document.getElementById("playerName");

function getOrCreatePlayerNumber() {
  let num = localStorage.getItem("playerNumber");
  if (!num) {
    num = Math.floor(100000 + Math.random() * 900000); // 6-digit
    localStorage.setItem("playerNumber", num);
  }
  return num;
}

startBtn.addEventListener("click", () => {
  const name = nameInput.value.trim();

  if (!name) {
    alert("Please enter your name");
    return;
  }

  const playerNum = getOrCreatePlayerNumber();
  const playerNumber = String(playerNum);
  localStorage.setItem("playerName", name);
  localStorage.setItem("playerNumber", playerNumber);
  window.location.href = "gameT2.html";
});



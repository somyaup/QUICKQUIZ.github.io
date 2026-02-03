const questionsContainer = document.getElementById("questions-container");
const nextBtn = document.getElementById("nextBtn");
const skipBtn = document.getElementById("skipBtn");
const progressText = document.getElementById("progressText");
const scoreText = document.getElementById("score");
const progressBarFull = document.getElementById("progressBarFull");
const setTitle = document.getElementById("setTitle");
const timeLeftText = document.getElementById("timeLeft");
const playerName = localStorage.getItem("playerName");
const playerNumber = localStorage.getItem("playerNumber")+"T1B";

let sets = [];
let currentSetIndex = 0;
let score = parseInt(localStorage.getItem('mostRecentScore'));
scoreText.innerText = score;
let gameLog = {
  playerNumber: playerNumber,
  playerName: playerName,
  total: 0,
  results: []
};
let setStartTimestamp = null;
const CORRECT_BONUS = 10;

const TOTAL_TIME = 900; // seconds
let timeRemaining = TOTAL_TIME;
let timerInterval = null;

// ---------- LOAD QUESTIONS ----------
fetch("questions2.json")
  .then(res => res.json())
  .then(data => {
    sets = data; // JSON already an array of sets
    startGame();
  })
  .catch(err => console.error("Failed to load questions.json:", err));

// ---------- START GAME ----------
function startGame() {
  score = parseInt(localStorage.getItem('mostRecentScore'));
  scoreText.innerText = score;
  currentSetIndex = 0;
  const minutes = Math.floor(timeRemaining / 60);
  const seconds = timeRemaining % 60;
  timeLeftText.innerText =
  `${minutes}:${seconds.toString().padStart(2, "0")}`;
  timeRemaining = TOTAL_TIME;

  startTimer();
  loadSet();
}
//--------------START TIMER--------------
function startTimer() {
  timerInterval = setInterval(() => {
    timeRemaining--;
    minutes = Math.floor(timeRemaining / 60);
    seconds = timeRemaining % 60;
    timeLeftText.innerText =
    `${minutes}:${seconds.toString().padStart(2, "0")}`;

    if (timeRemaining <= 0) {
      clearInterval(timerInterval);
      endQuiz("timeout");
    }
  }, 1000);
}
// ---------- LOAD ONE SET ----------
function loadSet() {
  questionsContainer.innerHTML = "";
  setStartTimestamp = Date.now();
  nextBtn.disabled = true;

  if (currentSetIndex >= sets.length) {
    clearInterval(timerInterval);
    localStorage.setItem("mostRecentScore", score);
    endQuiz("Out of questions")
    window.location.href = "end.html";
    return;
  }

  const currentSet = sets[currentSetIndex];
  const questions = currentSet.list;

  // SET NAME DISPLAY

  const playerDisplay = document.getElementById("playerInfo");
  playerDisplay.innerText = `${playerName} (#${playerNumber})`;
  setTitle.innerText = currentSet.set;
  // Progress / UI
  progressText.innerText =
    `${currentSet.set} (${currentSetIndex + 1} / ${sets.length})`;
  progressBarFull.style.width =
    `${((currentSetIndex + 1) / sets.length) * 100}%`;

  // Render questions
  questions.forEach((q, qIndex) => {
    const block = document.createElement("div");
    block.className = "question-block";

    block.innerHTML = `
      <h3>${q.question}</h3>
      ${[1, 2, 3, 4].map(n => `
        <label>
          <input type="radio" name="q${qIndex}" value="${n}">
          ${q["choice" + n]}
        </label>
      `).join("")}
    `;

    questionsContainer.appendChild(block);
  });
}

// ---------- ENABLE NEXT ONLY IF ALL ANSWERED ----------
questionsContainer.addEventListener("change", () => {
  const questions = sets[currentSetIndex].list;

  const allAnswered = questions.every((_, i) =>
    document.querySelector(`input[name="q${i}"]:checked`)
  );

  nextBtn.disabled = !allAnswered;
});

function endQuiz(reason) {
  const timeTaken =
    Math.round((Date.now() - setStartTimestamp) / 1000);
  if (reason == "timeout"){
    gameLog.results.push({
      set: sets[currentSetIndex].set,
      time: timeTaken,
      score: 0,
      action: reason === "timeout" ? "timeout" : "end"
    });
  }
  gameLog.total = score;
  scoreText.innerText = score;
  sendResultsToSheet(gameLog);
  localStorage.setItem("mostRecentScore", score)
  window.location.href = "end.html";
}


// ---------- NEXT ----------
nextBtn.addEventListener("click", () => {
  const questions = sets[currentSetIndex].list;
  let setScore = 1;
  questions.forEach((q, i) => {
    const selected = document.querySelector(
      `input[name="q${i}"]:checked`
    );
    if (selected && Number(selected.value) === q.answer) {
      setScore *= 1;
    }
    else{
      setScore *= 0;
    }
  });
  setScore *=CORRECT_BONUS;
  const timeTaken =
    Math.round((Date.now() - setStartTimestamp) / 1000);
  console.log(timeTaken);
  gameLog.results.push({
    set: sets[currentSetIndex].set,
    time: timeTaken,
    score: setScore,
    action: "next"
  });

  score += setScore;

  scoreText.innerText = score;
  currentSetIndex++;
  loadSet();
});

// ---------- SKIP ----------
skipBtn.addEventListener("click", () => {
  const timeTaken =
    Math.round((Date.now() - setStartTimestamp) / 1000);
  gameLog.results.push({
    set: sets[currentSetIndex].set,
    time: timeTaken,
    score: 0,
    action: "skip"
  });

  currentSetIndex++;
  loadSet();
});

const WEB_APP_URL = "https://script.google.com/macros/s/AKfycbzxbYdLXmzDRbFlPtyYt2n0_UCekRvw9byUyKHsPPbdcjtbIJDNjxJNgiuXIo3aOvNtSA/exec";
function sendResultsToSheet(data2) {
  fetch(WEB_APP_URL, {
    method: "POST",
    body: JSON.stringify(data2)
  })
  .catch(err => {
    alert(err);
    console.error(err);
  });
  alert("done");
}


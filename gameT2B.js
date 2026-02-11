const questionsContainer = document.getElementById("questions-container");
const nextBtn = document.getElementById("nextBtn");
const skipBtn = document.getElementById("skipBtn");
const progressText = document.getElementById("progressText");
const scoreText = document.getElementById("score");
const progressBarFull = document.getElementById("progressBarFull");
const setTitle = document.getElementById("setTitle");
const timeLeftText = document.getElementById("timeLeft");
const playerName = localStorage.getItem("playerName");
const playerNumber = localStorage.getItem("playerNumber")+"T2B";

let sets = [];
let currentSetIndex = 0;
let score = parseInt(localStorage.getItem('mostRecentScore'));
scoreText.innerText = score;
let gameLog = {
  playerNumber: playerNumber+"start",
  playerName: playerName,
  total: 0,
  results: []
};
let setStartTimestamp = null;
const CORRECT_BONUS = 30;
const currentSetLog = {
  set: 0,
  setTime: 0,
  action: null,
  setScore: 0,
  // IMPORTANT: pre-fill with nulls
  questions: []
};
const TOTAL_TIME = 1200; // seconds
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
  sendResultsToSheet(gameLog);
  timerInterval = setInterval(() => {
    timeRemaining--;
    minutes = Math.floor(timeRemaining / 60);
    seconds = timeRemaining % 60;
    timeLeftText.innerText =
    `${minutes}:${seconds.toString().padStart(2, "0")}`;

    if (timeRemaining <=0) {
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
  questionAnswered = [];
  // prepare question slots
  if (currentSetIndex >= sets.length) {
    clearInterval(timerInterval);
    localStorage.setItem("mostRecentScore", score);
    endQuiz("Out of questions")
    window.location.href = "end.html";
    return;
  }

  const currentSet = sets[currentSetIndex];
  const questions = currentSet.list;
  currentSetLog.questions = questions.map((_, i) => ({
    qid: i + 1,
    time: null,
    response: null,
    correct: false
  }));
  // SET NAME DISPLAY
  const playerDisplay = document.getElementById("playerInfo");
  playerDisplay.innerText = `${playerName} (#${playerNumber})`;
  setTitle.innerText = currentSet.set;
  // Progress / UI
  // progressText.innerText =
  //   `${currentSet.set} (${currentSetIndex + 1} / ${sets.length})`;
  progressBarFull.style.width =
    `${((currentSetIndex + 1) / sets.length) * 100}%`;

  // Render questions
  questions.forEach((q, qIndex) => {
    const block = document.createElement("div");
    block.className = "question-block";
    q.question=renderQuestion(q.question);
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
questionsContainer.addEventListener("click", (event) => {
  if (event.target.type !== "radio") return;

  const qIndex = Number(event.target.name.replace("q", ""));
  const optionClicked = Number(event.target.value);

  // record time ONLY on first interaction
  if (!questionAnswered[qIndex]) {
    questionAnswered[qIndex] = true;

    const timeSpent =
      Math.round((Date.now() - setStartTimestamp) / 1000);

    currentSetLog.questions[qIndex].time = timeSpent;
  }

  // always update response & correctness
  currentSetLog.questions[qIndex].response = optionClicked;
  currentSetLog.questions[qIndex].correct =
    optionClicked === sets[currentSetIndex].list[qIndex].answer;

  // enable NEXT only when all questions touched
  nextBtn.disabled = !questionAnswered.every(Boolean);
});

function endQuiz(reason) {
  const timeTaken =
    Math.round((Date.now() - setStartTimestamp) / 1000);
  if (reason == "timeout"){
    gameLog.results.push({
      set: sets[currentSetIndex].set,
      time: timeTaken,
      score: 0,
      action: reason === "timeout" ? "timeout" : "end",
      questions: currentSetLog.questions
    });
  }
  gameLog.total = score;
  gameLog.playerNumber = playerNumber;
  sendResultsToSheet(gameLog);
  localStorage.setItem("mostRecentScore", score);
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
    action: "next",
    questions: currentSetLog.questions
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
    action: "skip",
    questions: currentSetLog.questions
  });

  currentSetIndex++;
  loadSet();
});
function renderQuestion(text) {
  return text.replace(/\n/g, "<br>");
}
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
}


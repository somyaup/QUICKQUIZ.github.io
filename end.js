const saveScoreBtn = document.getElementById('saveScoreBtn');
const finalScore = document.getElementById('finalScore');
const mostRecentScore = localStorage.getItem('mostRecentScore');

const highScores = JSON.parse(localStorage.getItem('highScores')) || [];

const MAX_HIGH_SCORES = 0;

finalScore.innerText = mostRecentScore;
localStorage.setItem("mostRecentScore", mostRecentScore);
saveHighScore = (e) => {
    e.preventDefault();

    const score = {
        score: mostRecentScore,
    };
    highScores.push(score);
    highScores.sort((a, b) => b.score - a.score);
    highScores.splice(5);

    localStorage.setItem('highScores', JSON.stringify(highScores));
};

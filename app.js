const questions = [
  "focus on objective facts",
  "have my feelings sway my decisions",
  "quickly see why an idea will not work",
  "see the positive side of things",
  "be creative",
  "lead the problem solving process",
  "enter into the discussion without preconceived ideas on a solution",
  "have good intuition",
  "be able to determine that an idea will not work by judging from past experience",
  "see the good parts of even a bad idea",
  "often generate new ways of thinking about a problem",
  "think as much about the problem solving process as the problem itself",
  "seek to know the statistical evidence concerning a decision",
  "have hunches about the best decision",
  "like to play the “devil’s advocate”",
  "usually be optimistic that a new idea will work",
  "easily think “outside of the box”",
  "focus on the big picture, summarize and draw conclusions",
  "think totally objectively about a situation",
  "listen to my emotions when making decisions",
  "readily detect poor logic in someone’s argument",
  "“look on the bright side” of a problem",
  "constantly think of alternatives",
  "find myself trying to keep the group focused",
  "differentiate between facts and opinions",
  "think emotions should play a significant role in decision making",
  "find it easy to be critical of others’ ideas",
  "have comments which are positive and constructive",
  "easily generate new concepts",
  "help the group clearly define the problem"
];

const hats = [
  { key:"white", name:"White", color:"#ffffff", bar:"#c8d0dc", desc:"Facts, evidence, objectivity, and separating what is known from what is assumed." },
  { key:"red", name:"Red", color:"#d64045", bar:"#d64045", desc:"Feelings, intuition, hunches, and awareness of the emotional side of a decision." },
  { key:"black", name:"Black", color:"#222222", bar:"#222222", desc:"Caution, critical judgment, logic checking, risk detection, and identifying why something may fail." },
  { key:"yellow", name:"Yellow", color:"#f4c542", bar:"#e0ae18", desc:"Benefits, optimism, value, constructive thinking, and reasons an idea could work." },
  { key:"green", name:"Green", color:"#3a9d5d", bar:"#3a9d5d", desc:"Creativity, alternatives, new concepts, possibilities, and thinking beyond the obvious solution." },
  { key:"blue", name:"Blue", color:"#3478c6", bar:"#3478c6", desc:"Process leadership, organization, big-picture thinking, focus, summaries, and defining the problem." }
];

let current = 0;
let answers = Array(questions.length).fill(null);

const intro = document.getElementById("intro");
const assessment = document.getElementById("assessment");
const results = document.getElementById("results");
const questionNumber = document.getElementById("questionNumber");
const questionText = document.getElementById("questionText");
const progressFill = document.getElementById("progressFill");
const scaleButtons = document.getElementById("scaleButtons");
const nextBtn = document.getElementById("nextBtn");
const backBtn = document.getElementById("backBtn");
const answeredCount = document.getElementById("answeredCount");

function show(section) {
  [intro, assessment, results].forEach(s => s.classList.add("hidden"));
  section.classList.remove("hidden");
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function renderQuestion() {
  questionNumber.textContent = `Question ${current + 1} of ${questions.length}`;
  questionText.textContent = questions[current];
  progressFill.style.width = `${((current + 1) / questions.length) * 100}%`;
  answeredCount.textContent = `${answers.filter(v => v !== null).length} of ${questions.length} answered`;
  backBtn.disabled = current === 0;
  nextBtn.textContent = current === questions.length - 1 ? "See my results" : "Next";
  nextBtn.disabled = answers[current] === null;

  scaleButtons.innerHTML = "";
  for (let score = 0; score <= 5; score++) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "score-btn" + (answers[current] === score ? " selected" : "");
    btn.textContent = score;
    btn.setAttribute("role", "radio");
    btn.setAttribute("aria-checked", answers[current] === score ? "true" : "false");
    btn.addEventListener("click", () => {
      answers[current] = score;
      renderQuestion();
    });
    scaleButtons.appendChild(btn);
  }
}

function mean(values) { return values.reduce((a,b) => a+b, 0) / values.length; }
function sampleStdDev(values) {
  if (values.length < 2) return 0;
  const m = mean(values);
  return Math.sqrt(values.reduce((sum, v) => sum + Math.pow(v - m, 2), 0) / (values.length - 1));
}

// Abramowitz & Stegun-style erf approximation, plenty accurate for display scoring.
function erf(x) {
  const sign = x >= 0 ? 1 : -1;
  x = Math.abs(x);
  const a1=0.254829592, a2=-0.284496736, a3=1.421413741, a4=-1.453152027, a5=1.061405429, p=0.3275911;
  const t = 1 / (1 + p*x);
  const y = 1 - (((((a5*t+a4)*t)+a3)*t+a2)*t+a1)*t*Math.exp(-x*x);
  return sign*y;
}
function normalCdf(z) { return 0.5 * (1 + erf(z / Math.sqrt(2))); }

function calculateResults() {
  const overallMean = mean(answers);
  const overallSd = sampleStdDev(answers);
  return hats.map((hat, index) => {
    const values = [index, index+6, index+12, index+18, index+24].map(i => answers[i]);
    const raw = mean(values);
    const z = overallSd === 0 ? 0 : (raw - overallMean) / overallSd;
    const percentile = Math.round(normalCdf(z) * 100);
    return { ...hat, raw, z, percentile };
  });
}

function renderResults() {
  const scored = calculateResults();
  const ranked = [...scored].sort((a,b) => b.percentile - a.percentile);
  const top = ranked[0];
  const second = ranked[1];
  document.getElementById("topSummary").innerHTML = `<strong>Your strongest preferences are ${top.name} and ${second.name} thinking.</strong><br>That does not mean you should only use those approaches. The purpose of the profile is to help you notice what you naturally bring to a design team—and what kinds of thinking teammates may add.`;

  document.getElementById("resultsGrid").innerHTML = ranked.map(r => `
    <article class="result-card">
      <div class="result-head">
        <div class="result-name"><span class="swatch" style="background:${r.color}"></span>${r.name} Hat</div>
        <div class="percentile">${r.percentile}</div>
      </div>
      <div class="bar"><span style="width:${r.percentile}%;background:${r.bar}"></span></div>
      <p class="raw">Average response: ${r.raw.toFixed(1)} / 5 · Relative score: ${r.percentile}</p>
      <p class="desc">${r.desc}</p>
    </article>`).join("");
}

function resetAssessment() {
  current = 0;
  answers = Array(questions.length).fill(null);
  renderQuestion();
  show(assessment);
}

document.getElementById("startBtn").addEventListener("click", () => { renderQuestion(); show(assessment); });
document.getElementById("resetBtn").addEventListener("click", resetAssessment);
document.getElementById("retakeBtn").addEventListener("click", resetAssessment);
document.getElementById("printBtn").addEventListener("click", () => window.print());
backBtn.addEventListener("click", () => { if (current > 0) { current--; renderQuestion(); } });
nextBtn.addEventListener("click", () => {
  if (answers[current] === null) return;
  if (current < questions.length - 1) { current++; renderQuestion(); }
  else { renderResults(); show(results); }
});

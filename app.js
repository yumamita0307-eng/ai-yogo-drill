'use strict';

// ===== 定数 =====
const CATEGORIES = ['AIツール', '操作・開発', 'AIの基本', '仕事・導入'];
// 用語データを初心者向け（69語）に入れ替えたため、「覚えた」の保存キーを新しくした（旧キー：aiYogoDrill.learned）
const STORAGE_LEARNED = 'aiYogoDrill.learned.v2';
const STORAGE_THEME = 'aiYogoDrill.theme';

// ===== 状態 =====
let terms = [];            // terms.json の全データ
let learned = new Set();   // 「覚えた」用語（term 名で管理）

const quiz = {
  questions: [],   // { item, direction, options, answerIndex }
  index: 0,
  answers: [],     // { question, correct }
  answered: false,
};

// ===== ユーティリティ =====
const $ = (id) => document.getElementById(id);

// 配列をシャッフルした新しい配列を返す（フィッシャー–イェーツ法）
function shuffle(array) {
  const a = array.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// localStorage は使えない環境もあるので必ず try/catch で包む
function storageGet(key) {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function storageSet(key, value) {
  try {
    localStorage.setItem(key, value);
  } catch {
    // 保存できなくても動作は続ける
  }
}

// ===== テーマ切替 =====
function initTheme() {
  const saved = storageGet(STORAGE_THEME);
  if (saved === 'light' || saved === 'dark') {
    document.documentElement.dataset.theme = saved;
  }
  $('theme-toggle').addEventListener('click', () => {
    // 現在の見た目（手動指定がなければOS設定）を反転させる
    const current = document.documentElement.dataset.theme
      || (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    const next = current === 'dark' ? 'light' : 'dark';
    document.documentElement.dataset.theme = next;
    storageSet(STORAGE_THEME, next);
  });
}

// ===== タブ切替 =====
function initTabs() {
  document.querySelectorAll('.tab').forEach((tab) => {
    tab.addEventListener('click', () => showView(tab.dataset.view));
  });
}

function showView(view) {
  document.querySelectorAll('.tab').forEach((tab) => {
    const active = tab.dataset.view === view;
    tab.classList.toggle('is-active', active);
    tab.setAttribute('aria-selected', String(active));
  });
  $('view-quiz').hidden = view !== 'quiz';
  $('view-cards').hidden = view !== 'cards';
  if (view === 'cards') renderCards();
}

// ===== テスト：設定画面 =====
function initSetup() {
  // 分野のチェックボックスを生成（初期状態は全選択）
  const wrap = $('category-options');
  CATEGORIES.forEach((cat) => {
    const count = terms.filter((t) => t.category === cat).length;
    const label = document.createElement('label');
    label.className = 'chip';
    label.innerHTML = `<input type="checkbox" name="category" checked><span></span>`;
    label.querySelector('input').value = cat;
    label.querySelector('span').textContent = `${cat}（${count}）`;
    wrap.appendChild(label);
  });

  $('quiz-setup').addEventListener('change', updateSetupSummary);
  $('start-btn').addEventListener('click', startQuizFromSetup);
  updateSetupSummary();
}

function getSetup() {
  const categories = [...document.querySelectorAll('input[name="category"]:checked')].map((el) => el.value);
  const count = document.querySelector('input[name="count"]:checked').value;
  const mode = document.querySelector('input[name="mode"]:checked').value;
  return { categories, count, mode };
}

function updateSetupSummary() {
  const { categories, count } = getSetup();
  const pool = terms.filter((t) => categories.includes(t.category));
  const n = count === 'all' ? pool.length : Math.min(Number(count), pool.length);
  $('start-btn').disabled = pool.length === 0;
  $('setup-summary').textContent = pool.length === 0
    ? '分野を1つ以上選んでください。'
    : `対象 ${pool.length}語から ${n}問を出題します。`;
}

function startQuizFromSetup() {
  const { categories, count, mode } = getSetup();
  const pool = shuffle(terms.filter((t) => categories.includes(t.category)));
  const n = count === 'all' ? pool.length : Math.min(Number(count), pool.length);
  const questions = pool.slice(0, n).map((item) => {
    const direction = mode === 'mix' ? (Math.random() < 0.5 ? 'd2t' : 't2d') : mode;
    return buildQuestion(item, direction);
  });
  startQuiz(questions);
}

// ===== テスト：問題生成 =====
// 誤答の選択肢はなるべく同じ分野から選び、紛らわしくする
function buildQuestion(item, direction) {
  const sameCategory = shuffle(terms.filter((t) => t.category === item.category && t.term !== item.term));
  const others = shuffle(terms.filter((t) => t.category !== item.category));
  const distractors = [...sameCategory, ...others].slice(0, 3);
  const options = shuffle([item, ...distractors]);
  return {
    item,
    direction,
    options,
    answerIndex: options.indexOf(item),
  };
}

function startQuiz(questions) {
  quiz.questions = questions;
  quiz.index = 0;
  quiz.answers = [];
  showQuizScreen('play');
  renderQuestion();
}

function showQuizScreen(name) {
  $('quiz-setup').hidden = name !== 'setup';
  $('quiz-play').hidden = name !== 'play';
  $('quiz-result').hidden = name !== 'result';
  window.scrollTo({ top: 0 });
}

// ===== テスト：出題画面 =====
function renderQuestion() {
  const q = quiz.questions[quiz.index];
  const total = quiz.questions.length;
  quiz.answered = false;

  $('progress-text').textContent = `${quiz.index + 1} / ${total}問`;
  $('progress-bar').style.width = `${(quiz.index / total) * 100}%`;
  $('q-category').textContent = q.item.category;

  const qText = $('q-text');
  qText.textContent = '';
  if (q.direction === 'd2t') {
    $('q-label').textContent = 'この説明に当てはまる用語は？';
    qText.textContent = q.item.definition;
  } else {
    $('q-label').textContent = 'この用語の説明として正しいものは？';
    const term = document.createElement('span');
    term.className = 'q-term';
    term.textContent = q.item.term;
    const eng = document.createElement('span');
    eng.className = 'q-english';
    eng.textContent = q.item.english;
    qText.append(term, eng);
  }

  const optionsEl = $('options');
  optionsEl.textContent = '';
  q.options.forEach((opt, i) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'option';
    const key = document.createElement('span');
    key.className = 'option-key';
    key.textContent = String(i + 1);
    const label = document.createElement('span');
    label.textContent = q.direction === 'd2t' ? opt.term : opt.definition;
    btn.append(key, label);
    btn.addEventListener('click', () => answer(i));
    optionsEl.appendChild(btn);
  });

  $('feedback').hidden = true;
}

function answer(choice) {
  if (quiz.answered) return;
  quiz.answered = true;

  const q = quiz.questions[quiz.index];
  const correct = choice === q.answerIndex;
  quiz.answers.push({ question: q, correct });

  // 正解・不正解の色付け
  const buttons = $('options').querySelectorAll('.option');
  buttons.forEach((btn, i) => {
    btn.disabled = true;
    if (i === q.answerIndex) btn.classList.add('is-correct');
    else if (i === choice) btn.classList.add('is-wrong');
  });

  // 解説と使い方・例を表示
  const result = $('feedback-result');
  result.textContent = correct ? '⭕ 正解！' : '❌ 不正解';
  result.className = `feedback-result ${correct ? 'ok' : 'ng'}`;
  $('fb-term').textContent = q.item.term;
  $('fb-english').textContent = q.item.english;
  $('fb-definition').textContent = q.item.definition;
  $('fb-example').textContent = q.item.example;
  $('next-btn').textContent = quiz.index + 1 < quiz.questions.length ? '次へ' : '結果を見る';
  $('progress-bar').style.width = `${((quiz.index + 1) / quiz.questions.length) * 100}%`;
  $('feedback').hidden = false;
  $('next-btn').focus({ preventScroll: true });
  $('feedback').scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

function nextQuestion() {
  quiz.index++;
  if (quiz.index < quiz.questions.length) {
    renderQuestion();
    window.scrollTo({ top: 0 });
  } else {
    renderResult();
  }
}

// ===== テスト：結果画面 =====
function renderResult() {
  const total = quiz.answers.length;
  const correctCount = quiz.answers.filter((a) => a.correct).length;
  const rate = total ? Math.round((correctCount / total) * 100) : 0;
  $('score-rate').textContent = `${rate}%`;
  $('score-detail').textContent = `${total}問中 ${correctCount}問正解`;

  // 分野別正答率（出題された分野のみ）
  const statsEl = $('category-stats');
  statsEl.textContent = '';
  CATEGORIES.forEach((cat) => {
    const list = quiz.answers.filter((a) => a.question.item.category === cat);
    if (list.length === 0) return;
    const ok = list.filter((a) => a.correct).length;
    const r = Math.round((ok / list.length) * 100);
    const li = document.createElement('li');
    li.innerHTML = `
      <div class="stat-head"><span></span><span></span></div>
      <div class="stat-bar"><div></div></div>`;
    const [name, value] = li.querySelectorAll('.stat-head span');
    name.textContent = cat;
    value.textContent = `${r}%（${ok}/${list.length}）`;
    li.querySelector('.stat-bar > div').style.width = `${r}%`;
    statsEl.appendChild(li);
  });

  // 間違えた用語の一覧
  const wrong = quiz.answers.filter((a) => !a.correct);
  const wrongList = $('wrong-list');
  wrongList.textContent = '';
  wrong.forEach(({ question }) => {
    const li = document.createElement('li');
    const strong = document.createElement('strong');
    strong.textContent = `${question.item.term}（${question.item.english}）`;
    const p = document.createElement('span');
    p.textContent = question.item.definition;
    li.append(strong, p);
    wrongList.appendChild(li);
  });
  $('wrong-section').hidden = wrong.length === 0;
  $('retry-wrong-btn').hidden = wrong.length === 0;

  showQuizScreen('result');
}

// 間違えた問題だけで再出題（出題の向きは元のまま、選択肢は作り直す）
function retryWrong() {
  const questions = shuffle(quiz.answers.filter((a) => !a.correct))
    .map(({ question }) => buildQuestion(question.item, question.direction));
  if (questions.length > 0) startQuiz(questions);
}

function initQuiz() {
  $('next-btn').addEventListener('click', nextQuestion);
  $('retry-wrong-btn').addEventListener('click', retryWrong);
  $('back-setup-btn').addEventListener('click', () => showQuizScreen('setup'));
  $('quit-btn').addEventListener('click', () => {
    if (confirm('テストを中断して設定画面に戻りますか？')) showQuizScreen('setup');
  });

  // キーボード操作：1〜4で回答、Enterで次へ
  document.addEventListener('keydown', (e) => {
    if ($('view-quiz').hidden || $('quiz-play').hidden) return;
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    if (!quiz.answered && ['1', '2', '3', '4'].includes(e.key)) {
      answer(Number(e.key) - 1);
    } else if (quiz.answered && e.key === 'Enter' && document.activeElement !== $('next-btn')) {
      nextQuestion();
    }
  });
}

// ===== 単語帳 =====
function loadLearned() {
  try {
    const list = JSON.parse(storageGet(STORAGE_LEARNED) || '[]');
    learned = new Set(Array.isArray(list) ? list : []);
  } catch {
    learned = new Set();
  }
}

function saveLearned() {
  storageSet(STORAGE_LEARNED, JSON.stringify([...learned]));
}

function initCards() {
  const select = $('card-category');
  CATEGORIES.forEach((cat) => {
    const opt = document.createElement('option');
    opt.value = cat;
    opt.textContent = cat;
    select.appendChild(opt);
  });
  select.addEventListener('change', renderCards);
  $('only-unlearned').addEventListener('change', renderCards);
}

function renderCards() {
  const cat = $('card-category').value;
  const onlyUnlearned = $('only-unlearned').checked;
  const inCategory = terms.filter((t) => cat === 'all' || t.category === cat);
  const visible = inCategory.filter((t) => !onlyUnlearned || !learned.has(t.term));

  updateLearnedCount(inCategory);

  const grid = $('card-grid');
  grid.textContent = '';
  visible.forEach((item) => grid.appendChild(createCard(item)));
  $('cards-empty').hidden = visible.length > 0;
}

function updateLearnedCount(inCategory) {
  const done = inCategory.filter((t) => learned.has(t.term)).length;
  $('learned-count').textContent = `覚えた：${done} / ${inCategory.length}語`;
}

function createCard(item) {
  const card = document.createElement('div');
  card.className = 'card';
  card.classList.toggle('is-learned', learned.has(item.term));
  card.innerHTML = `
    <div class="card-flip" role="button" tabindex="0" aria-label="カードを裏返す">
      <div class="card-inner">
        <div class="card-face card-front">
          <span class="badge"></span>
          <div class="card-term"></div>
          <div class="muted card-english"></div>
          <span class="card-hint">タップで裏返す</span>
        </div>
        <div class="card-face card-back">
          <h4>説明</h4>
          <p class="card-def"></p>
          <h4>使い方・例</h4>
          <p class="card-ex"></p>
        </div>
      </div>
    </div>
    <button type="button" class="btn learn-btn"></button>`;

  card.querySelector('.badge').textContent = item.category;
  card.querySelector('.card-term').textContent = item.term;
  card.querySelector('.card-english').textContent = item.english;
  card.querySelector('.card-def').textContent = item.definition;
  card.querySelector('.card-ex').textContent = item.example;

  // クリック・Enter・スペースで裏返す
  const flip = card.querySelector('.card-flip');
  const toggleFlip = () => card.classList.toggle('is-flipped');
  flip.addEventListener('click', toggleFlip);
  flip.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      toggleFlip();
    }
  });

  // 「覚えた」の切替
  const learnBtn = card.querySelector('.learn-btn');
  const updateLearnBtn = () => {
    const isLearned = learned.has(item.term);
    learnBtn.textContent = isLearned ? '✓ 覚えた' : '覚えた にする';
    learnBtn.setAttribute('aria-pressed', String(isLearned));
    card.classList.toggle('is-learned', isLearned);
  };
  learnBtn.addEventListener('click', () => {
    if (learned.has(item.term)) learned.delete(item.term);
    else learned.add(item.term);
    saveLearned();
    updateLearnBtn();
    // 「未習得のみ」表示中なら一覧を更新して消す
    if ($('only-unlearned').checked) {
      renderCards();
    } else {
      const cat = $('card-category').value;
      updateLearnedCount(terms.filter((t) => cat === 'all' || t.category === cat));
    }
  });
  updateLearnBtn();

  return card;
}

// ===== 起動 =====
async function init() {
  initTheme();
  initTabs();
  loadLearned();

  try {
    const res = await fetch('terms.json');
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    terms = await res.json();
  } catch (err) {
    const el = $('load-error');
    el.textContent = `用語データ（terms.json）を読み込めませんでした。VS Code の Live Server で開いてください。（${err.message}）`;
    el.hidden = false;
    $('start-btn').disabled = true;
    return;
  }

  initSetup();
  initQuiz();
  initCards();
}

init();

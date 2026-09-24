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
  streak: 0,       // 連続正解数
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

// ===== キャラクター =====
// 役割分担：ビット＝テストの正誤／フキダシ＝単語帳の「覚えた」／トークン＝連続正解・結果・コンプリートなど特別な場面
// 色は CSS 変数（--char-*）で指定し、ライト／ダークで自動的に切り替わる
const CHARACTERS = {
  bit(mood) {
    const legs = '<rect x="32" y="74" width="8" height="10" fill="var(--char-body)"/><rect x="60" y="74" width="8" height="10" fill="var(--char-body)"/>';
    const body = '<rect x="22" y="22" width="56" height="52" rx="6" fill="var(--char-body)"/>';
    if (mood === 'happy') {
      return `<svg viewBox="0 -4 100 104">
        <line x1="50" y1="10" x2="50" y2="22" stroke="var(--char-body)" stroke-width="3"/><circle cx="50" cy="9" r="6" fill="#f2a03c"/>
        <path d="M44 4 L40 0 M56 4 L60 0 M50 1 V-3" stroke="#e8623c" stroke-width="2"/>
        ${body}
        <path d="M32 48 Q38 38 44 48 M56 48 Q62 38 68 48" fill="none" stroke="var(--char-face)" stroke-width="3.5" stroke-linecap="round"/>
        <path d="M40 57 Q50 69 60 57 Z" fill="var(--char-face)"/>
        <circle cx="30" cy="58" r="3" fill="#e8623c"/><circle cx="70" cy="58" r="3" fill="#e8623c"/>
        <path d="M22 40 L10 26 M78 40 L90 26" stroke="var(--char-body)" stroke-width="4" stroke-linecap="round"/>
        ${legs}</svg>`;
    }
    if (mood === 'sad') {
      return `<svg viewBox="0 -4 100 104">
        <path d="M50 22 Q50 14 58 12" fill="none" stroke="var(--char-body)" stroke-width="3"/><circle cx="59" cy="12" r="5" fill="#e8623c" opacity=".55"/>
        ${body}
        <path d="M33 45 L42 41 M67 45 L58 41" stroke="var(--char-face)" stroke-width="3" stroke-linecap="round"/>
        <rect x="35" y="48" width="7" height="6" rx="2" fill="var(--char-face)"/><rect x="58" y="48" width="7" height="6" rx="2" fill="var(--char-face)"/>
        <path d="M42 64 Q46 60 50 64 Q54 68 58 64" fill="none" stroke="var(--char-face)" stroke-width="2.5" stroke-linecap="round"/>
        <path d="M74 28 Q78 36 74 38 Q70 36 74 28 Z" fill="#3fb6a8"/>
        ${legs}</svg>`;
    }
    return `<svg viewBox="0 -4 100 104">
      <line x1="50" y1="10" x2="50" y2="22" stroke="var(--char-body)" stroke-width="3"/><circle cx="50" cy="9" r="5" fill="#e8623c"/>
      ${body}
      <rect x="34" y="40" width="8" height="12" rx="2" fill="var(--char-face)"/><rect x="58" y="40" width="8" height="12" rx="2" fill="var(--char-face)"/>
      <path d="M44 62 H56" stroke="var(--char-face)" stroke-width="3" stroke-linecap="round"/>
      ${legs}</svg>`;
  },

  fukidashi(mood) {
    const shape = 'fill="var(--char-fill)" stroke="var(--char-line)" stroke-width="3" stroke-linejoin="round"';
    if (mood === 'happy') {
      return `<svg viewBox="0 -4 104 104">
        <g transform="rotate(-6 50 50)"><path d="M14 20 H86 V68 H42 L26 84 V68 H14 Z" ${shape}/>
        <path d="M31 45 Q37 36 43 45 M57 45 Q63 36 69 45" fill="none" stroke="var(--char-line)" stroke-width="3" stroke-linecap="round"/>
        <path d="M42 51 Q50 62 58 51 Z" fill="var(--char-line)"/>
        <circle cx="28" cy="53" r="3" fill="#e8623c"/><circle cx="72" cy="53" r="3" fill="#e8623c"/></g>
        <path d="M88 8 L92 2 M94 16 L99 14 M82 4 L82 -2" stroke="#e8623c" stroke-width="2.5" stroke-linecap="round"/></svg>`;
    }
    if (mood === 'sad') {
      return `<svg viewBox="0 -4 104 104">
        <path d="M14 26 H86 V72 H42 L26 88 V72 H14 Z" ${shape}/>
        <path d="M32 44 H42 M58 44 H68" stroke="var(--char-line)" stroke-width="3" stroke-linecap="round"/>
        <path d="M44 58 Q50 54 56 58" fill="none" stroke="var(--char-line)" stroke-width="2.5" stroke-linecap="round"/>
        <path d="M80 32 Q84 40 80 42 Q76 40 80 32 Z" fill="#3fb6a8"/></svg>`;
    }
    return `<svg viewBox="0 -4 104 104">
      <path d="M14 20 H86 V68 H42 L26 84 V68 H14 Z" ${shape}/>
      <circle cx="38" cy="42" r="4" fill="var(--char-line)"/><circle cx="62" cy="42" r="4" fill="var(--char-line)"/>
      <path d="M45 53 Q50 57 55 53" fill="none" stroke="var(--char-line)" stroke-width="2.5" stroke-linecap="round"/>
      <path d="M70 30 H78" stroke="#e8623c" stroke-width="3"/></svg>`;
  },

  token(mood) {
    const coin = `<defs><linearGradient id="token-grad" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#e8623c"/><stop offset="1" stop-color="#f2a03c"/></linearGradient></defs>
      <circle cx="50" cy="50" r="36" fill="url(#token-grad)"/><circle cx="50" cy="50" r="29" fill="none" stroke="#fff" stroke-opacity=".45" stroke-width="2" stroke-dasharray="3 4"/>`;
    if (mood === 'happy') {
      return `<svg viewBox="0 -4 104 104">${coin}
        <path d="M33 48 Q40 38 47 48 M53 48 Q60 38 67 48" fill="none" stroke="#131313" stroke-width="3.5" stroke-linecap="round"/>
        <path d="M40 56 Q50 70 60 56 Z" fill="#131313"/>
        <path d="M84 16 L88 8 M90 24 L98 22 M78 10 L76 2" stroke="#e8623c" stroke-width="3" stroke-linecap="round"/>
        <path d="M20 22 L22 16 L24 22 L30 24 L24 26 L22 32 L20 26 L14 24 Z" fill="#f2a03c"/></svg>`;
    }
    if (mood === 'sad') {
      return `<svg viewBox="0 -4 104 104">${coin}
        <path d="M34 46 L44 42 M66 46 L56 42" stroke="#131313" stroke-width="3" stroke-linecap="round"/>
        <circle cx="40" cy="51" r="3.5" fill="#131313"/><circle cx="60" cy="51" r="3.5" fill="#131313"/>
        <path d="M44 63 Q50 59 56 63" fill="none" stroke="#131313" stroke-width="3" stroke-linecap="round"/>
        <path d="M82 22 Q86 30 82 32 Q78 30 82 22 Z" fill="#3fb6a8"/></svg>`;
    }
    return `<svg viewBox="0 -4 104 104">${coin}
      <circle cx="40" cy="46" r="4.5" fill="#131313"/><circle cx="60" cy="46" r="4.5" fill="#131313"/>
      <path d="M44 58 Q50 63 56 58" fill="none" stroke="#131313" stroke-width="3" stroke-linecap="round"/></svg>`;
  },
};

// セリフ集（テストに出てくる用語を使った、初心者向けのAIネタ）
const LINES = {
  correct: [
    'ハルシネーションじゃない、本物の正解！',
    'ナイス！その回答、そのままコミットしよう！',
    '正解！バグなしでビルド成功！',
    'いいね！頭の中のコンテキスト、冴えてる！',
    '正解！今のはプッシュしていいやつ！',
    'ナイス！APIより速いレスポンス！',
  ],
  wrong: [
    'ドンマイ！エラーメッセージは成長のヒント！',
    '大丈夫、デバッグすれば直る！',
    '惜しい！人間も学習データを増やせば精度は上がる！',
    'ドンマイ。本番環境じゃなくてよかった！',
    '次いこ！ここはローカル環境、何度でも試せる！',
  ],
  // {term} は覚えた用語に置き換える
  learned: [
    '「{term}」、記憶にセーブしました！',
    '「{term}」を脳内リポジトリにコミット！',
    '「{term}」、覚えた！えらい！',
    '「{term}」がコンテキストに追加されました！',
    '「{term}」のインストール完了！',
  ],
  // {n} は連続正解数
  combo: [
    '{n}問連続正解！トークンが止まらない！',
    '{n}連続！今日のあなた、利用制限なし！',
    '{n}連続正解！もはやAIエージェント並み！',
  ],
};

const pick = (list) => list[Math.floor(Math.random() * list.length)];

let mascotTimer = null;

// キャラクターを表示する。tone は見出しの色（ok／ng／special／normal）
function showMascot({ character, mood, label, tone, text }) {
  const el = $('mascot');
  clearTimeout(mascotTimer);
  // ヘッダーのすぐ下に出す
  const headerBottom = document.querySelector('.app-header').getBoundingClientRect().bottom;
  el.style.setProperty('--mascot-top', `${Math.max(headerBottom, 0) + 12}px`);
  el.dataset.mood = mood;
  el.dataset.tone = tone;
  $('mascot-char').innerHTML = CHARACTERS[character](mood);
  $('mascot-label').textContent = label;
  $('mascot-text').textContent = text;
  el.hidden = false;
  // 連続で呼ばれても登場アニメーションを最初から再生する
  el.classList.remove('is-showing', 'is-leaving');
  void el.offsetWidth;
  el.classList.add('is-showing');
  // セリフの長さに合わせて表示時間を決める（読み切れる長さ）
  mascotTimer = setTimeout(hideMascot, Math.min(4000, 1800 + text.length * 50));
}

function hideMascot() {
  const el = $('mascot');
  if (el.hidden) return;
  clearTimeout(mascotTimer);
  el.classList.add('is-leaving');
  mascotTimer = setTimeout(() => {
    el.hidden = true;
    el.classList.remove('is-showing', 'is-leaving');
  }, 250);
}

function initMascot() {
  $('mascot').addEventListener('click', hideMascot);
}

// テストの回答後：ビットが正誤に反応。連続正解の節目はトークンが登場
function reactToAnswer(correct, streak) {
  const isComboMilestone = streak === 3 || streak === 5 || (streak >= 10 && streak % 5 === 0);
  if (correct && isComboMilestone) {
    showMascot({ character: 'token', mood: 'happy', label: 'COMBO!', tone: 'special', text: pick(LINES.combo).replace('{n}', streak) });
  } else if (correct) {
    showMascot({ character: 'bit', mood: 'happy', label: 'NICE!', tone: 'ok', text: pick(LINES.correct) });
  } else {
    showMascot({ character: 'bit', mood: 'sad', label: "DON'T MIND", tone: 'ng', text: pick(LINES.wrong) });
  }
}

// 結果画面：トークンが正答率に応じてコメント
function reactToResult(rate) {
  if (rate === 100) {
    showMascot({ character: 'token', mood: 'happy', label: 'PERFECT!', tone: 'special', text: '全問正解！ROI（費用対効果）最高の勉強時間！' });
  } else if (rate >= 80) {
    showMascot({ character: 'token', mood: 'happy', label: 'GREAT!', tone: 'special', text: `${rate}%！もう本番環境にデプロイできるレベル！` });
  } else if (rate >= 50) {
    showMascot({ character: 'token', mood: 'normal', label: 'GOOD', tone: 'normal', text: `${rate}%！PoC（お試し導入）は成功、次は本番だ！` });
  } else {
    showMascot({ character: 'token', mood: 'sad', label: 'KEEP GOING', tone: 'normal', text: 'ここからが伸びしろ！間違えた問題だけ再挑戦しよう！' });
  }
}

// 単語帳で「覚えた」にしたとき：フキダシが反応。分野や全体をコンプリートしたらトークンが登場
function reactToLearned(item) {
  if (terms.every((t) => learned.has(t.term))) {
    showMascot({ character: 'token', mood: 'happy', label: 'COMPLETE!', tone: 'special', text: `全${terms.length}語コンプリート！あなたはもう人間LLM！` });
    return;
  }
  if (terms.filter((t) => t.category === item.category).every((t) => learned.has(t.term))) {
    showMascot({ character: 'token', mood: 'happy', label: 'COMPLETE!', tone: 'special', text: `「${item.category}」を全部覚えた！コンプリート！` });
    return;
  }
  showMascot({ character: 'fukidashi', mood: 'happy', label: 'SAVED', tone: 'ok', text: pick(LINES.learned).replace('{term}', item.term) });
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
  hideMascot();
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
  quiz.streak = 0;
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
  quiz.streak = correct ? quiz.streak + 1 : 0;
  reactToAnswer(correct, quiz.streak);

  // 正解・不正解の色付け
  const buttons = $('options').querySelectorAll('.option');
  buttons.forEach((btn, i) => {
    btn.disabled = true;
    if (i === q.answerIndex) btn.classList.add('is-correct');
    else if (i === choice) btn.classList.add('is-wrong');
  });

  // 解説と使い方・例を表示
  const result = $('feedback-result');
  result.textContent = correct ? '正解！' : '不正解';
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
  hideMascot();
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
  reactToResult(rate);
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
    if (learned.has(item.term)) {
      learned.delete(item.term);
    } else {
      learned.add(item.term);
      reactToLearned(item);
    }
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
  initMascot();
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

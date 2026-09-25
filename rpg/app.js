'use strict';

// ===== 定数 =====
const SAVE_KEY = 'aiYogoQuest.save.v1';
const BOSS_HITS = 4;      // ボスを倒すのに必要な正解数
const NORMAL_HITS = 2;    // ふつうのモンスターを倒すのに必要な正解数
const XP_CORRECT = 3;     // 1問正解ごとの経験値
const XP_NORMAL = 8;      // ふつうのモンスターを倒したときの経験値
const XP_BOSS = 30;       // ボスを倒したときの経験値
const TYPE_SPEED = 22;    // メッセージの1文字あたりの表示間隔（ミリ秒）

// ===== ドット絵 =====
// 1文字＝1ドット。X＝体、D＝影、Y＝アクセント、W＝白、K＝黒、M＝口、R＝赤、.＝透明
const SPRITES = {
  blob: [
    '....XXXX....',
    '..XXXXXXXX..',
    '.XXXXXXXXXX.',
    '.XXWKXXWKXX.',
    'XXXWKXXWKXXX',
    'XXXXXXXXXXXX',
    'XXXXXMMXXXXX',
    'XXXXXXXXXXXX',
    '.XXXXXXXXXX.',
    '..DDDDDDDD..',
  ],
  ghost: [
    '...XXXXXX...',
    '..XXXXXXXX..',
    '.XXXXXXXXXX.',
    '.XKKXXXXKKX.',
    '.XKWXXXXKWX.',
    '.XXXXXXXXXX.',
    'XXXXXMMXXXXX',
    'XXXXXMMXXXXX',
    '.XXXXXXXXXX.',
    '.XXXXXXXXXX.',
    '.XXX.XX.XXX.',
    '..X...X...X.',
  ],
  crownGhost: [
    '...Y.YY.Y...',
    '...YYYYYY...',
    '...XXXXXX...',
    '..XXXXXXXX..',
    '.XXXXXXXXXX.',
    '.XRRXXXXRRX.',
    '.XRWXXXXRWX.',
    '.XXXXXXXXXX.',
    'XXXXXMMXXXXX',
    'XXXXMMMMXXXX',
    '.XXXXXXXXXX.',
    '.XXXXXXXXXX.',
    '.XXX.XX.XXX.',
    '..X...X...X.',
  ],
  bat: [
    'X............X',
    'XX..........XX',
    'XXX..XXXX..XXX',
    'XXXXXXXXXXXXXX',
    '.XXXKWXXKWXXX.',
    '..XXXXXXXXXX..',
    '...XXWXXWXX...',
    '....XXXXXX....',
    '.....X..X.....',
  ],
  bug: [
    '..K......K..',
    '...K....K...',
    '...XXXXXX...',
    '..XWKXXWKX..',
    '..XXXXXXXX..',
    'K.DXXXXXXD.K',
    '.KDYXXXXYDK.',
    'K.DXYYYYXD.K',
    '.KDXXXXXXDK.',
    'K..DDDDDD..K',
    '...K....K...',
  ],
  golem: [
    '....DDDDDDDD....',
    '...DXXXXXXXXD...',
    '...DXYYXXYYXD...',
    '...DXXXXXXXXD...',
    '...DXXMMMMXXD...',
    '....DDDDDDDD....',
    '.DDXXXXXXXXXXDD.',
    'DXXXXXXXXXXXXXXD',
    'DXXDXXXXXXXXDXXD',
    'DXXDXXXYYXXXDXXD',
    'DXXDXXXYYXXXDXXD',
    'DDDDXXXXXXXXDDDD',
    '....XXXXXXXX....',
    '....XXX..XXX....',
    '...DXXX..XXXD...',
    '...DDDD..DDDD...',
  ],
  knight: [
    '..Y..........Y..',
    '..YY..DDDD..YY..',
    '...YDDXXXXDDY...',
    '....DXXXXXXD....',
    '....DKKKKKKD....',
    '....DKRKKRKD....',
    '....DXXXXXXD....',
    '.....DDDDDD.....',
    '..DDXXXXXXXXDD..',
    '.DXXXXYYYYXXXXD.',
    '.DXXXXXYYXXXXXDW',
    'DDXXXXXXXXXXXXDW',
    'D.DXXXXXXXXXXD.W',
    '...DXXX..XXXD..W',
    '...DXXX..XXXD.YY',
    '...DDDD..DDDD...',
  ],
};

// ===== エリアとモンスター =====
// 分野ごとに1エリア。前のエリアをクリアすると次に進める
const AREAS = [
  {
    name: 'ツールのそうげん',
    category: 'AIツール',
    intro: 'いろいろな AIツールの なまえが とびかう そうげんだ。',
    monsters: [
      { name: 'コピペむし', sprite: 'bug', colors: { body: '#7bc47f', dark: '#3f7a45', accent: '#f2c94c' } },
      { name: 'タブおばけ', sprite: 'ghost', colors: { body: '#a9d6f5', dark: '#5b8db0' } },
      { name: 'ログインこうもり', sprite: 'bat', colors: { body: '#9b7fd1', dark: '#5d4691' } },
    ],
    boss: { name: 'ツールまよい', sprite: 'golem', colors: { body: '#8fa35a', dark: '#4d5c2a', accent: '#f2c94c' }, line: 'ツールが おおすぎて えらべまい！ どれを つかうか まよわせてやろう！' },
  },
  {
    name: 'きほんのもり',
    category: 'AIの基本',
    intro: 'AIの しくみに まつわる ことばが ねむる ふかい もりだ。',
    monsters: [
      { name: 'トークンくい', sprite: 'blob', colors: { body: '#f2a03c', dark: '#b8661f' } },
      { name: 'わすれゴースト', sprite: 'ghost', colors: { body: '#c9b8f0', dark: '#7e6bb3' } },
      { name: 'あいまいプロンプト', sprite: 'blob', colors: { body: '#d9a3b8', dark: '#9a5f77' } },
    ],
    boss: { name: 'ハルシネーション', sprite: 'crownGhost', colors: { body: '#e36fd0', dark: '#8f2f80', accent: '#f2c94c' }, line: 'ほんとうっぽい ウソを たっぷり おしえてやろう…！' },
  },
  {
    name: 'コードのどうくつ',
    category: '操作・開発',
    intro: 'くらやみの おくで エラーが うごめく どうくつだ。',
    monsters: [
      { name: 'バグ', sprite: 'bug', colors: { body: '#e8623c', dark: '#8f3018', accent: '#f2c94c' } },
      { name: 'エラーこうもり', sprite: 'bat', colors: { body: '#c0392b', dark: '#6e1f17' } },
      { name: 'タイポだま', sprite: 'blob', colors: { body: '#3fb6a8', dark: '#1f7068' } },
    ],
    boss: { name: 'ビルドエラーゴーレム', sprite: 'golem', colors: { body: '#9a9a9a', dark: '#4f4f4f', accent: '#ff4d4d' }, line: 'この さきへは ビルドさせんぞ！ まっかな エラーで うめつくしてやる！' },
  },
  {
    name: 'ビジネスのしろ',
    category: '仕事・導入',
    intro: 'AI導入を はばむ ものたちが まちうける しろだ。',
    monsters: [
      { name: 'シャドーAI', sprite: 'ghost', colors: { body: '#6b6b7a', dark: '#34343d' } },
      { name: 'ろうえいこうもり', sprite: 'bat', colors: { body: '#3d5a99', dark: '#1f2f55' } },
      { name: 'PoCゾンビ', sprite: 'blob', colors: { body: '#8ca38a', dark: '#4d5e4b' } },
    ],
    boss: { name: 'ぜんれいナイト', sprite: 'knight', colors: { body: '#4a4a55', dark: '#1f1f26', accent: '#f2c94c' }, line: 'ぜんれいが ない！ よって きゃっかだ！ AIなど みとめんぞ！' },
  },
];

// ===== 状態 =====
let terms = [];
let termByName = {};
let save = null;   // { name, xp, cleared: [bool...], endingSeen, run: { area, queue, monsterIdx, monsterHp, hp } | null }

// ===== ユーティリティ =====
const $ = (id) => document.getElementById(id);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const reduceMotion = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
const randInt = (min, max) => min + Math.floor(Math.random() * (max - min + 1));

function shuffle(array) {
  const a = array.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// ===== セーブ（localStorage は使えない環境もあるので try/catch で包む） =====
function loadSave() {
  try {
    const data = JSON.parse(localStorage.getItem(SAVE_KEY));
    return data && typeof data.name === 'string' ? data : null;
  } catch {
    return null;
  }
}

function persist() {
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify(save));
  } catch {
    // 保存できなくても遊べるようにする
  }
}

function newSave(name) {
  return { name, xp: 0, cleared: AREAS.map(() => false), endingSeen: false, run: null };
}

// ===== レベル・称号 =====
// レベル L に必要な累計経験値：10 × (L-1) × L（Lv2＝20、Lv3＝60、Lv4＝120 …）
const xpForLevel = (level) => 10 * (level - 1) * level;

function levelOf(xp) {
  let level = 1;
  while (xp >= xpForLevel(level + 1)) level++;
  return level;
}

const maxHp = (level) => 20 + (level - 1) * 5;

function titleOf(level) {
  if (level >= 7) return 'AIの けんじゃ';
  if (level >= 5) return 'RAGまどうし';
  if (level >= 3) return 'プロンプトつかい';
  return 'AIみならい';
}

// ===== ドット絵の描画 =====
function spriteSVG(monster) {
  const rows = SPRITES[monster.sprite];
  const palette = {
    X: monster.colors.body,
    D: monster.colors.dark,
    Y: monster.colors.accent || '#f2c94c',
    W: '#ffffff',
    K: '#111111',
    M: '#4a1010',
    R: '#ff4d4d',
  };
  const width = rows[0].length;
  let rects = '';
  rows.forEach((row, y) => {
    // 横に並んだ同じ色はまとめて1つの四角にする
    let x = 0;
    while (x < width) {
      const c = row[x];
      let run = 1;
      while (x + run < width && row[x + run] === c) run++;
      if (c !== '.') rects += `<rect x="${x}" y="${y}" width="${run}" height="1" fill="${palette[c]}"/>`;
      x += run;
    }
  });
  return `<svg viewBox="0 0 ${width} ${rows.length}" width="${width * 12}" height="${rows.length * 12}" shape-rendering="crispEdges" aria-hidden="true">${rects}</svg>`;
}

// ===== 画面切替 =====
function showScreen(name) {
  document.querySelectorAll('.screen').forEach((el) => {
    el.hidden = el.id !== `screen-${name}`;
  });
}

// ===== メッセージウィンドウ =====
// say() は1文字ずつ表示し、タップ／Enter で次へ進むまで待つ
let advance = null;

function say(text) {
  return new Promise((resolve) => {
    const win = $('message');
    const el = $('message-text');
    hideCommands();
    win.hidden = false;
    win.classList.remove('can-next');
    const chars = [...text];
    let i = 0;
    let timer = null;

    const finish = () => {
      clearInterval(timer);
      el.textContent = text;
      win.classList.add('can-next');
      advance = () => {
        advance = null;
        win.classList.remove('can-next');
        resolve();
      };
    };

    advance = finish;
    if (reduceMotion()) {
      finish();
      return;
    }
    el.textContent = '';
    timer = setInterval(() => {
      el.textContent += chars[i++];
      if (i >= chars.length) finish();
    }, TYPE_SPEED);
  });
}

// ===== コマンドウィンドウ =====
// choose() は選択肢を並べ、選ばれた番号を返す。prompt を渡すとメッセージ欄に表示する
let activeChoice = null;

function choose(options, { prompt = null, cancelIndex = null } = {}) {
  return new Promise((resolve) => {
    const win = $('commands');
    const msg = $('message');
    if (prompt) {
      msg.hidden = false;
      msg.classList.remove('can-next');
      $('message-text').textContent = prompt;
    } else {
      msg.hidden = true;
    }
    win.textContent = '';
    const buttons = options.map((label, i) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'cmd';
      btn.setAttribute('role', 'menuitem');
      const cursor = document.createElement('span');
      cursor.className = 'cmd-cursor';
      cursor.textContent = '▶';
      const text = document.createElement('span');
      text.className = 'cmd-label';
      text.textContent = label;
      btn.append(cursor, text);
      btn.addEventListener('click', () => select(i));
      // マウスを実際に動かしたときだけカーソルを合わせる（表示直後にカーソルが飛ばないように）
      btn.addEventListener('mousemove', () => {
        if (activeChoice && activeChoice.index !== i) focusAt(i);
      });
      win.appendChild(btn);
      return btn;
    });
    win.hidden = false;

    const focusAt = (i) => {
      activeChoice.index = i;
      buttons.forEach((b, j) => b.classList.toggle('is-focused', j === i));
    };
    const select = (i) => {
      if (!activeChoice) return;
      activeChoice = null;
      win.hidden = true;
      resolve(i);
    };
    activeChoice = { index: 0, count: options.length, focusAt, select, cancelIndex };
    focusAt(0);
  });
}

function hideCommands() {
  $('commands').hidden = true;
  activeChoice = null;
}

// キーボード操作：↑↓で選択、Enter／Space で決定、数字キーで直接選択、Esc でキャンセル
function initInput() {
  $('message').addEventListener('click', () => advance?.());
  document.addEventListener('keydown', (e) => {
    if (e.target instanceof HTMLInputElement) return;
    if (activeChoice) {
      const c = activeChoice;
      if (e.key === 'ArrowDown') { e.preventDefault(); c.focusAt((c.index + 1) % c.count); }
      else if (e.key === 'ArrowUp') { e.preventDefault(); c.focusAt((c.index - 1 + c.count) % c.count); }
      else if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); c.select(c.index); }
      else if (/^[1-9]$/.test(e.key) && Number(e.key) <= c.count) { c.select(Number(e.key) - 1); }
      else if (e.key === 'Escape' && c.cancelIndex !== null) { c.select(c.cancelIndex); }
      return;
    }
    if (advance && (e.key === 'Enter' || e.key === ' ' || e.key === 'z')) {
      e.preventDefault();
      advance();
    }
  });
}

// ===== 演出 =====
function effect(el, className, ms) {
  if (reduceMotion()) return;
  el.classList.remove(className);
  void el.offsetWidth;
  el.classList.add(className);
  setTimeout(() => el.classList.remove(className), ms);
}

// ===== ステータス表示 =====
function hpClass(hp, max) {
  if (hp <= 0) return 'is-dead';
  if (hp <= max * 0.3) return 'is-low';
  return '';
}

function renderStatus(el, { hp, compact = false }) {
  const level = levelOf(save.xp);
  const max = maxHp(level);
  const current = hp ?? max;
  el.className = `window status-window ${compact ? 'status-compact' : ''} ${hpClass(current, max)}`;
  const rows = [
    ['', save.name],
    ['Lv', level],
    ['HP', `${current}/${max}`],
  ];
  if (!compact) {
    const next = xpForLevel(level + 1) - save.xp;
    rows.push(['EXP', save.xp], ['つぎのLvまで', next], ['しょうごう', titleOf(level)]);
  }
  el.textContent = '';
  rows.forEach(([key, value]) => {
    const row = document.createElement('p');
    row.className = key ? 'status-row' : 'status-name';
    if (key) {
      const k = document.createElement('span');
      k.textContent = key;
      const v = document.createElement('span');
      v.textContent = value;
      row.append(k, v);
    } else {
      row.textContent = value;
    }
    el.appendChild(row);
  });
}

// ===== 経験値とレベルアップ =====
async function gainXp(amount) {
  const before = levelOf(save.xp);
  save.xp += amount;
  const after = levelOf(save.xp);
  if (after === before) return;
  const add = maxHp(after) - maxHp(before);
  if (save.run) save.run.hp += add;
  persist();
  renderStatus($('battle-status'), { hp: save.run?.hp, compact: true });
  await say(`${save.name}の レベルが ${after}に あがった！\nさいだいHPが ${add} あがった！`);
  if (titleOf(after) !== titleOf(before)) {
    await say(`しょうごう「${titleOf(after)}」を てにいれた！`);
  }
}

// ===== 問題づくり =====
// 誤答の選択肢は同じ分野から選ぶ（本家アプリと同じルール）
function buildQuestion(item, direction) {
  const same = shuffle(terms.filter((t) => t.category === item.category && t.term !== item.term));
  const options = shuffle([item, ...same.slice(0, 3)]);
  return { item, direction, options, answerIndex: options.indexOf(item) };
}

function showQuestion(q) {
  $('question').hidden = false;
  const text = $('question-text');
  text.textContent = '';
  if (q.direction === 'd2t') {
    $('question-label').textContent = 'もんだい：この せつめいに あう ことばは？';
    text.textContent = q.item.definition;
    text.classList.remove('is-term');
  } else {
    $('question-label').textContent = 'もんだい：この ことばの いみは？';
    const term = document.createElement('span');
    term.textContent = q.item.term;
    const eng = document.createElement('small');
    eng.textContent = q.item.english;
    text.append(term, eng);
    text.classList.add('is-term');
  }
}

// ===== エリアの構成 =====
// エリアの全用語に1回ずつ正解するとクリア。最後の BOSS_HITS 問がボス戦
function monsterPlan(area) {
  const total = terms.filter((t) => t.category === area.category).length;
  const plan = [];
  let remaining = total - BOSS_HITS;
  let k = 0;
  while (remaining > 0) {
    const hits = Math.min(NORMAL_HITS, remaining);
    plan.push({ ...area.monsters[k % area.monsters.length], hits, boss: false });
    remaining -= hits;
    k++;
  }
  plan.push({ ...area.boss, hits: BOSS_HITS, boss: true });
  return plan;
}

function renderMonster(monster, hp) {
  const el = $('monster');
  el.innerHTML = spriteSVG(monster);
  el.classList.toggle('is-boss', monster.boss);
  $('monster-name').textContent = monster.name;
  renderMonsterHp(monster, hp);
}

function renderMonsterHp(monster, hp) {
  $('monster-hp').textContent = '■'.repeat(hp) + '□'.repeat(monster.hits - hp);
}

// ===== 戦闘 =====
// 戻り値：'clear'（クリア）／'lose'（ちからつきた）／'escape'（にげた）
async function runArea(areaIndex) {
  const area = AREAS[areaIndex];
  const plan = monsterPlan(area);
  showScreen('battle');
  $('question').hidden = true;
  $('area-name').textContent = area.name;
  $('monster').innerHTML = '';
  $('monster-name').textContent = '';
  $('monster-hp').textContent = '';

  if (!save.run || save.run.area !== areaIndex) {
    const queue = shuffle(terms.filter((t) => t.category === area.category)).map((t) => t.term);
    save.run = { area: areaIndex, queue, monsterIdx: 0, monsterHp: plan[0].hits, hp: maxHp(levelOf(save.xp)) };
    persist();
    renderStatus($('battle-status'), { hp: save.run.hp, compact: true });
    await say(`${area.name}に やってきた！\n${area.intro}`);
  } else {
    renderStatus($('battle-status'), { hp: save.run.hp, compact: true });
    await say(`${area.name}の ぼうけんを つづきから はじめます。`);
  }
  const run = save.run;

  while (run.monsterIdx < plan.length) {
    const monster = plan[run.monsterIdx];
    renderMonster(monster, run.monsterHp);
    effect($('monster'), 'is-appear', 500);
    await say(`${monster.name}が あらわれた！`);
    if (monster.boss && run.monsterHp === monster.hits) {
      await say(`${monster.name}「${monster.line}」`);
    }

    while (run.monsterHp > 0) {
      const item = termByName[run.queue[0]];
      const q = buildQuestion(item, monster.boss ? 't2d' : 'd2t');
      showQuestion(q);
      const labels = q.options.map((o) => (q.direction === 'd2t' ? o.term : o.definition));
      const choice = await choose([...labels, 'にげる'], { cancelIndex: 4 });
      $('question').hidden = true;

      if (choice === 4) {
        await say(`${save.name}は にげだした！\n（つづきは また あとで あそべます）`);
        persist();
        return 'escape';
      }

      if (choice === q.answerIndex) {
        run.queue.shift();
        run.monsterHp--;
        persist();
        effect($('monster'), 'is-hit', 450);
        renderMonsterHp(monster, run.monsterHp);
        await say(`${save.name}の こうげき！ ${monster.name}に ダメージ！\nせいかい「${item.term}」\n${item.example}`);
        await gainXp(XP_CORRECT);
      } else {
        // まちがえた問題は あとで もう一度出す
        run.queue.push(run.queue.shift());
        const damage = monster.boss ? randInt(6, 8) : randInt(3, 5);
        run.hp = Math.max(0, run.hp - damage);
        persist();
        effect($('game'), 'is-shake', 400);
        renderStatus($('battle-status'), { hp: run.hp, compact: true });
        await say(`${monster.name}の こうげき！ ${save.name}は ${damage}の ダメージを うけた！\nせいかいは「${item.term}」\n${item.definition}`);

        if (run.hp === 0) {
          await say(`${save.name}は ちからつきた…`);
          await say('でも けいけんちは のこっている。\nレベルを あげて もういちど いどもう！');
          save.run = null;
          persist();
          return 'lose';
        }
      }
    }

    // モンスターを倒した
    effect($('monster'), 'is-defeated', 700);
    await sleep(reduceMotion() ? 0 : 600);
    $('monster').innerHTML = '';
    $('monster-hp').textContent = '';
    const xp = monster.boss ? XP_BOSS : XP_NORMAL;
    await say(`${monster.name}を やっつけた！\n${xp}ポイントの けいけんちを かくとく！`);
    await gainXp(xp);
    run.monsterIdx++;
    if (run.monsterIdx < plan.length) run.monsterHp = plan[run.monsterIdx].hits;
    persist();
  }

  const firstClear = !save.cleared[areaIndex];
  save.cleared[areaIndex] = true;
  save.run = null;
  persist();
  await say(`${area.name}を クリアした！`);
  // はじめてクリアしたときだけ、次のエリアの解放を知らせる
  if (firstClear && areaIndex + 1 < AREAS.length) {
    await say(`あたらしい ばしょ「${AREAS[areaIndex + 1].name}」へ いけるように なった！`);
  }
  return 'clear';
}

// ===== ワールドマップ =====
const isUnlocked = (i) => i === 0 || save.cleared[i - 1];

function renderMap() {
  renderStatus($('map-status'), {});
  const list = $('map-areas');
  list.textContent = '';
  AREAS.forEach((area, i) => {
    const li = document.createElement('li');
    const state = save.cleared[i] ? 'is-cleared' : isUnlocked(i) ? 'is-open' : 'is-locked';
    li.className = `map-area ${state}`;
    const name = document.createElement('span');
    name.textContent = isUnlocked(i) ? area.name : '？？？？？';
    const badge = document.createElement('span');
    badge.className = 'map-badge';
    badge.textContent = save.cleared[i] ? 'CLEAR' : save.run?.area === i ? 'とちゅう' : isUnlocked(i) ? '' : 'LOCK';
    li.append(name, badge);
    list.appendChild(li);
  });
}

// 戻り値：タイトルに戻るとき
async function mapLoop() {
  while (true) {
    showScreen('map');
    renderMap();
    const labels = AREAS.map((area, i) => (isUnlocked(i) ? area.name : '？？？？？'));
    const i = await choose([...labels, 'タイトルに もどる'], { prompt: 'どこへ いきますか？', cancelIndex: AREAS.length });
    if (i === AREAS.length) return;
    if (!isUnlocked(i)) {
      await say('まだ その ばしょへは いけない。\nまえの エリアを クリアしよう。');
      continue;
    }
    const result = await runArea(i);
    if (result === 'clear' && save.cleared.every(Boolean) && !save.endingSeen) {
      await ending();
    }
  }
}

// ===== エンディング =====
async function ending() {
  showScreen('ending');
  renderStatus($('ending-status'), {});
  await say('すべての エリアの モンスターを やっつけた！');
  await say(`${save.name}の かつやくで、\nAIの せかいに へいわが もどった。`);
  await say(`ひとびとは ${save.name}を\n「${titleOf(levelOf(save.xp))}」と よんで たたえた。`);
  save.endingSeen = true;
  persist();
  await choose(['ぼうけんを つづける'], { prompt: 'THE END　—　あそんでくれて ありがとう！' });
}

// ===== タイトルと名前入力 =====
function askName() {
  return new Promise((resolve) => {
    showScreen('name');
    $('message').hidden = true;
    hideCommands();
    const form = $('name-form');
    const input = $('name-input');
    input.value = '';
    input.focus();
    form.onsubmit = (e) => {
      e.preventDefault();
      form.onsubmit = null;
      input.blur();
      resolve(input.value.trim() || 'ゆうしゃ');
    };
  });
}

async function titleScreen() {
  while (true) {
    showScreen('title');
    save = loadSave();
    const options = save ? ['つづきから', 'はじめから'] : ['はじめから'];
    const i = await choose(options, { prompt: 'ボタンを えらんでください' });
    if (options[i] === 'つづきから') return;
    if (save) {
      const ok = await choose(['はい', 'いいえ'], { prompt: 'いまの ぼうけんの きろくは きえます。\nよろしいですか？', cancelIndex: 1 });
      if (ok !== 0) continue;
    }
    const name = await askName();
    save = newSave(name);
    persist();
    showScreen('title');
    await say('ここは AIの せかい。');
    await say('わけの わからない ことばの モンスターが あふれ、\nひとびとは こまっていた…。');
    await say(`${name}よ！ ことばの ちからで モンスターを たおし、\nせかいを すくうのだ！`);
    return;
  }
}

// ===== 起動 =====
async function init() {
  initInput();
  try {
    const res = await fetch('../terms.json');
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    terms = await res.json();
    termByName = Object.fromEntries(terms.map((t) => [t.term, t]));
  } catch (err) {
    const el = $('load-error');
    el.textContent = `ようごデータ（terms.json）を よみこめませんでした。VS Code の Live Server で ひらいてください。（${err.message}）`;
    el.hidden = false;
    return;
  }

  while (true) {
    await titleScreen();
    await mapLoop();
  }
}

init();

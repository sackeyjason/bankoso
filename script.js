/* If you're feeling fancy you can add interactivity 
    to your site with Javascript */

// prints "hi" in the browser's dev tools console

const TILE_SIZE = 32;
const LEVEL_WIDTH = 25;
const LEVEL_HEIGHT = 15;
const cellColours = {
  '1': '#EEE',
  '.': '#555',
  'E': '#222'
}
const state = {
  level: [[1, 1, 0, 1, '']],
  boxes: [],
  stage: 0,
  doors: []
}
const player = {}
let render = () => { }

function Box(x, y) {
  this.x = x;
  this.y = y;
}
Box.prototype.colour = '#85144b';
Box.prototype.goalColour = '#3D9970';

function buildLevel(data) {
  const level = new Array(LEVEL_HEIGHT).fill([]);
  state.boxes = [];
  state.doors = [];

  data.split('\n').forEach((row, y) => {
    const levelRow = new Array(LEVEL_WIDTH).fill(0);
    row.split('').forEach((cell, x) => {
      if (cell === '@') {
        player.x = x
        player.y = y
      } else if (cell === 'X') {
        state.boxes.push(new Box(x, y))
      } else if (cell === 'D') {
        levelRow[x] = 1;
        state.doors.push({ x, y });
      } else if (cell === ' ') {
        levelRow[x] = 0;
      } else {
        levelRow[x] = isNaN(parseInt(cell)) ? cell : Number(cell)
      }
    })
    level[y] = levelRow;
  });
  return level;
}

// async function loadLevel(url) {
//   return fetch(url).then(response => {
//     if (!response.ok) throw new Error("Bad fetch");
//     return response.text();
//   })
//     .then(buildLevel);
// }

function drawLevel(ctx) {
  state.level.forEach((row, y) => {
    row.forEach((cell, x) => {
      if (cell) {
        const wx = x * TILE_SIZE;
        const wy = y * TILE_SIZE;
        ctx.beginPath()
        ctx.rect(wx, wy, TILE_SIZE, TILE_SIZE)
        if (Object.keys(cellColours).indexOf(String(cell)) > -1) {
          ctx.fillStyle = cellColours[cell]
        }
        ctx.fill()
      }
    })
  })
}

function drawBoxes(ctx) {
  state.boxes.forEach(box => {
    const wx = box.x * TILE_SIZE;
    const wy = box.y * TILE_SIZE;
    ctx.beginPath()
    ctx.rect(wx, wy, TILE_SIZE, TILE_SIZE)
    ctx.fillStyle = box.onGoal ? box.goalColour : box.colour
    ctx.fill()
  });
}

function drawPlayer(ctx) {
  const x = player.x * TILE_SIZE + 5
  const y = player.y * TILE_SIZE + 23
  ctx.fillStyle = 'red'
  ctx.font = '24px Arial'
  ctx.fillText('@', x, y)
}

const makeRenderer = (ctx) => () => {
  ctx.beginPath();
  ctx.rect(0, 0, 800, 480);
  ctx.fillStyle = "#222";
  ctx.fill();
  drawLevel(ctx)
  drawBoxes(ctx)
  drawPlayer(ctx)
}

function completionCheck() {
  const completedBoxes = state.boxes.filter(box => box.onGoal);
  return completedBoxes.length === state.boxes.length;
}

function openDoor() {
  state.doors.forEach(door => {
    state.level[door.y][door.x] = 0;
  });
}

function endLevel() {
  if (state.stage + 1 < levels.length) {
    state.stage = state.stage + 1;
    startLevel(levels[state.stage]);
  } else {
    endGame();
  }
}

/**
 * Move, or attempt to move something
 * @param {Object} thing
 * @param {string} direction 
 */
function move(thing, direction) {
  //console.log(typeof thing)
  let dx = thing.x;
  let dy = thing.y;
  (direction === 'up') && --dy;
  (direction === 'down') && ++dy;
  (direction === 'left') && --dx;
  (direction === 'right') && ++dx;

  if (dx < 0 || dy < 0
    || dx > LEVEL_WIDTH - 1
    || dy > LEVEL_HEIGHT - 1
  ) return 0;

  if (state.level[dy] && state.level[dy][dx] == 1) {
    return 0;
  }

  {
    // push into box
    const boxThere = state.boxes.find(box =>
      (box.x === dx && box.y === dy)
    );
    let movedBox = 0;
    if (boxThere) {
      movedBox = move(boxThere, direction);
      if (!movedBox) return 0;
    }
  }

  thing.x = dx;
  thing.y = dy;
  thing.onGoal = (state.level[dy][dx] === '.');
  if (thing.constructor.name === 'Box') {
    if (completionCheck()) openDoor();
  } else {
    // player?
    console.log('player', player);
    if (state.level[player.y][player.x] === 'E') {
      endLevel();
    }
  }

  console.log(thing, thing.prototype);
  return 1;
}

function handleKeydown(event) {
  if (event.keyCode === 38) move(player, 'up')
  if (event.keyCode === 40) move(player, 'down')
  if (event.keyCode === 37) move(player, 'left')
  if (event.keyCode === 39) move(player, 'right')
  if (event.keyCode === 13 || event.keyCode === 32) {
    const e = new Event('game.startLevel');
    game.dispatchEvent(e);
  }
  if (event.keyCode === 27) {
    startLevel(levels[state.stage]);
    return;
  }
  render();
}

function startLevel(level) {
  console.log('level', level)
  const start = () => {
    state.level = buildLevel(level.data);
    game.removeEventListener('game.startLevel', start);
    document.querySelector('.level-intro').classList.add('fade-out')
  }
  document.querySelector('.level-intro').classList.remove('fade-out')
  document.querySelector('.level-intro span').textContent =
    "Stage " + (levels.indexOf(level) + 1) + ': ' + level.name;
  game.addEventListener('game.startLevel', start);

  render();
}

async function init() {
  startLevel(levels[0]);
  canvas = document.createElement('canvas')
  canvas.width = 800
  canvas.height = 480
  game.appendChild(canvas)
  const ctx = canvas.getContext("2d")
  console.log(state.level)
  render = makeRenderer(ctx)
  render()
  document.addEventListener('keydown', handleKeydown);
}

function endGame() {

};

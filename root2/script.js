// @ts-nocheck

// #region constants
const canvas = document.querySelector('canvas');
const ctx = canvas.getContext('2d');
const rect = canvas.getBoundingClientRect();
// #endregion

// #region vars

let createGoalCarMode = false;
let createStartCarMode = false; //mode to spawn a car
let eraseMode = false; // delete targets instead of creating them

let starCarPosition = { x: -1, y: -1, degree: 0 };
let goalCarPosition = { x: -1, y: -1, degree: 0 };

let targets = []; // [pos1, pos2, name, color][]
let resetTargets = []; // for "z" and "y"
let elementIDCounter = 0;

let lastPos = { x: -1, y: -1 };

const getModeStr = () => (eraseMode ? 'Erase mode' : 'Create mode');
// #endregion

// #region event listeners
// key modifier: "e", "z" and "y"
document.addEventListener('keydown', (e) => {
  switch (e.keyCode) {
    case 69: // "e"
      eraseMode = !eraseMode; // switch erase mode
      // update the titel
      document.getElementById('mode').innerHTML = getModeStr();
      break;
    case 90: // "z"
      if (targets.length > 0) deleteTarget(targets[targets.length - 1][2]); // delete the last target
      updateScreen(); // redraw everything
      break;
    case 89: // "y"
      const val = resetTargets.pop();
      if (val !== undefined) {
        // an element can be restored
        targets.push(val); // readd the target
        document.getElementById('mode').innerHTML =
          getModeStr() + ' - Restored last deleted obstacle';
        setTimeout(() => {
          document.getElementById('mode').innerHTML = getModeStr();
        }, 2000);
      }
      updateScreen();
      break;
  }
});

canvas.addEventListener('mousemove', (e) => {
  if (createStartCarMode || createGoalCarMode) return;
  // set titel to current coords
  document.getElementById('xy').innerHTML =
    getAbsCoordinates(e).x.toFixed(1) +
    'px , y: ' +
    (canvas.height - getAbsCoordinates(e).y).toFixed(1) +
    ' px';

  if (eraseMode || lastPos.x == -1) return;

  updateScreen();

  // #region draw a new target
  const pos2 = getAbsCoordinates(e);
  // start drawing the new rect
  ctx.beginPath();
  ctx.fillStyle = 'rgba(10,10,10,0.5)';
  // the new rect
  ctx.rect(lastPos.x, lastPos.y, pos2.x - lastPos.x, pos2.y - lastPos.y);
  ctx.fill(); // render the rect
  // #endregion
});

canvas.addEventListener('mousedown', (e) => {
  if (createStartCarMode || createGoalCarMode) return;
  // save the click position to create a target with this as one of its corners
  if (!eraseMode) lastPos = getAbsCoordinates(e);
});

canvas.addEventListener('mouseup', (e) => {
  if (createStartCarMode) {
    const cord = getAbsCoordinates(e);
    spawnCar(cord.x, cord.y);
    return;
  } else if (createGoalCarMode) {
    const cord = getAbsCoordinates(e);
    spawnGoal(cord.x, cord.y);
    return;
  } else if (eraseMode) {
    const curPos = getAbsCoordinates(e);

    const oldLen = targets.length;
    for (let i = 0; i < targets.length; ++i) {
      const target = targets[i];

      // #region check if it hits it
      let x1 = -1;
      let x2 = -1; // the bigger one
      if (target[0].x < target[1].x) {
        x1 = target[0].x;
        x2 = target[1].x;
      } else {
        x2 = target[0].x;
        x1 = target[1].x;
      }

      let y1 = -1;
      let y2 = -1; // the bigger one
      if (target[0].y < target[1].y) {
        y1 = target[0].y;
        y2 = target[1].y;
      } else {
        y2 = target[0].y;
        y1 = target[1].y;
      }

      const isBetweenX = curPos.x >= x1 && curPos.x <= x2;
      const isBetweenY = curPos.y >= y1 && curPos.y <= y2;
      // #endregion

      if (isBetweenX && isBetweenY) deleteTarget(target[2]); // delete the target if same position
    }

    console.log('Deleted ' + (oldLen - targets.length) + ' targets');

    updateScreen();
  } else {
    if (lastPos.x === -1) return;

    // normal mode
    resetTargets = []; // reset the previous stored deleted targets

    // push new [pos1, pos2, name, color]
    targets.push([
      lastPos,
      getAbsCoordinates(e),
      elementIDCounter.toString(),
      [10, 10, 10]
    ]);
    elementIDCounter++;

    updateScreen();

    lastPos = { x: -1, y: -1 }; // reset position for next target
  }
});
// #endregion

// #region functions
function getAbsCoordinates(event) {
  return {
    x: parseFloat(((event.clientX - rect.left) * (10 / 3)).toFixed(2)),
    y: parseFloat(((event.clientY - rect.top) * (10 / 3)).toFixed(2))
  };
}

function drawTargets() {
  for (const target of targets) {
    ctx.beginPath();
    ctx.fillStyle = `rgba(${target[3][0]},${target[3][1]},${target[3][2]},0.5)`;
    ctx.rect(
      target[0].x,
      target[0].y,
      target[1].x - target[0].x,
      target[1].y - target[0].y
    );
    ctx.fill();
  }
}

function clearCanvas() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
}

function onInputFieldChange() {
  for (let i = 0; i < targets.length; ++i) {
    const newVal = document.getElementById(targets[i][2]).value;

    // update the id and name to the new value
    document.getElementById(targets[i][2]).id = newVal;
    targets[i][2] = newVal.toString();
  }
}

function dataToHTML() {
  let result = '';

  // #region car data
  result +=
    `<div style="
              border-style: solid;
              height: 80px;
              margin-left: 20px;
              margin-right: 20px;
              border-color: rgb(0, 0, 0);
              margin-bottom: 10px;
            "
          >
            <p>
              Start car: { x: ` +
    starCarPosition.x +
    `, y: ` +
    starCarPosition.y +
    ', heading: ' +
    starCarPosition.degree +
    ` } <br />
              End car { x: ` +
    goalCarPosition.x +
    `, y: ` +
    goalCarPosition.y +
    ', heading: ' +
    goalCarPosition.degree +
    ` }   </p>
          </div>
        </div>`;
  // #endregion

  // create for each target a div with all the values
  for (const target of targets) {
    const deltaX = target[0].x - target[1].x;
    const deltaY = target[0].y - target[1].y;
    const len = Math.floor((deltaX ** 2 + deltaY ** 2) ** 0.5);

    result +=
      `<div

            style="
              border-style: solid;
              height: 80px;
              margin-left: 20px;
              margin-right: 20px;
              border-color: rgb(0, 0, 0);
              margin-bottom: 10px;
            "
          >
          <div style="display: flex;">
            <input id="` +
      target[2] +
      `" type="text" value="` +
      target[2] +
      `" onchange="onInputFieldChange()"></input>
            <button id=id-` +
      target[2] +
      `  onclick="deleteTarget(` +
      target[2] +
      `)" style="margin-left: 10px; background-color: red;">delete</button>
          </div>
            <hr / style="margin-bottom: -10px;">
            <p>
              Corner 1: { x:` +
      target[0].x.toString() +
      `, y: ` +
      target[0].y.toString() +
      ` } <br />
              Cornder 2: { x:` +
      target[1].x +
      `, y: ` +
      target[1].y +
      ` } length: ` +
      pxToMm(len) +
      ` mm
            </p>
          </div>
        </div>`;
  }

  document.getElementById('elements').innerHTML = result;
}

function deleteTarget(name) {
  name = name.toString();

  let activeTimeout = -1;

  // TODO
  for (let i = 0; i < targets.length; ++i) {
    // for each target
    if (targets[i][2] === name) {
      // if it has the correct name

      const val = targets.splice(i, 1)[0]; // delete the element
      if (val !== undefined) {
        resetTargets.push(val); // save the value for restore option

        // dont reset the html with the previous timer
        if (activeTimeout !== -1) clearTimeout(activeTimeout);

        // update the html
        document.getElementById('mode').innerHTML =
          getModeStr() + ' - Deleted an obstacle';

        // reset the html in 2 seconds
        activeTimeout = setTimeout(() => {
          document.getElementById('mode').innerHTML = getModeStr();
        }, 2000);
      }
    }
  }

  updateScreen();
}

function updateScreen() {
  clearCanvas(); // reset the entire screen

  drawTargets(); // draw all the targets
  dataToHTML(); // update the html

  if (starCarPosition.x !== -1)
    drawCar(
      starCarPosition.x,
      starCarPosition.y,
      starCarPosition.degree,
      'green'
    );
  if (goalCarPosition.x !== -1)
    drawCar(
      goalCarPosition.x,
      goalCarPosition.y,
      goalCarPosition.degree,
      'red'
    );
}

function getObstacles() {
  function getTargetsAsArray() {
    r = [];
    for (target of targets) {
      r.push([
        [target[0].x, target[0].y],
        [target[1].x, target[1].y],
        target[2],
        target[3]
      ]);
    }

    return r;
  }

  res = JSON.stringify(getTargetsAsArray());

  navigator.clipboard.writeText(res);

  return res;
}

function getGoalCar() {
  res = JSON.stringify([
    Object.values(starCarPosition),
    Object.values(goalCarPosition)
  ]);

  navigator.clipboard.writeText(res);
  return res;
}

function importGoalCar() {
  const value = JSON.parse(document.getElementById('goalcarImportInput').value);
  starCarPosition = { x: value[0][0], y: value[0][1], degree: value[0][2] };
  goalCarPosition = { x: value[1][0], y: value[1][1], degree: value[1][2] };
  document.getElementById('rotationInput').value =
    starCarPosition.degree.toString();
  document.getElementById('goalInput').value =
    goalCarPosition.degree.toString();
  spawnGoal(goalCarPosition.x, goalCarPosition.y);
  spawnCar(starCarPosition.x, starCarPosition.y);
  updateScreen();
}

function importObstacles() {
  function getTargetsAsObject(array) {
    let obstacles = JSON.parse(array);
    let r = [];
    for (x of obstacles) {
      r.push([
        { x: x[0][0], y: x[0][1] },
        { x: x[1][0], y: x[1][1] },
        x[2],
        x[3]
      ]);
    }
    return r;
  }

  targets = getTargetsAsObject(
    document.getElementById('obstaclesImportInput').value
  );
  updateScreen();
}

function convert() {
  const toConvert = document.getElementById('inputpxl').value;
  document.getElementById('outputmm').innerHTML = pxToMm(toConvert).toFixed(4);
}

function pxToMm(px) {
  const w = 5040;
  const h = 2438;

  const fieldSize = [236.2, 114.3];

  let onePixel = fieldSize[0] / w;

  return onePixel * px * 10;
}

function copyMMResult() {
  navigator.clipboard.writeText(document.getElementById('outputmm').innerHTML);
}

//#region [functions] cars and goalPosition
function drawCar(x, y, rotation, color) {
  ctx.fillStyle = color;
  ctx.globalAlpha = 0.8;

  ctx.beginPath();

  const w = 530;
  const h = 500;
  let rect = { x: x - w / 2, y: y - h / 2, width: w, height: h };
  rotation *= Math.PI / 180;
  rotation *= -1;

  console.log('draw a car');

  ctx.translate(rect.x + rect.width / 2, rect.y + rect.height / 2);
  ctx.rotate(rotation);
  ctx.translate(-rect.x - rect.width / 2, -rect.y - rect.height / 2);
  ctx.fillRect(rect.x, rect.y, rect.width, rect.height);
  ctx.fill();

  ctx.rotate(rotation < 0 ? rotation : -rotation);

  ctx.setTransform(1, 0, 0, 1, 0, 0);
}

function drawGoal(x, y) {
  ctx.fillStyle = 'red';
  ctx.globalAlpha = 0.8;

  const radius = 50;

  let circle = new Path2D();
  circle.arc(x, y, radius, 0, 2 * Math.PI, false);
  ctx.fill(circle);
  document.getElementById('mode').innerHTML = getModeStr();
}

function spawnGoal(x, y) {
  //drawGoal(x, y); ;
  const rotation = parseInt(document.getElementById('goalInput').value);
  goalCarPosition = { x: x, y: y, degree: rotation };
  drawCar(x, y, rotation, 'red');
  createGoalCarMode = false;
  updateScreen();
  document.getElementById('mode').innerHTML = getModeStr();
}

function clearMap() {
  targets = [];
  starCarPosition = { x: -1, y: -1, degree: 0 };
  goalCarPosition = { x: -1, y: -1, degree: 0 };
  updateScreen();
}

function spawnCar(x, y) {
  const rotation = parseInt(document.getElementById('rotationInput').value);
  starCarPosition = { x: x, y: y, degree: rotation };
  drawCar(x, y, rotation, 'green');
  createStartCarMode = false;
  updateScreen();
}

const enableCarMode = () => {
  createStartCarMode = true;
  document.getElementById('mode').innerHTML = 'set car';
};

const enableGoalMode = () => {
  createGoalCarMode = true;
  document.getElementById('mode').innerHTML = 'set goal';
};
//#endregion
// #endregion

//#region utils functions
function mmToPx(mm) {
  const w = 5040;
  const h = 2438;

  const fieldSize = [2362, 1143];

  let oneMM = w / fieldSize[0];

  return oneMM * mm;
}

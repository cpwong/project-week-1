const boardSize = 10;
const charSet = Array.from('ABCDEFGHIJKLMNOPQRSTUVWXYZ');
const icon = { 
  medal:'&#129351', anchor:'&#9875', hit:'&#127919', 
  boom:'&#128165', splash:'&#128166', question: '&#10068' };
const textHit = 
  `${icon['hit']} ${icon['boom']} HIT ${icon['boom']} ${icon['hit']}`;
const textMiss = 
  `${icon['splash']} ${icon['splash']} MISS ${icon['splash']} ${icon['splash']}`;
const shipTypes = [{
  type: 'carrier',
  size: 5,
  count: 1
}, {
  type: 'cruiser',
  size: 4,
  count: 2
}, {
  type: 'destroyer',
  size: 3,
  count: 2
}, {
  type: 'frigate',
  size: 2,
  count: 2
}, {
  type: 'submarine',
  size: 1,
  count: 1
}]

let isGameOn = false;

/* --------------- Class declaration -------------    
  h = human, c = computer/CPU
  Status values stored in playerBoard/cpuBoard:
  #vsBoard = { address: status}
    address: {h/c}{A-J}{0-19}, e.g. hB10
    status:
      0 = Empty
      1 = Fired (tried) 
  #fleet = 
    { type: 'carrier', posList: [] },    
--------------------------------------------------*/
class Player {
  #vsBoard = {};  // Opponent's board
  #fleet = [];    // Player's fleet
  userId;         // Player user id, either 'human' or 'cpu'
  constructor(id) {
    console.log('New Fleet object created, id =', id, this.#vsBoard);
    this.userId = id;
  }
  // Set all board properties to default value (0)
  initVsBoard(parent) {
    for (let y = 0; y < boardSize; y++) {
      for (let x = 0; x < boardSize; x++) {
        const divId = this.userId[0] + charSet[x] + y;
        const div = document.createElement('div');
        div.setAttribute('id', divId);
        // div.innerHTML = divId;  // Show tile ID
        parent.append(div);
        this.#vsBoard[divId] = 0;
      }
    }
  }
  // Add ship to fleet, where:
  addShip(type, posList) {  
    const newShip = {}
    Object.defineProperties(newShip, {
      'type': { value: type },
      'posList': { value: posList, writable: true }
    });
    this.#fleet.push(newShip);
  }
  // Fire on tile and return status: 'hit'/'miss'/'tested'
  shoot(id) {
    if (!isGameOn) {
      document.getElementById('generate-btn').classList.add('hidden');
      document.getElementById('trigger_popup_fricc').innerHTML = '';
      isGameOn = true;
    }
    if (this.#vsBoard[id] === 0) {
      this.#vsBoard[id] = 1;
      let i = 0;
      for (let ship of this.#fleet) { 
      /* 
        Filter out all non-matching positions. if no hits, then nothing is 
        filtered out and both results and original posList will be equal. 
        If hit, then replace the posList with filtered list.
      */
        let result = ship.posList.filter(pos => pos != id );  
        if (ship.posList.length > result.length) {
          if (result.length > 0) { 
            // Update posList with filtered list
            Object.defineProperty(this.#fleet[i], 'posList', { 
              value: [...result] 
            });
          } else {
            // Remove sunken ship from fleet if posList is empty
            this.#fleet.splice(i, 1);
          }
          return 'hit';
        }
        i++;
      }
      return 'miss';
    } else {
      return 'tested';
    }
  }
  /*
    Getter for fleet stats. Count number of ships of the same type.
    Returns object with stats for each ship type:
    { type: count } e.g. { 'destroyer': 2 }
  */
  get fleetStats() {
    let stats = []  
    stats = this.#fleet.reduce((allTypes, ship) => {
      if (ship.type in allTypes) {
        allTypes[ship.type]++;
      } else {
        allTypes[ship.type] = 1;
      }
      return allTypes
    }, {})
    return stats;
  }
  // Shows location of all ships on the board
  showFleet() {
    for (const ship of this.#fleet) {
      for (const id of ship.posList) {
        const el = document.getElementById(id)
        el.classList.add('ship');
        el.innerHTML = icon['anchor'];
      }
    }
  }
  // Randomly generate fleet positions
  generateFleet() {
    this.#fleet = [];  // Clear all ships from fleet
    // Clear the board by resetting the backgroundColor
    const divList = document.querySelectorAll('#' + this.userId + '-board div');
    for (let div of divList) {
      div.classList.remove('hit', 'miss', 'ship');
      div.innerHTML = '';
    }
    // Generate an array of all available free tile addresses
    let freeTiles = [];
    for (let y = 0; y < boardSize; y++) {
      for (let x = 0; x < boardSize; x++) {
        freeTiles.push(this.userId[0] + charSet[x] + y);
      }
    }
    // Loop through all ship types and generate valid posList for each ship   
    for (let ship of shipTypes) {
      for (let i = 0; i < ship.count; i++) {
        let posObj = this.#getRandomShipPosList(freeTiles, ship.size);
        // Add ship into #fleet property
        this.addShip(ship.type, posObj.posList);
        // Remove mask from freeTiles
        for (let mask of posObj.maskList) {
          freeTiles = freeTiles.filter(free => free != mask);
        }
      }
    }
  }

  // Returns a list of tiles (posList) where ship is placed in freeTiles 
  #getRandomShipPosList(freeTiles, size) {
    // console.log(freeTiles, size);
    let posList = [];
    let maskList = [];
    let maskSet = new Set;
    let success = false;
    let attempts = 0;
    let pre = this.userId[0];  // Prefix from userId, e.g. 'h' or 'c'
    while (!success && attempts < 99) {
      let testTile = 
        freeTiles[Math.floor(Math.random() * freeTiles.length)]
        .slice(1);  // Remove the prefix before regex      
      let [x] = testTile.match(/\D+/gi);  // RegEx for non-digits
      let [y] = testTile.match(/\d+/gi);  // RegEx for digits
      // console.log(testTile);
      
      // Test horizontal placement with same letters (x-axis)
      posList = [];
      maskSet.clear();
      success = true;
      let yTest = y;
      for (let j = 0; j < size; j++) {
        let pos = pre + x + yTest;
        // console.log('x, yTest =', pos);
        if (!freeTiles.includes(pos)) {
          success = false;
        } else {
          posList.push(pos);  
          maskSet.add(pos);
          maskSet.add(pre + x + (yTest < boardSize - 1 ? Number(yTest) + 1 : yTest));
          maskSet.add(pre + x + (yTest > 0 ? Number(yTest) - 1 : yTest));
          let i = charSet.indexOf(x);
          maskSet.add(pre + (i < boardSize - 1 ? charSet[i + 1] : x) + yTest);
          maskSet.add(pre + (i > 0 ? charSet[i - 1] : x) + yTest);
          // console.log(maskSet);
        }
        yTest++;
      }
      if (!success) {  
        // Test vertical placement with same numbers (y-axis)
        posList = [];
        maskSet.clear();
        success = true;
        let xTest = x;
        let i = charSet.indexOf(x);
        for (let j = 0; j < size; j++) {
          let pos = pre + xTest + y;
          // console.log('xTest, y =', pos);
          if (!freeTiles.includes(pos)) {
            success = false;
          } else {
            posList.push(pos);
            maskSet.add(pos);  
            maskSet.add(pre + x + (yTest < boardSize - 1 ? Number(yTest) + 1 : yTest));
            maskSet.add(pre + x + (yTest > 0 ? Number(yTest) - 1 : yTest));
            let i = charSet.indexOf(x);
            maskSet.add(pre + (i < boardSize - 1 ? charSet[i + 1] : x) + yTest);
            maskSet.add(pre + (i > 0 ? charSet[i - 1] : x) + yTest);
            // console.log(maskSet);
            }
          i++;
          xTest = charSet[i];
        }
      }
      attempts++;
    }
    maskList = new Array(...maskSet)  // Spread the set into an array
    return { posList, maskList };     // Returns an object of 2 properties
  }
  // Updates score board after a hit and returns final score.
  updateScore() {
    const fleet = this.fleetStats;
    let sum = 0;  
    // Loop through each ship type and updates scores
    shipTypes.forEach((ship, i) => {
      const el = document.getElementById(this.userId[0] + '-stat-' + i)
      if (ship.type in fleet) {
        sum += fleet[ship.type];
        el.innerHTML = fleet[ship.type];
      } else {
        el.innerHTML = 0;
      }
    })
    document.getElementById(this.userId + '-score').innerHTML = sum;
    return sum;
  }
}
// -------- Instantiate Player objects ---------- //

let human = new Player('human');
let cpu = new Player('cpu');

// ----- Initialise when HTML file loads -------- //

window.onload = () => {
  console.log('Page loaded..');

  // Populate playing boards with div and assign id co-ordinates 
  const boardList = document.getElementsByClassName('board');
  let humanBoard = boardList[0];
  let cpuBoard = boardList[1];
  human.initVsBoard(humanBoard);
  cpu.initVsBoard(cpuBoard);

  human.generateFleet();
  human.showFleet();
  human.updateScore();

  // Add event listeners to each div on CPU board
  cpuBoard.querySelectorAll('div').forEach(el => {
    const id = el.getAttribute('id');
    el.onclick = () => { 
      switch (cpu.shoot(id)) {
      case 'hit':
        console.log('HIT! Fire again!');
        el.classList.add('hit');
        el.innerHTML = icon['boom'];
        showTitleStatus('cpu', 'hit');
        if (cpu.updateScore() === 0) {
          endGame('human');
        };
        break;
      case 'miss':
        console.log('Missed... end turn');
        el.classList.add('miss');
        showTitleStatus('cpu', 'miss');
        playComputerTurn();
        break;
      case 'tested':
        console.log('Already fired, try another tile');
        el.classList.add('flash');
        setTimeout(() => {
          el.classList.remove('flash');
        }, 1000);
        break;            
      }
    }
  })
  cpu.generateFleet();
  cpu.updateScore();

  // Add event listeners for buttons 
  document.getElementById('generate-btn').onclick = () => {
    human.generateFleet();
    human.showFleet();
    cpu.generateFleet();
  };
  document.getElementById('reset-btn').onclick = () => {
    location.reload()
  };
  document.getElementById('test-btn').onclick = () => {
    endGame('cpu');
  };
  // Popup box adapted from https://html-online.com/articles/simple-popup-box/
  document.getElementById('trigger_popup_fricc').onclick = () => {
    document.getElementById('hover_bkgr_fricc').style.display = 'block';
    console.log('popup');
  };
  document.getElementById('hover_bkgr_fricc').onclick = () => {
    document.getElementById('hover_bkgr_fricc').style.display = 'none';
  };
  document.getElementById('popupCloseButton').onclick = () => {
    document.getElementById('hover_bkgr_fricc').style.display = 'none';
  };
}

// -------- Setup CPU player ---------- //

let cpuMemory = [];  // Remembers all moves fired by CPU
for (let y = 0; y < boardSize; y++) {
  for (let x = 0; x < boardSize; x++) {
    cpuMemory.push(human.userId[0] + charSet[x] + y);
  }
}
async function playComputerTurn() {
  await delay(1000);
  let endTurn = false;
  while (!endTurn) {
    let id = cpuMemory[Math.floor(Math.random() * cpuMemory.length)];
    cpuMemory = cpuMemory.filter(fired => fired != id);  // Remove fired tile id
    console.log("Computer's turn... fire!", id);
    switch (human.shoot(id)) {
    case 'hit':
      console.log('HIT! Firing again!', id);
      const el = document.getElementById(id);
      el.classList.remove('ship');
      el.classList.add('hit');
      el.innerHTML = icon['boom'];
      showTitleStatus('human', 'hit');
      if (human.updateScore() === 0) {
        endGame('cpu');
      };
      break;
    case 'miss':
      console.log('Missed... end turn');
      document.getElementById(id).classList.add('miss');
      showTitleStatus('human', 'miss');
      endTurn = true;
      break;
    }
  }
}

// ---------- Misc and Helper functions --------------- //

// End game and announce winner ('human' or 'cpu')
async function endGame(winner) {
  const divList = document.querySelectorAll('.board div');
  for (let div of divList) {
    div.classList.add('no-events');
  }
  await delay(2000);
  const el = document.getElementById(winner + '-title');
  el.classList.add('winner');
  el.classList.add('flash');
  el.innerHTML = icon['medal'] + '  Winner!  ' + icon['medal'];
  document.getElementById('reset-btn').classList.remove('hidden');
}

// Show status on player board after each move (triggered by opponent)
function showTitleStatus(player, status) {
  const el = document.getElementById(player + '-title');
  const textPlayer = player === 'human' ? 'Player' : 'Computer';
  let text, textClass;
  if (status === 'hit') {
    text = textHit;
    textClass = 'hit';
  } else {
    text = textMiss;
    textClass = 'miss';
  }
  el.innerHTML = text;
  el.classList.add('flash', textClass);
  setTimeout(() => {
    el.classList.remove('flash', 'miss', 'hit');
    el.innerHTML = textPlayer;
  }, 1000);
}
// Wait for ms miliseconds
function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

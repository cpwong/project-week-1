const boardSize = 10;
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

/* --------- Shorthand for document.querySelector() ------- */

const qs = function(sel) {
  const res = document.querySelectorAll(sel);
  if (res.length > 1) {
    return res;
  } else {
    return res[0];
  }
}

/* --------------- Class declaration ----------------    
  Board tile address stored as (x, y) coordinate
  address. Helper methods to convert between 
  (x, y) and element id {h/c}{A-J}{0-19}
-----------------------------------------------------*/
const charSet = Array.from('ABCDEFGHIJKLMNOPQRSTUVWXYZ');
class Position {
  constructor(prefix, x, y) {
    this.prefix = prefix;  // 'h' or 'c'
    this.x = x;            // column
    this.y = y;            // row
  }
  get id() {
    return (this.prefix + charSet[this.x] + this.y); // e.g. hB10 
  }
}
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
  #vsBoard = {};        // Opponent's board
  #fleet = [];          // Player's fleet
  #freeTiles = [];      // Free tiles where ships can be placed
  userId;               // Player user id, either 'human' or 'cpu'
  constructor(id) {
    console.log('New Fleet object created, id =', id);
    this.userId = id;
    this.prefix = id[0];
  }
  // Returns a list of tiles (posList) where ship is placed in freeTiles 
  #getRandomShipPosList( {size} ) {
    //console.log('size', size);
    let posList = [];
    let success = false;
    let attempts = 0;
    while (!success && attempts < 99) {
      let i = Math.floor(Math.random() * this.#freeTiles.length);
      let origin = this.#freeTiles[i];
      // Flip for horizontal or vertical orientation
      posList = this.#getShipPosition(origin, size, 
        Math.floor(Math.random()*2) ? 'horizontal' : 'vertical');
      if (posList.length > 0)
        success = true;
      attempts++;
    }
    return posList;     
  }
  #getShipPosition(origin, size, orientation) {
    // Check if x- or y-axs exceeds boardSize
    if ((orientation === 'horizontal') && (origin.x + size >= boardSize))
      return [];
    if ((orientation === 'vertical') && (origin.y + size >= boardSize))
      return [];
    let posList = [];
    let test = new Position(origin.prefix, origin.x, origin.y);
    for (let c = 0; c < size; c++) {
      for (const free of this.#freeTiles) {
        if (test.id === free.id) {
          const pos = new Position(test.prefix, test.x, test.y);
          posList.push(pos);  
          break;
        } 
      }
      if (orientation === 'horizontal') 
        test.x++
      else
        test.y++
    }
    if (posList.length != size) {
      return [];
    }
    return posList;
  }

  // Set all board properties to default value (0)
  initVsBoard(parent) {
    for (let y = 0; y < boardSize; y++) {
      for (let x = 0; x < boardSize; x++) {
        const divId = this.userId[0] + charSet[x] + y;
        const div = document.createElement('div');
        div.setAttribute('id', divId);
        parent.append(div);
        this.#vsBoard[divId] = 0;
      }
    }
  }
  // Add ship to fleet and update freeTiles mask.
  #addShip(type, posList) {  
    const newShip = {
      type: type,
      posList: [...posList]
    };
    this.#fleet.push(newShip);
    // Remove occupied + surrounding tiles from freeTiles
    for (const pos of posList) {
      const removeTile = rem => {
        let i = this.#freeTiles.findIndex( tile => tile.id === rem.id);
        if (i >= 0) {
          this.#freeTiles.splice(i, 1);
        }
      }
      removeTile(pos);
      let mask = new Position (this.prefix, pos.x, pos.y);
      if (pos.y > 0) {  // Up
        mask.y--;
        removeTile(mask);
        mask.y = pos.y;      
      }
      if (pos.y <= boardSize) {  // Down
        mask.y++;
        removeTile(mask);      
        mask.y = pos.y;      
      }
      if (pos.x > 0) {  // Left
        mask.x--;
        removeTile(mask);      
        mask.x = pos.x;
      }
      if (pos.x <= boardSize) {  // Right
        mask.x++;
        removeTile(mask);      
        mask.x = pos.x;
      }
    }
  }
  // Fire on tile and return status: 'hit'/'miss'/'tested'
  shoot(id) {
    if (!isGameOn) {
      qs('#generate-btn').classList.add('hidden');
      qs('#reset-btn').classList.remove('hidden');
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
        let result = ship.posList.filter( pos => pos.id != id );  
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
          console.log('Fleet after hit',this.#fleet);
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
    for (let ship of this.#fleet) {
      for (let pos of ship.posList) {
        const el = qs('#' + pos.id);
        el.classList.add('ship');
        el.innerHTML = icon['anchor'];
      }
    }
  }
  // Randomly generate fleet positions
  generateFleet() {
    // Clear fleet data
    this.#fleet = [];  
    this.#freeTiles = [];  
    // Clear the board by resetting the backgroundColor
    const divList = qs('#' + this.userId + '-board div');
    for (let div of divList) {
      div.classList.remove('hit', 'miss', 'ship');
      div.innerHTML = '';
    }
    let tile;
    for (let y = 0; y < boardSize; y++) {
      for (let x = 0; x < boardSize; x++) {
        tile = new Position(this.userId[0], x, y);
        this.#freeTiles.push(tile);
      }
    }
    // Loop through all ship types and generate valid posList for each ship   
    for (let ship of shipTypes) {
      for (let i = 0; i < ship.count; i++) {
        let posList = this.#getRandomShipPosList(ship);
        // Add ship into #fleet property
        this.#addShip(ship.type, posList);
      }
    }
    this.showFleet();  // Enable for debugging
  }
  // Updates score board after a hit and returns final score.
  updateScore() {
    const fleet = this.fleetStats;
    let sum = 0;  
    // Loop through each ship type and updates scores
    shipTypes.forEach((ship, i) => {
      const el = qs('#' + this.userId[0] + '-stat-' + i)
      if (ship.type in fleet) {
        sum += fleet[ship.type];
        el.innerHTML = fleet[ship.type];
      } else {
        el.innerHTML = 0;
      }
    })
    qs('#' + this.userId + '-score').innerHTML = sum;
    return sum;
  }
}
// -------- Instantiate Player objects ---------- //

let human = new Player('human');
let cpu = new Player('cpu');

// ----- Initialise when HTML file loads -------- //

window.onload = () => {
  console.log('Page loaded..');

  // Initialise human player object
  human.initVsBoard(qs('#human-board'));
  human.generateFleet();
  human.showFleet();
  human.updateScore();

  // Initialise CPU player object
  cpu.initVsBoard(qs('#cpu-board'));
  cpu.generateFleet();
  cpu.updateScore();

  // Add event listeners to each div on CPU board
  qs('#cpu-board div').forEach(el => {
    const id = el.getAttribute('id');
    el.onclick = () => { 
      switch (cpu.shoot(id)) {
      case 'hit':
        el.classList.add('hit');
        el.innerHTML = icon['boom'];
        showTitleStatus('cpu', 'hit');
        if (cpu.updateScore() === 0) {
          endGame('human');
        };
        break;
      case 'miss':
        el.classList.add('miss');
        showTitleStatus('cpu', 'miss');
        playComputerTurn();
        break;
      case 'tested':
        el.classList.add('flash');
        setTimeout(() => {
          el.classList.remove('flash');
        }, 1000);
        break;            
      }
    }
  })
  // Add event listeners for buttons 
  qs('#generate-btn').onclick = () => {
    human.generateFleet();
    human.showFleet();
    cpu.generateFleet();
  };
  qs('#reset-btn').onclick = () => {
    location.reload()
  };
  qs('#test-btn').onclick = () => {
    endGame('cpu');
  };
  // Popup box adapted from https://html-online.com/articles/simple-popup-box/
  qs('#trigger_popup_fricc').onclick = () => {
    qs('#hover_bkgr_fricc').style.display = 'block';
    console.log('popup');
  };
  qs('#hover_bkgr_fricc').onclick = () => {
    qs('#hover_bkgr_fricc').style.display = 'none';
  };
  qs('#popupCloseButton').onclick = () => {
    qs('#hover_bkgr_fricc').style.display = 'none';
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
      const el = qs('#' + id);
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
      qs('#' + id).classList.add('miss');
      showTitleStatus('human', 'miss');
      endTurn = true;
      break;
    }
  }
}
// ---------- Misc and Helper functions --------------- //

// End game and announce winner ('human' or 'cpu')
async function endGame(winner) {
  const divList = qs('.board div');
  for (let div of divList) {
    div.classList.add('no-events');
  }
  await delay(2000);
  const el = qs('#' + winner + '-title');
  el.classList.add('winner');
  el.classList.add('flash');
  el.innerHTML = icon['medal'] + '  Winner!  ' + icon['medal'];
  qs('#reset-btn').classList.remove('hidden');
}

// Show status on player board after each move (triggered by opponent)
function showTitleStatus(player, status) {
  const el = qs('#' + player + '-title');
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

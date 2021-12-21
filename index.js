const boardSize = 10;
const charSet = Array.from('ABCDEFGHIJKLMNOPQRSTUVWXYZ');
const playerList = ['h', 'c'];
const shipTypes = [{
  type: 'carrier',
  size: 5,
  count: 1
}, {
  type: 'battleship',
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
/*   
  h = human, c = computer/CPU
  Status values stored in playerBoard/cpuBoard:
  #board = { address: status}
    address: {h/c}{A-J}{0-19}, e.g. hB10
    status:
      0 = Empty
      1 = Fired (tried) 
  #fleet = 
    { type: 'carrier', posList: [] },    // posList stores ship's position
*/

// --------- Class declaration ----------- //
class Player {
  #board = {};  
  #fleet = [];
  userId;  // Player user id, either 'human' or 'cpu'
  constructor(id) {
    console.log('New Fleet object created, id =', id, this.#board);
    this.userId = id;
  }
  // Set board cell to default value (0)
  init(id) { 
    this.#board[id] = 0;
  }
  // Set all #board cell properties to default value (0)
  initBoard() {
    console.log('initBoard...', this.#board);
    for (let id in this.#board) {
      // console.log(id, this.#board[id]);
      this.#board[id] = 0;
    }
    
  }
  /*
    Add ship to fleet, where:
      type = ship type , e.g. 'frigate'
      posList = 2D array, e.g. [['cB10','cB11'], ['cG2','cH2']]); 
  */
  addShip(type, posList) {  
    const newShip = {}
    Object.defineProperties(newShip, {
      'type': { value: type },
      'posList': { value: posList, writable: true }
    });
    this.#fleet.push(newShip);
    // console.log(this.userId, '.addShip(), newShip =', newShip );
    // console.log('  #fleet =', this.#fleet);
  }
  // Test board cell and return status: hit, miss or tested
  shoot(id) {
    console.log('shoot(id) =', id);
    if (this.#board[id] === 0) {
      this.#board[id] = 1;
      let i = 0;
      for (let ship of this.#fleet) { 
      /* 
        Filter out all non-matching positions. if no hits, then nothing is 
        filtered out and both results and original posList will be equal. 
        If hit, then replace the posList with filtered list.
      */
        let result = ship.posList.filter(pos => pos != id );  
        // console.log('  filter =', result);
        if (ship.posList.length > result.length) {
          if (result.length > 0) { 
            // Update posList with filtered list
            Object.defineProperty(this.#fleet[i], 'posList', { value: [...result] });
          } else {
            // Remove sunken ship from fleet if posList is empty
            this.#fleet.splice(i, 1);
          }
          // console.log('  this.#fleet =', this.#fleet);
          return 'hit';
        }
        i++;
      }
      return 'miss';
    } else {
      // console.log('Position already fired on... try another one!');
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
    // console.log(this.playerId, 'get fleetStats() = ', stats);
    return stats;
  }
  // Shows location of all ships on the board
  showFleet() {
    for (const ship of this.#fleet) {
      console.log(ship);
      for (const id of ship.posList) {
        document.getElementById(id).style.backgroundColor = 'red';
      }
    }
  }
  // Randomly generate fleet positions
  generateFleet() {
    this.#fleet = [];  // Clear all ships from fleet
    // Clear the board by resetting the backgroundColor
    const divList = document.querySelectorAll('#' + this.userId + '-board div');
    for (let div of divList) {
      div.style.backgroundColor = '';
    }
    // Generate an array of all available free cell addresses
    let freeCells = [];
    for (let y = 0; y < boardSize; y++) {
      for (let x = 0; x < boardSize; x++) {
        freeCells.push(this.userId[0] + charSet[x] + y);
      }
    }
    // Loop through all ship types and generate valid posList for each ship   
    for (let ship of shipTypes) {
      for (let i = 0; i < ship.count; i++) {
        let posObj = this.#getRandomShipPosList(freeCells, ship.size);
        console.log(ship.type, posObj);
        // Add ship into #fleet property
        this.addShip(ship.type, posObj.posList);
        // Remove mask from freeCells
        for (let mask of posObj.maskList) {
          freeCells = freeCells.filter(free => free != mask);
        }
      }
    }
    console.log(this.#fleet);
  }

  // Returns a list of cells (posList) where ship is placed in freeCells 
  #getRandomShipPosList(freeCells, size) {
    // console.log(freeCells, size);
    let posList = [];
    let maskList = [];
    let maskSet = new Set;
    let success = false;
    let attempts = 0;
    let pre = this.userId[0];  // Prefix from userId, e.g. 'h' or 'c'
    while (!success && attempts < 99) {
      let testCell = 
        freeCells[Math.floor(Math.random() * freeCells.length)]
        .slice(1);  // Remove the prefix before regex      
      let [x] = testCell.match(/\D+/gi);  // RegEx for non-digits
      let [y] = testCell.match(/\d+/gi);  // RegEx for digits
      // console.log(testCell);
      
      // Test horizontal placement with same letters (x-axis)
      posList = [];
      maskSet.clear();
      success = true;
      let yTest = y;
      for (let j = 0; j < size; j++) {
        let pos = pre + x + yTest;
        console.log('x, yTest =', pos);
        if (!freeCells.includes(pos)) {
          success = false;
        } else {
          posList.push(pos);  
          maskSet.add(pos);
          maskSet.add(pre + x + (yTest < boardSize - 1 ? Number(yTest) + 1 : yTest));
          maskSet.add(pre + x + (yTest > 0 ? Number(yTest) - 1 : yTest));
          let i = charSet.indexOf(x);
          maskSet.add(pre + (i < boardSize - 1 ? charSet[i + 1] : x) + yTest);
          maskSet.add(pre + (i > 0 ? charSet[i - 1] : x) + yTest);
          console.log(maskSet);
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
          console.log('xTest, y =', pos);
          if (!freeCells.includes(pos)) {
            success = false;
          } else {
            posList.push(pos);
            maskSet.add(pos);  
            maskSet.add(pre + x + (yTest < boardSize - 1 ? Number(yTest) + 1 : yTest));
            maskSet.add(pre + x + (yTest > 0 ? Number(yTest) - 1 : yTest));
            let i = charSet.indexOf(x);
            maskSet.add(pre + (i < boardSize - 1 ? charSet[i + 1] : x) + yTest);
            maskSet.add(pre + (i > 0 ? charSet[i - 1] : x) + yTest);
            console.log(maskSet);
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
  // Updates score board after a hit and determines if someone has won.
  updateScore() {
    console.log('updateStats, userId =', this.userId);
    const fleet = this.fleetStats;
    let sum = 0;  // Total number of ships in the fleet
    // Loop through each ship type and updates scores
    shipTypes.forEach((ship, i) => {
      // console.log('  Element id = ' + this.userId[0] + '-stat' + i);
      const el = document.getElementById(this.userId[0] + '-stat-' + i)
      if (ship.type in fleet) {
        // console.log(ship, ' is in ', fleet);
        sum += fleet[ship.type];
        el.innerHTML = fleet[ship.type];
      } else {
        el.innerHTML = 0;
      }
    })
    document.getElementById(this.userId + '-score').innerHTML = sum;
  }
}

// -------- Instantiate Players ---------- //

let human = new Player('human');
let cpu = new Player('cpu');

// ----- Initialise when HTML file loads -------- //

document.querySelector('body').onload = () => {
  console.log('Page loaded..');
  // Populate playing boards with div and assign id co-ordinates 
  const boardList = document.getElementsByClassName('board');
  // console.log(boardList);
  for (let pc = 0; pc < 2; pc++) {
    for (let y = 0; y < boardSize; y++) {
      for (let x = 0; x < boardSize; x++) {
        const divId = playerList[pc] + charSet[x] + y;
        const div = document.createElement('div');
        div.setAttribute('id', divId);
        div.innerHTML = divId;
        boardList[pc].append(div);        
      }
    }
  }
  // Add event listeners to each ship type inside stats container
/*
  for (let i = 0; i < shipTypes.length; i++) {
    const el = document.querySelector('.stats #type-' + i);
    // console.log('  ship div element =', el);
    el.onclick = () => {
      // console.log('..onclick - Ship type', el.textContent, 'clicked');
      handleCreateShip(el, shipTypes[i]);
      el.classList.add('selected');
    }
  }
*/
  // Add event listeners to each div on Player board
  boardList[0].querySelectorAll('div').forEach( el => {
    const id = el.getAttribute('id');
    el.onclick = () => {
      console.log('..onclick - place ships by human, cellId = ', id);
    }
    human.init(id);
  })
  human.initBoard();
  human.updateScore();

  // Add event listeners to each div on CPU board
  boardList[1].querySelectorAll('div').forEach(el => {
    const id = el.getAttribute('id');
    el.onclick = () => { 
      switch (cpu.shoot(id)) {
      case 'hit':
        el.style.backgroundColor = 'red';
        cpu.updateScore();
        break;
      case 'miss':
        el.style.backgroundColor = 'blue';
        break;
      case 'tested':
        el.classList.add('flash');
        setTimeout(() => {
          el.classList.remove('flash');
        }, 1000);
        break;            
      }
    }
    cpu.init(id);
  })
  cpu.initBoard();
  cpu.updateScore();

  // Add event listeners for buttons
  document.getElementById('show-btn').onclick = () => {
    cpu.showFleet();
    human.showFleet();
  };
  document.getElementById('generate-btn').onclick = () => {
    cpu.generateFleet();
    cpu.showFleet();
    cpu.updateScore();
    human.generateFleet();
    human.showFleet();
    human.updateScore();
  };
  document.getElementById('reset-btn').onclick = () => {
    human = new Player('human');
    cpu = new Player('cpu');
  };
}
// ----------- Handlers -------------//

// Handler for ship selection from stats panel (create new ships)
function handleCreateShip(el, type) {
  console.log('handleCreateShip(...)', type);
}

// Handler for ship selection from human player board (move existing ships)
function handleMoveShip(id) {
  console.log('handleMoveShip(...)', id);
}


// Create CPU playing board
// cpu.addShip('carrier', ['cA2', 'cA3', 'cA4', 'cA5', 'cA6']); 
// cpu.addShip('battleship', ['cD5', 'cE5', 'cF5', 'cG5']),
// cpu.addShip('battleship', ['cF2', 'cG2', 'cH2', 'cI2']); 
// cpu.addShip('destroyer', ['cF8', 'cG8', 'cH8']);
// cpu.addShip('destroyer', ['cH0', 'cI0', 'cJ0']); 

// document.querySelector('#btn').onClick = () => {
  // Start game
  
  // Populate CPU's board with ships
// }

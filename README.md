# NTU-SDI Project Week 1

## Battleship Game

![battleship](battleship.jpg)

### Preparation
- Screen presents 10x10 tile board for player (left) and computer (right)
- In the middle, total number of ships are displayed for each side
- Human player starts game by clicking on computer board
- All ships are randomly placed on both boards
- Press 'Regenerate Fleet' to generate another fleet
- Randomly place ships on the board
  - Generate all addresses on board
  - Generate random address for each tile
  - Test horizontal with same letters (x-axis)
  - if test passes, filter address from board
  - else if fail. test vertical with same numbers (y-axis)
  - if test passes, filter address from board
  - else if fail, try again with another random address
  - stop if 1000 times, then try sequentially
- Computer shall place ship pieces randomly on their own board, but hidden

### Gameplay
- During game play, player and computer will take turns to guess position of ships
- Player shall select tile to fire on by clicking on the computer board
- Show status of move on the opponents board after firing
- Each tile shall display
  - Hit
  - Miss
  - Ship sunk
- 'Play' button changes to 'Restart' during gameplay
- Confirm to quit when player presses 'Restart'
 
### End game
- Player/computer who sank all the opponents ships wins
- Press 'Restart' to play again

# Highlights

# Challenges

# Lessons Learnt

## Use class to set element style

Setting the style on the element:
```js
element.style.backgroundColor = 'red';
```
Using classes + css:
```js
element.classList.add('hit');
element.classList.remove('hit');
// CSS
.hit {
  background-color: red;
}
```
# Future

## Customisable ship positions
- Player shall place ship pieces on player board
- Click on ship type to select the ship to be placed
- Highlight selected ship type text during placement
- Mouseover to user's board to highlight valid tiles that can be placed on the board
- Press 'R' to rotate pieces - compute suitable tiles to place ships
- Click on tile to place ship
- Remove highlight to de-select ship
- Incremement counter next to ship type
- Repeat until all ships are placed
- Click on any ship placed on board to move them


# Code snippets
## Styling selected radio buttons 
- https://stackoverflow.com/questions/4641752/css-how-to-style-a-selected-radio-buttons-label
- https://markheath.net/post/customize-radio-button-css

## Create vertical radio buttons
- https://stackoverflow.com/questions/12175483/how-to-create-vertical-radio-button-group-in-html-form-without-table-tag

## Simple pop-up window with HTML
https://html-online.com/articles/simple-popup-box/

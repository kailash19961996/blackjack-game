let handsPlayed = 0;

// Global Variables
let deck = [];
let dealerHand = [];
let playerHands = []; // Only one hand now.
let currentHandIndex = 0;
let playerMoney = 1000;
let currentBet = 0;
let playerBets = []; // For the single hand bet.
let gameState = 'betting'; // 'betting', 'player', 'dealer', 'finished'
let hasDoubledDown = false; // Track if double down has been used for this hand.
let statsInitialized = false; // Ensure gamestats.txt is created only once

const totalCards = 52;
const reshuffleThreshold = totalCards * 0.6; // ~15.6 cards remaining
const suits = ['♠', '♥', '♦', '♣'];
const ranks = ['2','3','4','5','6','7','8','9','10','J','Q','K','A'];

// Logging helper functions
function logGameEvent(message) {
  fetch('/logGameEvent', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message: message })
  }).catch(err => console.error('Error logging event:', err));
}

function logPlayerCard(card) {
  logGameEvent("player card dealt : " + card.rank);
}

function logDealerCard(card) {
  logGameEvent("dealer card dealt : " + card.rank);
}

function logPlayerDecision(decision) {
  logGameEvent("player decision : " + decision);
}

function logDealerDecision(decision) {
  logGameEvent("dealer decision : " + decision);
}

function logDealerReveal(card) {
  logGameEvent("dealer card revealed : " + card.rank);
}

function logFinalOutcome(message) {
  let netChange = playerMoney - 1000;
  logGameEvent(message + " ; Hands played: " + handsPlayed + " ; Net Change: " + netChange);
}

// Deck functions
function createDeck() {
  deck = [];
  for (let suit of suits) {
    for (let rank of ranks) {
      let value = parseInt(rank);
      if (['J','Q','K'].includes(rank)) {
        value = 10;
      }
      if (rank === 'A') {
        value = 11;
      }
      deck.push({ suit, rank, value });
    }
  }
}

function shuffleDeck() {
  for (let i = deck.length - 1; i > 0; i--) {
    let j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
}

function calculateScore(hand) {
  let score = 0;
  let aceCount = 0;
  for (let card of hand) {
    score += card.value;
    if (card.rank === 'A') aceCount++;
  }
  while (score > 21 && aceCount > 0) {
    score -= 10;
    aceCount--;
  }
  return score;
}

function updateMoneyDisplay() {
  document.getElementById('money').textContent = "Money: $" + playerMoney;
}

function updateBetDisplay() {
  document.getElementById('current-bet').textContent = currentBet;
}

// Rendering Functions (dealer’s hidden card is not revealed until later)
function renderDealerHand() {
  const container = document.getElementById('dealer-cards');
  container.innerHTML = '';
  dealerHand.forEach((card, index) => {
    const cardDiv = document.createElement('div');
    cardDiv.className = 'card';
    // While in player's turn, only show the first dealer card
    if (gameState === 'player' && index > 0) {
      cardDiv.textContent = "";
    } else {
      cardDiv.textContent = card.rank + card.suit;
    }
    container.appendChild(cardDiv);
  });
}

function renderPlayerHands() {
  const container = document.getElementById('player-hands');
  container.innerHTML = '';
  const hand = playerHands[0];
  if (hand) {
    const handDiv = document.createElement('div');
    handDiv.className = 'hand';
    handDiv.innerHTML = "<p>Hand 1</p>";
    const cardsDiv = document.createElement('div');
    cardsDiv.className = 'cards';
    hand.forEach((card) => {
      const cardDiv = document.createElement('div');
      cardDiv.className = 'card';
      cardDiv.textContent = card.rank + card.suit;
      cardsDiv.appendChild(cardDiv);
    });
    handDiv.appendChild(cardsDiv);
    const scoreP = document.createElement('p');
    scoreP.textContent = "Score: " + calculateScore(hand);
    handDiv.appendChild(scoreP);
    container.appendChild(handDiv);
  }
}

function updateDealerScoreDisplay() {
  const dealerScoreP = document.getElementById('dealer-score');
  // Hide dealer score during player's turn
  if (gameState === 'player') {
    dealerScoreP.textContent = "Dealer Score: ?";
  } else {
    dealerScoreP.textContent = "Dealer Score: " + calculateScore(dealerHand);
  }
}

function updateControlButtons() {
  const hitBtn = document.getElementById('hit-btn');
  const standBtn = document.getElementById('stand-btn');
  const doubleBtn = document.getElementById('double-btn');
  if (gameState !== 'player') {
    hitBtn.disabled = true;
    standBtn.disabled = true;
    doubleBtn.disabled = true;
  } else {
    hitBtn.disabled = false;
    standBtn.disabled = false;
    checkForDoubleDownOption();
  }
}

function renderAll() {
  renderDealerHand();
  renderPlayerHands();
  updateDealerScoreDisplay();
  updateControlButtons();
}

// Modal Popup Functions
function showModal(message) {
  document.getElementById('modal-message').textContent = message;
  document.getElementById('result-modal').style.display = 'block';
}

function closeModal() {
  document.getElementById('result-modal').style.display = 'none';
  if (playerMoney <= 0) {
    location.reload();
  } else {
    resetGame();
  }
}

// Toast Notification for Errors
function showError(message) {
  const toast = document.getElementById('toast');
  toast.textContent = message;
  toast.className = "show";
  setTimeout(() => {
    toast.className = toast.className.replace("show", "");
  }, 3000);
}

// Betting Functions
function addCoinToBet(coinValue) {
  if (currentBet + coinValue > playerMoney) {
    showError("Not enough funds to add that coin!");
    return;
  }
  currentBet += coinValue;
  updateBetDisplay();
}

function clearBet() {
  currentBet = 0;
  updateBetDisplay();
}

function placeBet() {
  if (currentBet <= 0) {
    showError("Please select a coin to place a bet!");
    return;
  }
  if (currentBet > playerMoney) {
    showError("Not enough funds for that bet!");
    return;
  }
  
  // Initialize gamestats.txt on first bet
  if (!statsInitialized) {
    fetch('/initStats', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    })
    .then(response => response.json())
    .then(data => {
      console.log(data.message);
      statsInitialized = true;
      proceedWithBet();
    })
    .catch(err => {
      console.error('Error initializing stats:', err);
      showError('Error initializing game stats file');
    });
  } else {
    proceedWithBet();
  }
}

function proceedWithBet() {
  // Log initial state on first game start
  if (handsPlayed === 0) {
    logGameEvent("Hands played = 0 ; Current Balance = " + playerMoney);
    reshuffleShoe(); // This logs "Reshuffled"
  }
  playerMoney -= currentBet;
  updateMoneyDisplay();
  playerBets = [currentBet];
  document.getElementById('betting-area').style.display = 'none';
  startRound();
}

function reshuffleShoe() {
  createDeck();
  shuffleDeck();
  logGameEvent("Reshuffled");
}

// Game Flow Functions
function startRound() {
  gameState = 'player';
  hasDoubledDown = false;
  dealerHand = [];
  
  // Deal player's initial cards
  const playerCard1 = deck.pop();
  logPlayerCard(playerCard1);
  const playerCard2 = deck.pop();
  logPlayerCard(playerCard2);
  playerHands = [[playerCard1, playerCard2]];
  currentHandIndex = 0;
  
  // Deal dealer's initial cards
  const dealerCard1 = deck.pop();
  logDealerCard(dealerCard1); // visible card
  const dealerCard2 = deck.pop(); // hidden card – do not log now
  dealerHand = [dealerCard1, dealerCard2];
  
  renderAll();
  
  let score = calculateScore(playerHands[0]);
  if (score === 21) {
     // Automatic win on initial blackjack
     gameState = 'finished';
     if (dealerHand.length > 1) logDealerReveal(dealerHand[1]);
     let outcome = "Blackjack! You win!";
     handsPlayed++;
     playerMoney += playerBets[0] * 2;
     updateMoneyDisplay();
     setTimeout(() => {
       showModal(outcome);
       logFinalOutcome(outcome);
     }, 500);
     return;
  }
}

function checkForDoubleDownOption() {
  const ddBtn = document.getElementById('double-btn');
  const currentHand = playerHands[0];
  if (gameState !== 'player' || !currentHand) {
    ddBtn.disabled = true;
    return;
  }
  if (hasDoubledDown) {
    ddBtn.disabled = true;
    return;
  }
  if (currentHand.length === 2 && playerMoney >= playerBets[0]) {
    ddBtn.disabled = false;
  } else {
    ddBtn.disabled = true;
  }
}

function hit() {
  if (gameState !== 'player') return;
  logPlayerDecision("hit");
  const card = deck.pop();
  playerHands[0].push(card);
  logPlayerCard(card);
  renderAll();
  checkForDoubleDownOption();
  let score = calculateScore(playerHands[0]);
  if (score === 21) {
     // Automatic win if score equals 21
     gameState = 'finished';
     if (dealerHand.length > 1) logDealerReveal(dealerHand[1]);
     let outcome = "You reached 21! You win!";
     handsPlayed++;
     playerMoney += playerBets[0] * 2;
     updateMoneyDisplay();
     setTimeout(() => {
       showModal(outcome);
       logFinalOutcome(outcome);
     }, 500);
     return;
  } else if (score > 21) {
     // Bust immediately
     gameState = 'finished';
     if (dealerHand.length > 1) logDealerReveal(dealerHand[1]);
     let outcome = "Bust! You lose " + playerBets[0];
     handsPlayed++;
     updateMoneyDisplay();
     setTimeout(() => {
       showModal(outcome);
       logFinalOutcome(outcome);
     }, 500);
     return;
  }
}

function doubleDown() {
  if (gameState !== 'player') return;
  if (playerMoney < playerBets[0]) {
    showError("Not enough money to double down!");
    return;
  }
  playerMoney -= playerBets[0];
  updateMoneyDisplay();
  playerBets[0] *= 2;
  currentBet = playerBets[0];
  hasDoubledDown = true;
  logPlayerDecision("double down");
  const card = deck.pop();
  playerHands[0].push(card);
  logPlayerCard(card);
  renderAll();
  let score = calculateScore(playerHands[0]);
  if (score === 21) {
      gameState = 'finished';
      if (dealerHand.length > 1) logDealerReveal(dealerHand[1]);
      let outcome = "You reached 21! You win!";
      handsPlayed++;
      playerMoney += playerBets[0] * 2;
      updateMoneyDisplay();
      setTimeout(() => {
         showModal(outcome);
         logFinalOutcome(outcome);
      }, 500);
      return;
  } else if (score > 21) {
      gameState = 'finished';
      if (dealerHand.length > 1) logDealerReveal(dealerHand[1]);
      let outcome = "Bust! You lose " + playerBets[0];
      handsPlayed++;
      updateMoneyDisplay();
      setTimeout(() => {
         showModal(outcome);
         logFinalOutcome(outcome);
      }, 500);
      return;
  } else {
      // If neither 21 nor bust, proceed as if the player stands
      setTimeout(stand, 500);
  }
}

function stand() {
  if (gameState !== 'player') return;
  logPlayerDecision("stand");
  
  // Reveal dealer's hidden card now
  if (dealerHand.length > 1) {
    logDealerReveal(dealerHand[1]);
  }
  
  // Switch to dealer state so the UI shows the second card
  gameState = 'dealer';
  renderAll();
  
  // Proceed with dealer's turn
  nextHandOrDealer();
}

function nextHandOrDealer() {
  dealerTurn();
}

function dealerTurn() {
  gameState = 'dealer';
  renderAll();
  // Dealer only plays if player's score is below 21
  while (calculateScore(dealerHand) < 17) {
    logDealerDecision("hit");
    const card = deck.pop();
    dealerHand.push(card);
    logDealerCard(card);
    renderAll();
  }
  logDealerDecision("stand");
  gameState = 'finished';
  settleBets();
}

function settleBets() {
  const dealerScore = calculateScore(dealerHand);
  const hand = playerHands[0];
  const bet = playerBets[0];
  const score = calculateScore(hand);
  let outcome = "";
  
  if (score > 21) {
    outcome = "Bust! You lose " + bet;
  } else if (dealerScore > 21 || score > dealerScore) {
    outcome = "You win! You gain " + bet;
    playerMoney += bet * 2;
  } else if (score < dealerScore) {
    outcome = "You lose " + bet;
  } else {
    outcome = "Push. Your bet is returned";
    playerMoney += bet;
  }
  handsPlayed++;
  updateMoneyDisplay();
  setTimeout(() => {
    showModal(outcome);
    logFinalOutcome(outcome);
    if (deck.length < reshuffleThreshold) {
      reshuffleShoe();}
  }, 2000);
}

function resetGame() {
  gameState = 'betting';
  dealerHand = [];
  playerHands = [];
  currentBet = 0;
  playerBets = [];
  updateBetDisplay();
  document.getElementById('betting-area').style.display = 'block';
  document.getElementById('new-game-btn').style.display = 'none';
  renderAll();
}

// Event Listeners
document.querySelectorAll('.coin-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    const coinValue = parseInt(btn.getAttribute('data-value'));
    addCoinToBet(coinValue);
  });
});
document.getElementById('clear-bet-btn').addEventListener('click', clearBet);
document.getElementById('place-bet-btn').addEventListener('click', placeBet);
document.getElementById('hit-btn').addEventListener('click', hit);
document.getElementById('stand-btn').addEventListener('click', stand);
document.getElementById('double-btn').addEventListener('click', doubleDown);
document.getElementById('new-game-btn').addEventListener('click', () => {
  location.reload();
});
document.getElementById('restart-game-btn').addEventListener('click', () => {
  fetch('/updateStats', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ handsPlayed, currentBalance: playerMoney })
  })
  .then(response => response.json())
  .then(data => {
    console.log('Stats updated:', data);
    location.reload();
  })
  .catch(err => {
    console.error('Error updating stats:', err);
    location.reload();
  });
});
document.getElementById('modal-close').addEventListener('click', closeModal);
document.getElementById('modal-ok').addEventListener('click', closeModal);

updateMoneyDisplay();
updateBetDisplay();
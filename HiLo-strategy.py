# Perfectly working
#  Initialize global variables
running_count = 0
correct_decisions = 0
total_decisions = 0

def update_count(card):
    """Update the running count for a single card using Hi-Lo system."""
    global running_count
    card_values = {
        '2': 1, '3': 1, '4': 1, '5': 1, '6': 1,
        '7': 0, '8': 0, '9': 0,
        '10': -1, 'J': -1, 'Q': -1, 'K': -1, 'A': -1
    }
    running_count += card_values.get(card, 0)
    return running_count

def calculate_hand_total(cards):
    """Calculate the total value of a hand, handling aces appropriately."""
    total = 0
    aces = 0
    
    for card in cards:
        if card in ['K', 'Q', 'J']:
            total += 10
        elif card == 'A':
            aces += 1
            total += 11
        else:
            total += int(card) if card.isdigit() else 10
    
    # Adjust for aces
    while total > 21 and aces > 0:
        total -= 10
        aces -= 1
    
    return total

def dealer_card_value(card):
    """Convert dealer's upcard to a numeric value for decision logic."""
    if card is None:
        return None
        
    mapping = {
        '2': 2, '3': 3, '4': 4, '5': 5, '6': 6,
        '7': 7, '8': 8, '9': 9, '10': 10,
        'J': 10, 'Q': 10, 'K': 10, 'A': 11
    }
    return mapping.get(card, int(card) if card.isdigit() else None)

def evaluate_decision(hand_total, dealer_upcard, decision=None):
    """Evaluate if the player's decision was correct based on basic strategy and count."""
    global running_count
    
    d_val = dealer_card_value(dealer_upcard)
    if d_val is None:
        return None
        
    recommended = None
    
    # Basic strategy with count adjustments
    if hand_total <= 11:
        recommended = 'hit'
    elif hand_total >= 17:
        recommended = 'stand'
    elif hand_total == 12:
        if running_count >= 3:
            recommended = 'stand' if d_val in [3, 4, 5, 6] else 'hit'
        elif running_count <= -3:
            recommended = 'stand' if d_val in [5, 6] else 'hit'
        else:
            recommended = 'stand' if d_val in [4, 5, 6] else 'hit'
    elif 13 <= hand_total <= 16:
        if running_count >= 3:
            recommended = 'stand' if d_val in [2, 3, 4, 5, 6, 7] else 'hit'
        elif running_count <= -3:
            recommended = 'stand' if d_val in [3, 4, 5, 6] else 'hit'
        else:
            recommended = 'stand' if d_val in [2, 3, 4, 5, 6] else 'hit'
    
    if decision is None:
        return recommended
    else:
        return decision == recommended

def parse_game_log(filename):
    """Parse the game log file and analyze each hand."""
    global running_count, correct_decisions, total_decisions
    
    current_hand = []
    dealer_upcard = None
    hand_number = 0
    
    with open(filename, 'r') as f:
        lines = f.readlines()
        i = 0
        while i < len(lines):
            line = lines[i].strip()
            
            if 'Reshuffled' in line:
                print(f"\nDeck reshuffled - Running Count reset from {running_count} to 0")
                running_count = 0
                current_hand = []
                dealer_upcard = None
                
            elif 'You' in line or 'Bust!' in line:
                # New hand is starting after this
                current_hand = []
                dealer_upcard = None
                hand_number += 1
                
            elif 'player card dealt' in line:
                card = line.split(':')[1].strip()
                current_hand.append(card)
                update_count(card)
                
            elif 'dealer card dealt' in line:
                if dealer_upcard is None and 'dealer card dealt' in line:
                    dealer_upcard = line.split(':')[1].strip()
                    update_count(dealer_upcard)
                else:
                    # Additional dealer cards
                    card = line.split(':')[1].strip()
                    update_count(card)
                
            elif 'dealer card revealed' in line:
                revealed_card = line.split(':')[1].strip()
                update_count(revealed_card)
                
            elif 'player decision' in line:
                decision = line.split(':')[1].strip()
                hand_total = calculate_hand_total(current_hand)
                
                if dealer_upcard is not None:
                    # Evaluate the decision
                    recommendation = evaluate_decision(hand_total, dealer_upcard, None)
                    is_correct = evaluate_decision(hand_total, dealer_upcard, decision)
                    
                    # Update statistics
                    total_decisions += 1
                    if is_correct:
                        correct_decisions += 1
                    
                    # Print analysis
                    print(f"\nHand #{hand_number} Analysis:")
                    print(f"Player's cards: {', '.join(current_hand)} (Total: {hand_total})")
                    print(f"Dealer's upcard: {dealer_upcard}")
                    print(f"Current running count: {running_count}")
                    print(f"Player's decision: {decision}")
                    print(f"Recommended decision: {recommendation}")
                    print(f"Decision was: {'CORRECT' if is_correct else 'INCORRECT'}")
            
            i += 1

def get_score():
    """Return the current score (correct decisions and total decisions)."""
    global correct_decisions, total_decisions
    return correct_decisions, total_decisions

# Process the game log
if __name__ == "__main__":
    game_log_file = "gameStats.txt"
    parse_game_log(game_log_file)
    
    # Get final statistics
    correct, total = get_score()
    print(f"\nFinal Statistics:")
    print(f"Total Decisions: {total}")
    print(f"Correct Decisions: {correct}")
    if total > 0:
        print(f"Accuracy: {(correct/total)*100:.2f}%")
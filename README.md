# Blackjack Game - Dockerized

## Overview
This is a simple Blackjack game built with Node.js. Players can play Blackjack, and every action in the gameplay is logged in `GameStats.txt`.

Additionally, a **Hi-Lo card counting strategy** feature is included. Once the game is run, users can execute a separate file to analyze how well their strategy aligns with card counting techniques.

## Prerequisites
Before running this project, ensure you have:
- **Docker** installed on your machine ([Download Docker](https://www.docker.com/get-started))
- Alternatively, Node.js installed for running locally ([Download Node.js](https://nodejs.org/))

## Getting Started
### Running with Docker (Recommended)
1. Clone this repository:
   ```sh
   git clone https://github.com/your-username/blackjack_test_v4.git
   cd blackjack_test_v4
   ```
2. Build the Docker image:
   ```sh
   docker build -t blackjack-game .
   ```
3. Run the Docker container:
   ```sh
   docker run -p 3000:3000 -v $(pwd):/app blackjack-game
   ```
4. Open your browser and go to:
   ```
   http://localhost:3000
   ```
5. Play the game! All gameplay actions are logged in `GameStats.txt`.

### Running Locally (Without Docker)
1. Install dependencies:
   ```sh
   npm install
   ```
2. Start the server:
   ```sh
   node server.js
   ```
3. Open your browser and visit:
   ```
   http://localhost:3000
   ```

## Hi-Lo Card Counting Strategy Analysis
- After playing the game, users can run a dedicated script to analyze how well their decisions align with the Hi-Lo card counting strategy.
- This helps players evaluate and improve their Blackjack strategy over time.

## Game Stats Logging
- Every action performed in the game is recorded in `GameStats.txt`.
- This file helps track game progress and review past gameplay.


# Blackjack Game - Dockerized

## Overview

This is a simple Blackjack game built with Node.js. Players can play Blackjack, and every action in the gameplay is logged in `GameStats.txt`.

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
   docker run -p 3000:3000 blackjack-game
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

## Game Stats Logging

- Every action performed in the game is recorded in `GameStats.txt`.
- This file helps track game progress and review past gameplay.

## Contributing

Feel free to fork this repository, create a feature branch, and submit a pull request!

## License

This project is licensed under the MIT License.


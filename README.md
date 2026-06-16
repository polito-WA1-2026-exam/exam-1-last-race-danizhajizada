# Exam #1: "Last Race"
## Student: s354975 HAJIZADA DANIZ

## React Client Application Routes

- Route `/`: public homepage. Shows a login form and the game instructions to anonymous users; redirects to `/game` if already authenticated.
- Route `/game`: main game page (auth required). Manages the four game phases in sequence: setup, planning, execution, result.
- Route `/ranking`: global ranking page showing each user's best score (auth required).
- Route `*`: catch-all, redirects to `/game` if authenticated or to `/` otherwise.

## API Server

- POST `/api/login`
  - request body: `{ username: string, password: string }`
  - response: `{ id: number, username: string }` or `401`
- GET `/api/sessions/current`
  - response: `{ id: number, username: string }` or `401`
- POST `/api/logout`
  - response: `{ message: string }`
- GET `/api/network`
  - requires login
  - response: `{ stations: [{ id, name }], segments: [{ id, line_name, station1_name, station2_name }] }`
- POST `/api/games`
  - requires login
  - creates a new game with a random start/destination pair (minimum distance of 3 segments) and 20 initial coins
  - response: `{ id, startStation: { id, name }, destinationStation: { id, name }, minimumDistance, initialCoins, status }`
- GET `/api/games/:id`
  - requires login
  - URL parameter: `id` - game id
  - response: game details (`startStation`, `destinationStation`, `initialCoins`, `finalScore`, `status`, ...)
- POST `/api/games/:id/plan`
  - requires login
  - URL parameter: `id` - game id
  - request body: `{ segments: number[] }` - ordered list of segment ids
  - response (valid route): `{ valid: true, gameId, status: 'planned', route: [{ segmentId, lineId, lineName, fromStation, toStation, position }] }`
  - response (invalid route): `400` with `{ error: string }`


## Database Tables

- Table `users` - registered users with hashed password and per-user salt (id, username, password_hash, salt)
- Table `lines` - metro lines (id, name, color)
- Table `stations` - metro stations (id, name)
- Table `line_stations` - junction table linking stations to lines with their position order; used to derive the network topology and interchange stations
- Table `segments` - connections between two stations on a given line (id, station1_id, station2_id, line_id)
- Table `events` - random events that can occur on a segment (id, description, coin_effect from -4 to +4)
- Table `games` - game sessions with assigned start/destination stations, initial coins, final score and status (id, user_id, start_station_id, destination_station_id, initial_coins, final_score, status, created_at)
- Table `planned_segments` - ordered list of segments planned by the player for a game (id, game_id, segment_id, position)
- Table `game_events` - record of the random event that occurred on each planned segment during execution, with coin balance before/after (id, game_id, segment_id, event_id, position, coins_before, coins_after)


## Main React Components

- `LoginForm` (in `LoginForm.jsx`): login form and "How to play" instructions, shown to anonymous users on `/`.
- `Header` (in `Header.jsx`): top navigation bar; shows the app name, and the username plus a logout button when authenticated.
- `GamePage` (in `GamePage.jsx`): orchestrates the four game phases (setup → planning → execution → result), handles segment selection/reordering, the planning timer, and renders the execution result.
- `StationMap` (in `StationMap.jsx`): renders the metro network as an SVG map, optionally hiding the line colors and/or station names depending on the current game phase.
- `RankingPage` (in `RankingPage.jsx`): fetches and displays the global ranking with each user's best score.


## Screenshot

![Screenshot](./img/screenshot.jpg)

## Users Credentials

- alice, password
- bob, password
- carol, password

## Use of AI Tools

I used ChatGPT to generate a base foundation code for the project (can be seen from the commit history). Later in the development, I used Claude and Cloude Code for refactoring and improving already-working implementation (week exercise solutions and examples)  and combining it  with the base foundation code. It all included: restructuring the project layout,  cleaning up  dead code, improving the API authentication checks and solve  bugs. 

All  suggestions made,  were reviewd and manually checked (running tests and reviewing the flow) before bbeing integrated to the main branch. The overall structure and design decisions are my own.
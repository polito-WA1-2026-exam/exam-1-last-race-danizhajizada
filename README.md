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



## Main React Components



## Screenshot

![Screenshot](./img/screenshot.jpg)

## Users Credentials

- alice, password
- bob, password
- carol, password

## Use of AI Tools

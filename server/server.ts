import express from "express";
import type { Request, Response } from "express";
import cors from "cors";
import pkg from "lodash";
import path from "path";
const { shuffle } = pkg;

type Player = {
    name: string;
    role: string;
};

type StartInfo = {
    knowledgeTable: Record<string, string[]>;
    roles: string[];
};

type VoteInfo = {
    players: string[];
    numFails: number;
};

let players: Player[] = [];
let inGame = false;
let knowledgeTable: Record<string, string[]>;
let voters: string[] = [];
let numVoted = 0;
let numFails: number;
let round = 0;

let voteResults: VoteInfo[] = [];

const app = express();
app.use(cors());
app.use(express.json());

const __dirname = path.resolve();
app.use(express.static(path.join(__dirname, "../client/dist")));

app.post("/join", (req: Request, res: Response) => {
    if (inGame) return res.sendStatus(401);

    const { name } = req.body as { name: string };
    console.log(`${name} joined`);
    const newPlayer: Player = { name, role: "" };

    if (players.map(({ name }) => name).includes(name))
        return res.sendStatus(400);

    players.push(newPlayer);
    res.sendStatus(200);
});

app.post("/quit", (req: Request, res: Response) => {
    if (inGame) return res.sendStatus(400);

    const { name } = req.body as { name: string };
    console.log(`${name} quit`);
    players = players.filter((player) => player.name !== name);
    res.sendStatus(200);
});

app.post("/start", (req: Request, res: Response) => {
    if (inGame) return res.sendStatus(401);
    const { knowledgeTable: table, roles } = req.body as StartInfo;
    if (roles.length !== players.length) return res.sendStatus(400);

    inGame = true;
    voters = [];
    numVoted = 0;
    numFails = 0;
    round = 0;
    voteResults = [];
    knowledgeTable = table;

    console.log("Game started");

    players = shuffle(players);

    if (roles.length !== players.length) return res.sendStatus(401);
    for (let i = 0; i < players.length; ++i) players[i]!.role = roles[i]!;

    res.sendStatus(200);
});

app.post("/end", (_: Request, res: Response) => {
    inGame = false;
    return res.sendStatus(200);
});

app.get("/role", (req: Request, res: Response) => {
    const { name } = req.query as { name: string };

    if (!inGame) return res.sendStatus(400);

    const role = players.find((player) => player.name == name)!.role;
    const knows = players
        .filter((player) => knowledgeTable[role]?.includes(player.role))
        .map(({ name }) => name);
    const data = {
        role,
        knows: shuffle(knows),
        knowledgeTable,
    };

    console.log(data);

    res.json(data);
});

app.get("/list", (_: Request, res: Response) => {
    // console.log("Requested players list");
    res.json(players.map(({ name }) => name));
});

app.get("/active", (_: Request, res: Response) => {
    // console.log("Requested game active status");
    res.json(inGame);
});

app.post("/start-vote", (req: Request, res: Response) => {
    if (voters.length !== 0) return res.sendStatus(400);
    const { names } = req.body as { names: string[] };
    console.log("Started vote: ", names);
    voters = names;
    numFails = 0;
    numVoted = 0;
    ++round;
    res.sendStatus(200);
});

app.get("/current-vote", (_: Request, res: Response) => {
    res.json({ voteResults, voters, round });
});

app.post("/vote", (req: Request, res: Response) => {
    const { vote, name } = req.body as { vote: boolean; name: string };
    if (!voters.includes(name)) return res.sendStatus(400);

    const player = players.find((player) => player.name == name)!;

    if (!player.role.includes("b") && !vote) return res.sendStatus(401);
    if (!vote) ++numFails;

    ++numVoted;
    console.log(`${name} voted ${vote ? "good" : "bad"}`);

    if (numVoted == voters.length) {
        voteResults.push({ players: voters, numFails });
        voters = [];
    }

    res.sendStatus(200);
});

// Timer code

let interval: NodeJS.Timeout | null = null;
let currentTime: number = 0;

app.post("/start-timer", (req: Request, res: Response) => {
    const { time } = req.body as { time: number };

    if (time <= 0) return res.sendStatus(400);

    console.log("Started timer: ", time);
    currentTime = time;

    if (interval) clearInterval(interval);

    interval = setInterval(() => {
        if (--currentTime < 0) {
            clearInterval(interval!);
        }
    }, 1000);
    res.sendStatus(200);
});

app.post("/toggle-timer", (_: Request, res: Response) => {
    if (interval) {
        clearInterval(interval);
        interval = null;
        return res.sendStatus(200);
    }

    interval = setInterval(() => {
        if (--currentTime < 0 && interval) {
            clearInterval(interval);
        }
    }, 1000);

    res.sendStatus(200);
});

app.get("/get-time", (_: Request, res: Response) => {
    res.json(currentTime);
});

app.get(/.*/, (_: Request, res: Response) => {
    res.sendFile(path.join(__dirname, "../client/dist/index.html"));
});

const PORT = 4000;
app.listen(PORT, () => {
    console.log(`✅ Server running at http://localhost:${PORT}`);
});

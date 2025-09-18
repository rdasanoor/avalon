import express from "express";
import type { Request, Response } from "express";
import cors from "cors";
import pkg from "lodash";
const { shuffle } = pkg;

interface Player {
    name: string;
    role: string;
}

let players: Player[] = [];
let started = false;
let knowledgeTable: Record<string, string[]>;
let voters: string[] = [];
let numVoted = 0;
let numFails: number;
let round = 0;

interface VoteInfo {
    players: string[];
    numFails: number;
}

let voteResults: VoteInfo[] = [];

const app = express();
app.use(cors());
app.use(express.json());

app.post("/game", (req: Request, res: Response) => {
    players = [];
    started = false;
    voters = [];
    numVoted = 0;
    numFails = 0;
    round = 0;
    voteResults = [];
    knowledgeTable = req.body as Record<string, string[]>;
    console.log("Game created: ", knowledgeTable);
    res.sendStatus(200);
});

app.post("/join", (req: Request, res: Response) => {
    const { name } = req.body as { name: string };
    console.log(`${name} joined`);
    const newPlayer: Player = { name, role: "" };

    if (players.map(({ name }) => name).includes(name))
        return res.sendStatus(400);

    players.push(newPlayer);
    res.sendStatus(200);
});

app.post("/start", (req: Request, res: Response) => {
    console.log("Game started: ", started);
    if (started) return res.sendStatus(400);

    started = true;

    const { roles } = req.body as { roles: string[] };
    players = shuffle(players);

    if (roles.length !== players.length) return res.sendStatus(401);
    for (let i = 0; i < players.length; ++i) players[i]!.role = roles[i]!;

    res.sendStatus(200);
});

app.get("/role", (req: Request, res: Response) => {
    const { name } = req.query as { name: string };

    if (!started) return res.sendStatus(400);

    console.log(knowledgeTable);

    const role = players.find((player) => player.name == name)!.role;
    const knows = players
        .filter((player) => knowledgeTable[role]?.includes(player.role))
        .map(({ name }) => name);

    res.json({
        role,
        knows: shuffle(knows),
    });
});

app.get("/list", (_: Request, res: Response) => {
    console.log("Requested players list");
    res.json(players.map(({ name }) => name));
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

const PORT = 4000;
app.listen(PORT, () => {
    console.log(`✅ Server running at http://localhost:${PORT}`);
});

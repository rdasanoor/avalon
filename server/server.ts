import express from "express";
import http from "http";
import session from "express-session";
import { Server } from "socket.io";

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const sessionMiddleware = session({
    secret: "secret",
    resave: false,
    saveUninitialized: false,
});

app.use(sessionMiddleware);

io.use((socket, next) => {
    sessionMiddleware(socket.request as any, {} as any, next as any);
});

interface PlayerSession extends session.Session {
    name?: string | undefined;
    kicked: boolean;
}

type KnowledgeTable = Record<string, string[]>;

interface StartGameRequestData {
    knowledgeTable: KnowledgeTable;
    roles: string[];
}

interface Mission {
    voters: string[];
    failsRequired: number;
    votes: Record<string, boolean>;
    fails: number;
}

interface StartVoteRequestData {
    voters: string[];
    failsRequired: number;
}

interface CastVoteRequestData {
    vote: boolean;
}

type StartGameRequest = express.Request<{}, {}, StartGameRequestData>;
type StartVoteRequest = express.Request<{}, {}, StartVoteRequestData>;
type CastVoteRequest = express.Request<{}, {}, CastVoteRequestData>;

// Maps player name to role
let players: Record<string, string> = {};
let started = false;
let missions: Mission[] = [];

io.on("connection", (socket) => {
    const req = socket.request as express.Request & { session: PlayerSession };

    if (req.session.id && !req.session.kicked) {
        socket.emit("welcomeBack", {
            name: session.name,
        });
    }

    socket.on("join", (name: string) => {
        if (req.session.kicked) {
            socket.emit("error", "You have been kicked from the game!");
            return;
        }
        if (name in players) {
            socket.emit("error", "Name already taken!");
            return;
        }

        socket.join(name);
        req.session.name = name;
        req.session.kicked = false;
        req.session.save();

        players[name] = "";
        socket.broadcast.emit("playerJoined", { name: name });
    });

    socket.on("quit", () => {
        if (!req.session.name) {
            socket.emit("error", "You are not in the game!");
            return;
        }

        if (started) {
            socket.emit("error", "Game has already started!");
            return;
        }

        socket.leave(req.session.name);
        delete players[req.session.name];
        delete req.session.name;
        req.session.save();

        socket.broadcast.emit("playerQuit", { name: req.session.name });
    });

    socket.on("rejoin", () => {
        if (!req.session.name) {
            socket.emit("error", "You are not in the game!");
            return;
        }

        socket.join(req.session.name);
    });
});

app.get("/players", (_, res) => {
    res.status(200).json(Object.keys(players));
});

app.get("/me", (req, res) => {
    if (!req.session.name) {
        res.sendStatus(401);
        return;
    }

    res.status(200).json({
        name: req.session.name,
        role: players[req.session.name],
    });
});

app.post("/game", (req: StartGameRequest, res) => {
    if (started) {
        res.sendStatus(400);
        return;
    }

    if (Object.keys(players).length !== req.body.roles.length) {
        res.sendStatus(400);
        return;
    }

    const knowledgeTable = req.body.knowledgeTable;

    for (const role of req.body.roles) {
        if (!(role in knowledgeTable)) {
            res.sendStatus(400);
            return;
        }
    }

    const shuffle = ([...arr]) => {
        let nextIndex = arr.length;
        while (nextIndex) {
            const swapIndex = Math.floor(Math.random() * nextIndex--);
            [arr[nextIndex], arr[swapIndex]] = [arr[swapIndex], arr[nextIndex]];
        }
        return arr;
    };

    const roles = shuffle(req.body.roles);

    for (const player in players) {
        players[player] = roles.shift();
    }

    for (const player in players) {
        const knows = [];
        const role = players[player]!;

        for (const know of knowledgeTable[role]!) {
            const other = Object.entries(players).find(
                ([_, role]) => role == know,
            )!;
            knows.push(other);
        }

        io.to(player).emit("role", role, knows);
    }

    started = true;
    missions = [];

    return res.sendStatus(200);
});

app.delete("/game", (_, res) => {
    started = false;
    players = {};
    io.emit("gameEnded");
    return res.sendStatus(200);
});

app.post("/vote", (req: StartVoteRequest, res) => {
    const mission: Mission = { ...req.body, fails: 0, votes: {} };
    missions.push(mission);
    io.emit("voteStarted", req.body);
    return res.sendStatus(200);
});

app.put("/vote", (req: CastVoteRequest, res) => {
    if (!req.session.name) return res.sendStatus(401);

    const mission = missions[missions.length - 1];

    if (!mission) return res.sendStatus(404);
    if (!mission.voters.includes(req.session.name)) return res.sendStatus(403);
    if (req.session.name in mission.votes) return res.sendStatus(409);
    if (Object.keys(mission.votes).length == mission.voters.length)
        return res.sendStatus(409);

    mission.votes[req.session.name] = req.body.vote;
    io.emit("voted", { voter: req.session.name });

    if (Object.keys(mission.votes).length == mission.voters.length) {
        io.emit("voteEnded", mission.fails);
    }

    return res.sendStatus(200);
});

server.listen(4000, () => {
    console.log("Listening on port 4000");
});

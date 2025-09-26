import express from 'express';
import http from 'http';
import session from 'express-session';
import { Server } from 'socket.io';

const app = express();
const server = http.createServer(app)
const io = new Server(server);

const sessionMiddleware = session({
    secret: 'secret',
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

interface StartRequestData {
    knowledgeTable: KnowledgeTable;
    roles: string[];
}

interface Vote {
    voters: string[];
    failsRequired: number;
    results: Record<string, boolean>;
    fails?: number;
}

type StartRequest = express.Request<{}, {}, StartRequestData>;

let knowledgeTable: KnowledgeTable;
let votes: Vote[] = [];
let players: Record<string, string> = {};
let started = false;

io.on('connection', (socket) => {
   const req = socket.request as express.Request & { session: PlayerSession };

   if (req.session.id && !req.session.kicked) {
       socket.emit("welcomeBack", {
           name: session.name,
       });
   }

   socket.on('join', (name: string) => {
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

       socket.broadcast.emit('playerJoined', { name: name });
   });

   socket.on('quit', () => {
      if (!req.session.name) {
          socket.emit("error", "You are not in the game!");
          return;
      }

      socket.leave(req.session.name);
      delete req.session.name;

      socket.broadcast.emit('playerQuit', { name: req.session.name });
   });
});

app.get('/players', (req, res) => {
   res.status(200).json(Object.keys(players));
});

app.get('/me', (req, res) => {
    if (!req.session.name) {
        res.sendStatus(401);
        return;
    }

    res.status(200).json({
        name: req.session.name,
        role: players[req.session.name],
    });
});

app.post('/game', (req: StartRequest, res) => {
    if (started) {
        res.sendStatus(400);
        return;
    }

    if (Object.keys(players).length !== req.body.roles.length) {
        res.sendStatus(400);
        return;
    }

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

    for (const player of Object.keys(players)) {
        players[player] = roles.shift();
    }
    knowledgeTable = req.body.knowledgeTable;
    started = true;
    votes = [];

    return res.sendStatus(200);
});

app.delete('/game', (req, res) => {
    started = false;
    players = {};
    knowledgeTable = {};
    io.emit('gameEnded');
    return res.sendStatus(200);
});

server.listen(4000, () => {
    console.log('Listening on port 4000');
})
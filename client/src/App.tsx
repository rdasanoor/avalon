import "./index.css";
import * as Game from "./game";
import { useState, useEffect, useRef } from "react";
import PlayerModal from "./Players";
import VoteModal from "./Vote";

function GamePage({ onJoin }: { onJoin: (name: string) => void }) {
    const [joined, setJoined] = useState(
        () => localStorage.getItem("joined") || false,
    );
    const [players, setPlayers] = useState([]);
    const audioRef = useRef<HTMLAudioElement>(null);

    const handleNewGame = async () => {
        const knowledgeTable = window.prompt("Enter knowledge table");

        if (!knowledgeTable) return;

        if (!knowledgeTable.trim()) {
            alert("You must enter a knowledge table!");
            return;
        }

        await Game.createGame(knowledgeTable);
    };

    const handleJoinGame = async () => {
        if (joined) {
            alert("You already joined!");
            return;
        }

        const name = window.prompt("Enter name");

        if (!name) return;

        if (!name.trim()) {
            alert("You must enter a name!");
            return;
        }

        const res = await Game.joinGame(name);

        if (res.status == 400) {
            alert("Name already being used!");
            return;
        }

        localStorage.setItem("joined", JSON.stringify(true));
        localStorage.setItem("name", name);
        setJoined(true);
        onJoin(name);

        if (audioRef.current) {
            console.log("Sound playing");
            audioRef.current.currentTime = 0;
            audioRef.current.play();
        }
    };

    const handleStartGame = async () => {
        const roles = window.prompt("Enter roles");

        if (!roles) return;

        if (!roles.trim()) {
            alert("You must enter roles!");
            return;
        }

        const res = await Game.startGame(roles.split(","));

        if (res.status == 400) alert("Game already started");
        if (res.status == 401)
            alert("Number of roles does not match number of players");
    };

    useEffect(() => {
        const interval = setInterval(async () => {
            const res = await Game.getPlayers();
            setPlayers(await res.json());
        }, 500);

        return () => clearInterval(interval);
    }, []);

    return (
        <div className="flex flex-col justify-center items-center">
            <audio ref={audioRef} src="sound.mp3" preload="auto" />
            <button
                className="text-black px-4 py-2 rounded bg-white text-xl font-bold mt-6 cursor-pointer w-fit"
                onClick={handleNewGame}
            >
                New Game
            </button>
            <button
                className="text-black px-4 py-2 rounded bg-white text-xl font-bold mt-8 cursor-pointer w-fit"
                onClick={handleJoinGame}
            >
                Join Game
            </button>
            <button
                className="text-black px-4 py-2 rounded bg-white text-xl font-bold mt-8 cursor-pointer w-fit"
                onClick={handleStartGame}
            >
                Start Game
            </button>
            <div className="font-bold text-xl mt-8">Current Players</div>
            {players.map((player, i) => {
                return (
                    <div className="text-xl" key={i}>
                        {player}
                    </div>
                );
            })}
        </div>
    );
}

interface VoteInfo {
    players: string[];
    numFails: number;
}

interface StateInfo {
    role: string;
    knows: string[];
    leader: string;
    card: string;
}

function VotePage({ name }: { name: string | null }) {
    const [info, setInfo] = useState<StateInfo | null>(null);
    const [voteResults, setVoteResults] = useState<VoteInfo[]>([]);
    const [players, setPlayers] = useState<string[]>([]);
    const [voting, setVoting] = useState(false);
    const [showVote, setShowVote] = useState(false);
    const votingRounds = useRef<number[]>([]);

    useEffect(() => {
        if (info || !name) return;

        const interval = setInterval(async () => {
            const res = await Game.requestRole(name);
            if (res.status == 200) setInfo(await res.json());
        }, 500);

        return () => clearInterval(interval);
    }, [info, name]);

    useEffect(() => {
        const interval = setInterval(async () => {
            const res = await Game.getCurrentVote();
            const data = await res.json();
            setVoteResults((_) => data.voteResults);

            if (
                !votingRounds.current.includes(data.round) &&
                data.voters.includes(name)
            ) {
                setShowVote(true);
                votingRounds.current.push(data.round);
            }
        }, 500);

        return () => clearInterval(interval);
    }, [name]);

    const handleStartVote = async () => {
        const allPlayers = await (await Game.getPlayers()).json();
        setPlayers(allPlayers);
    };

    return (
        <>
            {voting && (
                <VoteModal
                    onClose={() => setVoting(false)}
                    onVote={async (vote) => {
                        const res = await Game.vote(name!, vote == "good");

                        if (res.status == 200) {
                            setVoting(false);
                            setShowVote(false);
                        } else
                            alert("Bro you're a good guy. You can't vote bad.");
                    }}
                />
            )}

            <PlayerModal
                onClose={() => setPlayers([])}
                players={players}
                onConfirm={async (players) => {
                    if (players.length == 0) {
                        alert("You must enter voters!");
                        return;
                    }

                    const res = await Game.startVote(players);

                    if (res.status == 400) alert("Vote already started");
                    setPlayers([]);
                }}
            />

            <div className="flex flex-col w-full h-full text-white">
                <div className="bg-blue-300 w-full flex justify-center items-center p-4 text-xl text-black">
                    {info !== null
                        ? `Role: ${info.role} | Knows ${info.knows.length == 0 ? "no-one" : info.knows}`
                        : "Waiting for game to start"}
                </div>
                <div className="flex-1 flex flex-col border-while border-2 mt-2 items-center">
                    <h1 className="w-full flex justify-center items-center p-4 text-3xl text-white">
                        Vote Actions
                    </h1>
                    <button
                        className="text-black px-4 py-2 rounded bg-white text-xl font-bold cursor-pointer w-fit mt-2"
                        onClick={handleStartVote}
                    >
                        Start Vote
                    </button>
                    {name && showVote && (
                        <button
                            className="text-black px-4 py-2 rounded bg-white text-xl font-bold cursor-pointer w-fit mt-8"
                            onClick={() => setVoting(true)}
                        >
                            Vote
                        </button>
                    )}
                    <div className="flex flex-col mt-4 gap-4">
                        {voteResults.map((result, idx) => (
                            <li
                                key={idx}
                                className="flex justify-between items-center p-2 text-2xl gap-12"
                            >
                                <span>Voters: {result.players.join(", ")}</span>
                                <span>
                                    Number of fails:{" "}
                                    <span
                                        className={`font-bold ${
                                            result.numFails === 0
                                                ? "text-green-600"
                                                : "text-red-600"
                                        }`}
                                    >
                                        {result.numFails}
                                    </span>
                                </span>
                            </li>
                        ))}
                    </div>
                </div>
            </div>
        </>
    );
}

function App() {
    const [votePage, setVotePage] = useState(false);
    const [name, setName] = useState<string | null>(
        () => localStorage.getItem("name") || null,
    );

    return (
        <div className="flex flex-col items-center w-screen h-screen bg-black">
            {name && (
                <button
                    className="fixed top-3 left-3 text-white px-4 py-2 rounded-lg bg-black text-sm font-bold cursor-pointer"
                    onClick={() => setVotePage((votePage) => !votePage)}
                >
                    Switch page
                </button>
            )}
            <button
                className="fixed top-3 right-3 text-white px-4 py-2 rounded-lg bg-black text-sm font-bold cursor-pointer"
                onClick={() => localStorage.clear()}
            >
                Reset
            </button>
            <h1 className="text-4xl font-bold bg-white text-black w-full text-center p-2">
                Avalon
            </h1>
            <div className="flex-1 p-2 w-full h-full">
                <div className={votePage ? "hidden h-full" : "h-full"}>
                    <GamePage onJoin={setName} />
                </div>
                <div className={votePage ? "h-full" : "hidden h-full"}>
                    <VotePage name={name} />
                </div>
            </div>
        </div>
    );
}

export default App;

import { useState, useRef, useEffect } from "react";
import * as Game from "./game";
import { useUser } from "./UserContext";
import GameSetupOverlay from "./Config";
import type { Config } from "./Config";
import * as Utils from "./utils";
import { useSocket } from "./SocketContext";

export default function GamePage() {
    const { name, setName } = useUser();
    const [players, setPlayers] = useState<string[]>([]);
    const [inGame, setInGame] = useState(false);
    const [configOpen, setConfigOpen] = useState(false);
    const audioRef = useRef<HTMLAudioElement>(null);
    const socket = useSocket();

    const handleJoinGame = async () => {
        const newName = Utils.requestInfo("name");

        if (!newName) return;

        const res = await Game.joinGame(newName);

        if (res.status == 400) {
            alert("Name already being used!");
            return;
        }

        if (res.status == 401) {
            alert("Game already in progress!");
            return;
        }

        setName(newName);

        // if (audioRef.current) {
        //     console.log("Sound playing");
        //     audioRef.current.currentTime = 0;
        //     audioRef.current.play();
        // }
    };

    const handleStartGame = async ({ knowledgeTable, roles }: Config) => {
        const res = await Game.startGame(JSON.stringify(knowledgeTable), roles);

        // Neither of these should never be happening, but they are here in case they do
        // The UI should prevent both of these from happening
        if (res.status == 400) {
            alert("Number of roles does not match number of players!");
            return;
        }

        if (res.status == 401) {
            alert("Game already in progress!");
            return;
        }

        setConfigOpen(false);
    };

    const handleQuitGame = async () => {
        const res = await Game.quitGame(name);
        if (res.status == 400) alert("Cannot quit while game is in progress!");
        setName("");
    };

    // Poll to get all current players and active state
    useEffect(() => {
        socket.on("playerJoined", ({ name }) =>
            setPlayers((players) =>
                players.includes(name) ? players : [...players, name],
            ),
        );
        socket.on("role", () => setInGame(true));
        socket.on("gameEnded", () => setInGame(false));

        return () => {
            socket.off("playerJoined");
            socket.off("role");
            socket.off("gameEnded");
        };
    }, []);

    return (
        <div className="flex flex-col justify-center items-center">
            <audio ref={audioRef} src="sound.mp3" preload="auto" />

            <GameSetupOverlay
                totalPlayers={players.length}
                open={configOpen}
                onClose={() => setConfigOpen(false)}
                onConfirm={handleStartGame}
            />

            {name === "" && (
                <button
                    className="text-black px-4 py-2 rounded bg-white text-xl font-bold mt-8 cursor-pointer w-fit"
                    onClick={handleJoinGame}
                >
                    Join Game
                </button>
            )}

            {!inGame && (
                <button
                    className="text-black px-4 py-2 rounded bg-white text-xl font-bold mt-8 cursor-pointer w-fit"
                    onClick={() => setConfigOpen(true)}
                >
                    Start Game
                </button>
            )}

            {name !== "" && !inGame && (
                <button
                    className="text-black px-4 py-2 rounded bg-white text-xl font-bold mt-8 cursor-pointer w-fit"
                    onClick={handleQuitGame}
                >
                    Quit Game
                </button>
            )}

            {name !== "" && inGame && (
                <button
                    className="text-black px-4 py-2 rounded bg-white text-xl font-bold mt-8 cursor-pointer w-fit"
                    onClick={Game.endGame}
                >
                    End Game
                </button>
            )}

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

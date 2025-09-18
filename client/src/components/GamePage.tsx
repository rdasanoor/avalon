import { useState, useRef, useEffect } from "react";
import * as Game from "./game";
import { useUser } from "./UserContext";

function requestInfo(name: string) {
    const info = window.prompt(`Enter ${name}`);

    if (!info) return null;

    if (!info.trim()) {
        alert(`You must enter ${name}!`);
        return null;
    }

    return info;
}

export default function GamePage() {
    const { name, setName } = useUser();
    const [players, setPlayers] = useState([]);
    const [inGame, setInGame] = useState(false);
    const audioRef = useRef<HTMLAudioElement>(null);

    const handleJoinGame = async () => {
        const newName = requestInfo("name");

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

        if (audioRef.current) {
            console.log("Sound playing");
            audioRef.current.currentTime = 0;
            audioRef.current.play();
        }
    };

    const handleStartGame = async () => {
        const knowledgeTable = requestInfo("knowledge table");

        if (!knowledgeTable) return;

        const roles = requestInfo("roles");

        if (!roles) return;

        const res = await Game.startGame(knowledgeTable, roles.split(","));

        if (res.status == 400)
            alert("Number of roles does not match number of players!");
        if (res.status == 401) alert("Game already in progress!");
    };

    const handleQuitGame = async () => {
        const res = await Game.quitGame(name);
        if (res.status == 400) alert("Cannot quit while game is in progress!");
        setName("");
    };

    // Poll to get all current players
    useEffect(() => {
        const interval = setInterval(async () => {
            const res = await Game.getPlayers();
            setPlayers(await res.json());
        }, 500);

        return () => clearInterval(interval);
    }, []);

    // Poll to see if there is a game active
    useEffect(() => {
        const interval = setInterval(async () => {
            const res = await Game.getActive();
            setInGame(await res.json());
        }, 500);

        return () => clearInterval(interval);
    }, []);

    return (
        <div className="flex flex-col justify-center items-center">
            <audio ref={audioRef} src="sound.mp3" preload="auto" />
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
                    onClick={handleStartGame}
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

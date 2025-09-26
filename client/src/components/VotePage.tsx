import { useState, useEffect } from "react";
import * as Game from "./game";
import PlayerModal from "./Players";
import VoteModal from "./Vote";
import { useUser } from "./UserContext";
import Timer from "./Timer";
import { useSocket } from "./SocketContext";

interface VoteInfo {
    players: string[];
    numFails: number | null; // null means the mission is not finished
}

interface StateInfo {
    role: string;
    knows: string[];
}

type VoteStatus = "CanStart" | "InProgress" | "Voting";

export default function VotePage() {
    const { name } = useUser();
    const [info, setInfo] = useState<StateInfo | null>(null);
    const [voteResults, setVoteResults] = useState<VoteInfo[]>([]);
    const [players, setPlayers] = useState<string[]>([]);
    const [voting, setVoting] = useState(false);
    const [voteStatus, setVoteStatus] = useState<VoteStatus>("CanStart");
    const socket = useSocket();

    // Poll to get role only if player has joined
    useEffect(() => {
        if (!name) return;

        socket.on("role", (role, knows) => setInfo({ role, knows }));

        return () => {
            socket.off("role");
        };
    }, [name]);

    // Display all vote results
    useEffect(() => {
        socket.on("voteStarted", ({ voters, failsRequired: _ }) => {
            setVoting(voters.includes(name));
            setVoteResults((voteResults) => [
                ...voteResults,
                { players: voters, numFails: null },
            ]);
        });
        socket.on("voteEnded", (numFails) => {
            setVoteResults((voteResults) => {
                const lastMission = voteResults[voteResults.length - 1];
                const finalMission = { players: lastMission.players, numFails };
                return [...voteResults.splice(0, -1), finalMission];
            });
        });

        return () => {
            socket.off("voteStarted");
            socket.off("voteEnded");
        };
    }, [name]);

    const handleStartVote = async () => {
        const allPlayers = await (await Game.getPlayers()).json();
        setPlayers(allPlayers);
    };

    return (
        <div className="h-full">
            {voting && (
                <VoteModal
                    onClose={() => setVoting(false)}
                    onVote={async (vote) => {
                        const res = await Game.vote(name!, vote == "good");

                        if (res.status == 200) {
                            setVoting(false);
                            setVoteStatus("InProgress");
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
                        : name === ""
                          ? "You are not in this game"
                          : "Waiting for game to start"}
                </div>

                <div className="flex-1 flex flex-col mt-2 items-center">
                    <h1 className="w-full flex justify-center items-center p-4 text-3xl text-white">
                        Vote Actions
                    </h1>
                    {name !== "" && voteStatus == "CanStart" && (
                        <button
                            className="text-black px-4 py-2 rounded bg-white text-xl font-bold cursor-pointer w-fit mt-2"
                            onClick={handleStartVote}
                        >
                            Start Vote
                        </button>
                    )}
                    {name !== "" && voteStatus == "Voting" && (
                        <button
                            className="text-black px-4 py-2 rounded bg-white text-xl font-bold cursor-pointer w-fit mt-8"
                            onClick={() => setVoting(true)}
                        >
                            Vote
                        </button>
                    )}
                    <div className="flex flex-col mt-4 gap-4">
                        {voteResults.map(
                            (result, idx) =>
                                result.numFails !== null && (
                                    <li
                                        key={idx}
                                        className="flex justify-between items-center p-2 text-2xl gap-12"
                                    >
                                        <span>
                                            Voters: {result.players.join(", ")}
                                        </span>
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
                                ),
                        )}
                    </div>
                </div>

                <div className="absolute bottom-2 right-2">
                    <Timer />
                </div>
            </div>
        </div>
    );
}

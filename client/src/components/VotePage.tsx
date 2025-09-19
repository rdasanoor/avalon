import { useState, useRef, useEffect } from "react";
import * as Game from "./game";
import PlayerModal from "./Players";
import VoteModal from "./Vote";
import { useUser } from "./UserContext";
import Timer from "./Timer";

interface VoteInfo {
    players: string[];
    numFails: number;
}

interface StateInfo {
    role: string;
    knows: string[];
    knowledgeTable: Record<string, string[]>;
}

export default function VotePage() {
    const { name } = useUser();
    const [info, setInfo] = useState<StateInfo | null>(null);
    const [voteResults, setVoteResults] = useState<VoteInfo[]>([]);
    const [players, setPlayers] = useState<string[]>([]);
    const [voting, setVoting] = useState(false);
    const [showVote, setShowVote] = useState(false);
    const votingRounds = useRef<number[]>([]);

    // Poll to get role only while role is undecided and if player has joined
    useEffect(() => {
        if (info || !name) return;

        const interval = setInterval(async () => {
            const res = await Game.requestRole(name);
            if (res.status == 200) {
                let data = await res.json();
                setInfo({
                    role: data.role,
                    knows: data.knows,
                    knowledgeTable: JSON.parse(data.knowledgeTable),
                });
            }
        }, 500);

        return () => clearInterval(interval);
    }, [info, name]);

    // Display all vote results
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
        <div className="h-full">
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
                        : name === ""
                          ? "You are not in this game"
                          : "Waiting for game to start"}
                </div>

                {info && (
                    <>
                        <h1 className="w-full flex justify-center items-center p-4 text-3xl text-white">
                            Knowledge Table
                        </h1>
                        {Object.entries(info.knowledgeTable).map(
                            ([key, value], ind) => (
                                <div className="text-center text-2xl" key={ind}>
                                    {key}:{" "}
                                    {value.length === 0
                                        ? "noone"
                                        : value.join(", ")}
                                </div>
                            ),
                        )}
                    </>
                )}

                <div className="flex-1 flex flex-col mt-2 items-center">
                    <h1 className="w-full flex justify-center items-center p-4 text-3xl text-white">
                        Vote Actions
                    </h1>
                    {name !== "" && (
                        <button
                            className="text-black px-4 py-2 rounded bg-white text-xl font-bold cursor-pointer w-fit mt-2"
                            onClick={handleStartVote}
                        >
                            Start Vote
                        </button>
                    )}
                    {name !== "" && showVote && (
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

                <div className="absolute bottom-2 right-2">
                    <Timer />
                </div>
            </div>
        </div>
    );
}

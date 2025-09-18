import { useState } from "react";
import { CircleX } from "lucide-react";

interface PlayerModalProps {
    players: string[];
    onClose: () => void;
    onConfirm: (selected: string[]) => void;
}

export default function PlayerModal({
    players,
    onClose,
    onConfirm,
}: PlayerModalProps) {
    const [selected, setSelected] = useState<string[]>([]);

    const toggleSelection = (player: string) => {
        setSelected((prev) =>
            prev.includes(player)
                ? prev.filter((p) => p !== player)
                : [...prev, player],
        );
    };

    if (players.length == 0) return null;

    return (
        <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50">
            <div className="bg-white rounded-2xl shadow-xl w-96 p-6 relative">
                {/* Close button */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-gray-500 hover:text-gray-800 cursor-pointer"
                >
                    <CircleX className="w-5 h-5" />
                </button>

                <h2 className="text-xl font-semibold mb-4">Select Players</h2>

                <div className="overflow-y-auto space-y-2 text-black">
                    {players.map((player) => (
                        <label
                            key={player}
                            className="flex items-center gap-2 cursor-pointer hover:bg-gray-100 p-2 rounded-md"
                        >
                            <input
                                type="checkbox"
                                checked={selected.includes(player)}
                                onChange={() => toggleSelection(player)}
                            />
                            <span>{player}</span>
                        </label>
                    ))}
                </div>

                {/* Buttons */}
                <div className="mt-6 flex justify-end gap-3">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 rounded-xl bg-gray-200 hover:bg-gray-300 text-gray-800 cursor-pointer"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={() => onConfirm(selected)}
                        className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white cursor-pointer"
                    >
                        Confirm
                    </button>
                </div>
            </div>
        </div>
    );
}

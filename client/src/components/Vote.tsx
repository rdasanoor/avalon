import { CircleX } from "lucide-react";

interface VoteModalProps {
    onClose: () => void;
    onVote: (vote: "good" | "bad") => void;
}

export default function VoteModal({ onClose, onVote }: VoteModalProps) {
    return (
        <div
            className="fixed inset-0 flex items-center justify-center bg-black/50 z-50"
            onClick={onClose} // close when clicking overlay
        >
            <div
                className="bg-white rounded-2xl shadow-xl w-80 p-6 relative"
                onClick={(e) => e.stopPropagation()} // prevent close on inside click
            >
                {/* Close button */}
                <button
                    onClick={onClose}
                    className="absolute top-6 right-6 text-gray-500 hover:text-gray-800 cursor-pointer"
                >
                    <CircleX className="w-5 h-5" />
                </button>

                <h2 className="text-xl font-semibold mb-6 text-center text-black">
                    Cast Your Vote
                </h2>

                <div className="flex justify-around">
                    <button
                        onClick={() => {
                            onVote("good");
                            onClose();
                        }}
                        className="px-6 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-semibold cursor-pointer"
                    >
                        Good
                    </button>
                    <button
                        onClick={() => {
                            onVote("bad");
                            onClose();
                        }}
                        className="px-6 py-3 rounded-xl bg-red-500 hover:bg-red-600 text-white font-semibold cursor-pointer"
                    >
                        Bad
                    </button>
                </div>
            </div>
        </div>
    );
}

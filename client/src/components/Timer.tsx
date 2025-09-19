import { useState, useEffect } from "react";
import * as Game from "./game";

export default function Timer() {
    const [seconds, setSeconds] = useState(0);

    useEffect(() => {
        const interval = setInterval(async () => {
            const res = await Game.getTime();
            setSeconds(Math.max(await res.json(), 0));
        }, 200);

        return () => clearInterval(interval);
    }, []);

    const handleStart = () => {
        const input = window.prompt("Set timer (sec)");

        if (!input) return;

        const num = Number(input);

        if (isNaN(num)) {
            alert("Input is not a valid number!");
            return;
        }

        Game.startTimer(num);
    };

    return (
        <div className="p-4 border-2 rounded-lg w-64 text-center">
            <p className="text-2xl mb-4">{seconds}s</p>
            <div className="flex justify-between">
                <button
                    onClick={handleStart}
                    className="px-4 py-2 bg-green-500 text-white rounded cursor-pointer hover:bg-green-600"
                >
                    Start
                </button>
                <button
                    onClick={() => Game.toggleTimer()}
                    className="px-4 py-2 bg-red-500 text-white rounded cursor-pointer hover:bg-red-600"
                >
                    Toggle Pause
                </button>
            </div>
        </div>
    );
}

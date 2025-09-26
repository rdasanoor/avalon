import { Routes, Route, Link } from "react-router-dom";
import GamePage from "./components/GamePage";
import VotePage from "./components/VotePage";
import { UserProvider } from "./components/UserContext";
import { SocketProvider } from "./components/SocketContext";

function App() {
    return (
        <div className="h-full">
            {/* Navigation */}
            <nav className="flex gap-4 p-4 bg-white text-black">
                <Link to="/">Home</Link>
                <Link to="/vote">Voting Page</Link>
            </nav>

            {/* Route definitions */}
            <SocketProvider>
                <UserProvider>
                    <Routes>
                        <Route path="/" element={<GamePage />} />
                        <Route path="/vote" element={<VotePage />} />
                    </Routes>
                </UserProvider>
            </SocketProvider>
        </div>
    );
}

export default App;

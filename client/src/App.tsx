import { Routes, Route, Link } from "react-router-dom";
import GamePage from "./components/GamePage";
import VotePage from "./components/VotePage";
import { UserProvider } from "./components/UserContext";

function App() {
    return (
        <div className="h-full">
            {/* Navigation */}
            <nav className="flex gap-4 p-4 bg-white text-black">
                <Link to="/">Home</Link>
                <Link to="/vote">Voting Page</Link>
                <h1 className="absolute left-1/2 transform -translate-x-1/2 top-2 text-4xl font-bold text-center">
                    Avalon
                </h1>
            </nav>

            {/* Route definitions */}
            <UserProvider>
                <Routes>
                    <Route path="/" element={<GamePage />} />
                    <Route path="/vote" element={<VotePage />} />
                </Routes>
            </UserProvider>
        </div>
    );
}

export default App;

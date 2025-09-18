const API_URL = "https://mastadons.me:6767";

export async function createGame(knowledgeTable: string) {
    return await fetch(`${API_URL}/game`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: knowledgeTable,
    });
}

export async function startGame(roles: string[]) {
    return await fetch(`${API_URL}/start`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ roles }),
    });
}

export async function joinGame(playerName: string) {
    return await fetch(`${API_URL}/join`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: playerName }),
    });
}

export async function requestRole(playerName: string) {
    const params = new URLSearchParams({ name: playerName });
    return await fetch(`${API_URL}/role?${params.toString()}`, {
        method: "GET",
    });
}

export async function getPlayers() {
    return await fetch(`${API_URL}/list`, {
        method: "GET",
    });
}

export async function getCurrentVote() {
    return await fetch(`${API_URL}/current-vote`, {
        method: "GET",
    });
}

export async function startVote(names: string[]) {
    return await fetch(`${API_URL}/start-vote`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ names }),
    });
}

export async function vote(name: string, vote: boolean) {
    return await fetch(`${API_URL}/vote`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, vote }),
    });
}

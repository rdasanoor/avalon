type KnowledgeTable = Record<string, string[]>;

export default class Game {
    private knowledgeTable: KnowledgeTable;
    private roles: string[];
    private players: Record<string, string> = {};

    constructor(knowledgeTable: KnowledgeTable, roles: string[]) {
        this.knowledgeTable = knowledgeTable;
        this.roles = roles;
    }

    assignRolesToPlayers() {
        const shuffle = ([...arr]) => {
            let nextIndex = arr.length;
            while (nextIndex) {
                const swapIndex = Math.floor(Math.random() * nextIndex--);
                [arr[nextIndex], arr[swapIndex]] = [arr[swapIndex], arr[nextIndex]];
            }
            return arr;
        };

        const roles = shuffle(this.roles);

        for (const [player, _] of Object.entries(this.players)) {
            this.players[player] = roles.shift();
        }
    }

    hasPlayer(name: string) {
        return name in this.players;
    }

    getPlayerRole(name: string) {
        return this.players[name];
    }
}
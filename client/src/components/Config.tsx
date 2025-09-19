import { useState, useEffect } from "react";
import { CircleX, Plus, Minus } from "lucide-react";

type Role = {
    name: string;
    knows: string[];
};

export type Config = {
    knowledgeTable: Record<string, string[]>;
    roles: string[];
};

const presets: Record<number, Record<string, string[]>> = {
    8: {
        r5: [],
        b5: [],
        L1: ["L2"],
        L2: ["L1"],
        A: ["b5", "bq", "b2"],
        J: ["A", "bq"],
        b2: ["bq"],
        bq: ["b2"],
    },
    7: {
        r5: [],
        b5: [],
        A: ["b5", "bq", "b2"],
        J: ["A", "bq"],
        b2: ["bq"],
        bq: ["b2"],
    },
    6: {
        r5: [],
        b5: [],
        A: ["b5", "bq", "b2"],
        J: ["A", "bq"],
        b2: ["bq"],
        bq: ["b2"],
    },
};

function CustomKnowledgeTable({
    preset,
    setKnowledgeTable,
}: {
    preset: number | null;
    setKnowledgeTable: (table: Record<string, string[]>) => void;
}) {
    if (preset) {
        setKnowledgeTable(presets[preset]);

        return (
            <div>
                {Object.entries(presets[preset]).map(([role, knows], ind) => (
                    <div key={ind} className="text-black text-2xl">
                        {role}: {knows.length == 0 ? "noone" : knows.join(", ")}
                    </div>
                ))}
            </div>
        );
    }

    const [roles, setRoles] = useState<Role[]>([]);
    const [roleName, setRoleName] = useState("");
    const [knowsStr, setKnowsStr] = useState("");

    useEffect(() => {
        const table = Object.fromEntries(
            roles.map(({ name, knows }) => [name, knows]),
        );
        setKnowledgeTable(table);
    }, [roles]);

    const addRole = () => {
        if (roleName.trim() === "") {
            alert("Role name cannot be empty");
            return;
        }

        if (knowsStr.trim() === "") {
            alert("Who the role knows cannot be empty");
            return;
        }

        if (roles.map(({ name }) => name).includes(roleName)) {
            alert("This role name already exists!");
            return;
        }

        setRoles((roles) => [
            ...roles,
            { name: roleName, knows: knowsStr.split(",") },
        ]);
    };

    const deleteRole = (deleteName: string) => {
        setRoles((roles) => roles.filter(({ name }) => name !== deleteName));
    };

    return (
        <div className="flex flex-col w-full">
            <div className="flex w-full gap-3">
                <input
                    type="text"
                    value={roleName}
                    onChange={(e) => setRoleName(e.target.value)}
                    placeholder="Role Name"
                    className="flex-1 border-2 border-black text-black p-2 rounded text-xl"
                />

                <input
                    type="text"
                    value={knowsStr}
                    onChange={(e) => setKnowsStr(e.target.value)}
                    placeholder="Who role knows"
                    className="flex-2 border-2 border-black text-black p-2 rounded text-xl"
                />

                <button
                    className="text-white text-lg cursor-pointer bg-green-500 border-2 rounded-md hover:bg-green-600 p-2"
                    onClick={addRole}
                >
                    Add role
                </button>
            </div>

            {roles.map(({ name, knows }, ind) => (
                <div key={ind} className="flex text-black text-2xl">
                    <div>
                        {name}: {knows.length == 0 ? "noone" : knows.join(", ")}
                    </div>

                    <button
                        className="text-black cursor-pointer hover:text-red-500 p-2"
                        onClick={() => deleteRole(name)}
                    >
                        <CircleX size={20} />
                    </button>
                </div>
            ))}
        </div>
    );
}

function KnowledgeTable({
    setKnowledgeTable,
}: {
    setKnowledgeTable: (table: Record<string, string[]>) => void;
}) {
    const [preset, choosePreset] = useState<number | null>(null);

    return (
        <div className="flex flex-col w-full gap-6">
            <div className="flex flex-col w-full">
                <div className="text-center text-2xl text-black font-bold">
                    Preset Choice
                </div>

                <div className="flex flex-col gap-2 mt-4">
                    {Object.keys(presets).map((key, id) => (
                        <button
                            key={id}
                            className={`text-black text-xl cursor-pointer border-2 rounded hover:bg-gray-200 ${preset === Number(key) && "bg-gray-200"}`}
                            onClick={() => choosePreset(Number(key))}
                        >
                            {key}
                        </button>
                    ))}

                    <button
                        className={`text-black text-xl cursor-pointer border-2 rounded hover:bg-gray-200 ${preset === null && "bg-gray-200"}`}
                        onClick={() => choosePreset(null)}
                    >
                        Custom
                    </button>
                </div>
            </div>

            <div className="flex flex-col w-full">
                <div className="text-center text-2xl text-black font-bold pb-2">
                    Knowledge Table
                </div>

                <CustomKnowledgeTable
                    preset={preset}
                    setKnowledgeTable={setKnowledgeTable}
                />
            </div>
        </div>
    );
}

function Roles({
    knowledgeTable,
    setRoles,
}: {
    knowledgeTable: Record<string, string[]>;
    setRoles: (roles: string[]) => void;
}) {
    const [roleCounts, setRoleCounts] = useState<Record<string, number>>({});

    useEffect(() => {
        setRoles(
            Object.entries(roleCounts)
                .map(([name, count]) => Array(count).fill(name))
                .flat(),
        );
    }, [roleCounts]);

    useEffect(() => {
        setRoleCounts(
            Object.fromEntries(
                Object.entries(knowledgeTable).map(([name, _]) => [name, 0]),
            ),
        );
    }, [knowledgeTable]);

    const onDecr = (name: string) => {
        setRoleCounts((roleCounts) => {
            const newRoleCounts = { ...roleCounts };
            newRoleCounts[name] = Math.max(
                newRoleCounts[name] ? newRoleCounts[name] - 1 : 0,
                0,
            );
            return newRoleCounts;
        });
    };

    const onIncr = (name: string) => {
        setRoleCounts((roleCounts) => {
            const newRoleCounts = { ...roleCounts };
            newRoleCounts[name] = newRoleCounts[name] + 1;
            return newRoleCounts;
        });
    };

    return (
        <div className="w-full flex flex-col text-black mt-4 gap-3">
            <div className="w-full text-center text-2xl font-bold">
                Choose Roles
            </div>

            {Object.entries(knowledgeTable).map(([name, _], ind) => (
                <div key={ind} className="text-2xl flex justify-between">
                    <div>{name}</div>
                    <div className="border-2 rounded flex">
                        <button
                            className="cursor-pointer px-1 bg-green-500 hover:bg-green-600"
                            onClick={() => onIncr(name)}
                        >
                            <Plus />
                        </button>
                        <div className="border-x-2 px-2">
                            {roleCounts[name]}
                        </div>
                        <button
                            className="cursor-pointer px-1 bg-red-500 hover:bg-red-600"
                            onClick={() => onDecr(name)}
                        >
                            <Minus />
                        </button>
                    </div>
                </div>
            ))}
        </div>
    );
}

type Props = {
    open: boolean;
    totalPlayers: number;
    onConfirm: (config: Config) => void;
    onClose: () => void;
};

export default function GameSetupOverlay({
    open,
    totalPlayers,
    onConfirm,
    onClose,
}: Props) {
    const [knowledgeTable, setKnowledgeTable] = useState<
        Record<string, string[]>
    >({});
    const [roles, setRoles] = useState<string[]>([]);

    const onConfirmClick = () => {
        if (roles.length !== totalPlayers) {
            alert("The number of roles does not match the number of players!");
            return;
        }

        onConfirm({ roles, knowledgeTable });
    };

    if (!open) return null;

    return (
        <div className="fixed inset-0 flex items-center justify-center bg-black z-50">
            <div className="flex flex-col bg-white p-6 rounded-2xl shadow-xl w-11/12 h-11/12 overflow-y-auto relative">
                {/* Close Button */}
                <button
                    onClick={onClose}
                    className="absolute top-6 right-5 text-gray-600 hover:text-red-500 cursor-pointer"
                >
                    <CircleX size={28} />
                </button>

                <h1 className="text-3xl text-black text-center font-bold">
                    Game Setup
                </h1>

                <div className="flex-1 flex gap-4">
                    {/* Knowledge Table Section */}
                    <KnowledgeTable setKnowledgeTable={setKnowledgeTable} />

                    {/* Choose Roles Section */}
                    <Roles
                        knowledgeTable={knowledgeTable}
                        setRoles={setRoles}
                    />
                </div>

                {/* Confirm Button */}
                <button
                    onClick={onConfirmClick}
                    className="w-full text-black font-bold text-2xl rounded border-2 py-2 bg-green-400 cursor-pointer hover:bg-green-500"
                >
                    Confirm
                </button>
            </div>
        </div>
    );
}

import { useState, useEffect, createContext, useContext } from "react";

function useLocalStorage<T>(key: string, initialValue: T) {
    // Load from localStorage or fall back to initialValue
    const [value, setValue] = useState<T>(() => {
        const item = localStorage.getItem(key);
        return item ? JSON.parse(item) : initialValue;
    });

    // Update localStorage whenever state changes
    useEffect(() => {
        localStorage.setItem(key, JSON.stringify(value));
    }, [key, value]);

    return [value, setValue] as const;
}

type UserContextType = {
    name: string;
    setName: (name: string) => void;
};

const UserContext = createContext<UserContextType>({
    name: "",
    setName: (_) => {},
});

export function UserProvider({ children }: { children: React.ReactNode }) {
    const [name, setName] = useLocalStorage("name", "");

    return <UserContext value={{ name, setName }}>{children}</UserContext>;
}

export function useUser() {
    return useContext(UserContext);
}

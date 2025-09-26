import { createContext, useContext, useEffect } from "react";
import { io, Socket } from "socket.io-client";

const socket: Socket = io("https://mastadons.me:6767", {
    autoConnect: false,
});

const SocketContext = createContext(socket);

export const useSocket = () => useContext(SocketContext);

export function SocketProvider({ children }: { children: React.ReactNode }) {
    useEffect(() => {
        socket.connect();
        return () => {
            socket.disconnect();
        };
    }, []);

    return (
        <SocketContext.Provider value={socket}>
            {children}
        </SocketContext.Provider>
    );
}

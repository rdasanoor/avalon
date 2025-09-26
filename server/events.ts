export interface ClientEvent {
    ping: () => void;
}

export interface ServerEvent {
    pong: () => void;
}
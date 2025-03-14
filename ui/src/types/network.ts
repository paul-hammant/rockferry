export interface NetworkBridge {
    name: string;
    stp: string;
}

export interface Network {
    bridge?: NetworkBridge;
    name: string;
    ipv6: boolean;
}

import { Topology } from "./topology";

export interface NodeInterface {
    addrs: string[] | null;
    flags: string;
    index: number;
    mac: string;
    mtu: number;
    name: string;
}

export interface Node {
    hostname: string;
    kernel: string;
    active_machines: number;
    total_machines: number;
    topology: Topology;
    uptime: number;
    interfaces: NodeInterface[];
}

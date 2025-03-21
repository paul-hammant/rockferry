import { Topology } from "./topology";

export interface MachineDiskTarget {
    dev: string;
}

export interface MachineDiskFile {}

export interface MachineDisk {
    device: string;
    type: string;
    volume: string;

    key: string;
    file?: MachineDiskFile;

    target: MachineDiskTarget;
}

export interface MachineInterface {
    bridge: string;
    mac: string;
    model: string;
    network: string;
}

export interface Machine {
    name: string;
    uuid: string;
    schema: string;

    topology: Topology;

    disks: MachineDisk[];
    interfaces: MachineInterface[];
}

export interface MachineStatusVNC {
    type: string;
    port: string;
}

export interface MachineStatus {
    state: string;
    vnc: MachineStatusVNC[];
}

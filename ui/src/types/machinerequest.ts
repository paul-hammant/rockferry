import { Topology } from "./topology";

interface MachineRequestDisk {
    pool: string;
    capacity: number;
}

interface MachineRequestCdrom {
    key: string;
    volume: string;
}

export interface MachineRequest {
    name: string;
    topology: Topology;
    network: string;
    disks: MachineRequestDisk[];
    cdrom: MachineRequestCdrom;
}

import * as jsonpatch from "fast-json-patch";

export enum ResourceKind {
    Node = "node",
    StoragePool = "storagepool",
    StorageVolume = "storagevolume",
    Network = "network",
    Machine = "machine",
    MachineRequest = "machinerequest",
    Instance = "instance",
    Cluster = "cluster",
    ClusterRequest = "clusterrequest",
}

export enum Phase {
    Requsted = "requested",
    Creating = "creating",
    Errored = "errored",
    Created = "created",
}

export interface OwnerRef {
    kind: ResourceKind;
    id: string;
}

export interface Resource<T, S = Status> {
    id: string;
    kind: ResourceKind;
    annotations: Record<string, string> | undefined;
    owner: OwnerRef | undefined;
    spec: T | undefined;
    status: S;
}

export interface Status {
    phase: Phase;
    error: string;
}

// TODO: avoid using any
export interface CreateResourceInput {
    kind: string;
    annotations: any;
    owner_ref: OwnerRef | undefined;
    spec: any;
}

export interface DeleteResourceInput {
    kind: ResourceKind;
    id: string;
}

export interface PatchResourceInput {
    kind: ResourceKind;
    id: string;
    patches: jsonpatch.Operation[];
}

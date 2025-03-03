export enum ClusterNodeKind {
    Worker = "worker",
    ControlPlane = "control_plane",
}

export interface ClusterNode {
    machine_id: string;
    kind: ClusterNodeKind;
}

export interface Cluster {
    name: string;
}

export enum ClusterStatusState {
    Creating = "creating",
    Healthy = "healthy",
}

export interface ClusterStatus {
    state: ClusterStatusState;
    nodes: ClusterNode[];
    kubernetes_version: string;
    talos_config: string;
}

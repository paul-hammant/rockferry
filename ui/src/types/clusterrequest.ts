//type ClusterRequestNodeSpec struct {
//	Network  string   `json:"network"`
//	Pool     string   `json:"pool"`
//	Topology Topology `json:"topology"`
//}
//
//type ClusterRequestSpec struct {
//	Name              string                    `json:"name"`
//	KubernetesVersion string                    `json:"kubernetes_version"`
//	Workers           []*ClusterRequestNodeSpec `json:"workers"`
//	ControlPlanes     []*ClusterRequestNodeSpec `json:"control_planes"`
//}

import { Topology } from "./topology";

export interface ClusterRequestNode {
    topology: Topology;
}

export interface ClusterRequest {
    name: string;
    kubernetes_version: string;
    workers: ClusterRequestNode;
    control_planes: ClusterRequestNode;
}

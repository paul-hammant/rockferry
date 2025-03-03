package spec

type ClusterRequestNodeSpec struct {
	Topology Topology `json:"topology"`
}

type ClusterRequestSpec struct {
	Name              string                    `json:"name"`
	KubernetesVersion string                    `json:"kubernetes_version"`
	Workers           []*ClusterRequestNodeSpec `json:"workers"`
	ControlPlanes     []*ClusterRequestNodeSpec `json:"control_planes"`
}

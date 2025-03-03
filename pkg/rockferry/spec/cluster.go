package spec

type ClusterNodeKind string
type ClusterStatusState string

const (
	ClusterNodeKindWorker       ClusterNodeKind = "worker"
	ClusterNodeKindControlPlane                 = "control_plane"

	ClusterStatusStateCreating  ClusterStatusState = "creating"
	ClusterStatusStateHealthy                      = "healthy"
	ClusterStatusStateUpgrading                    = "upgrading"
)

type ClusterNodeSpec struct {
	Kind      ClusterNodeKind `json:"kind"`
	MachineId string          `json:"machine_id"`
}

type ClusterSpec struct {
	Name string `json:"name"`

	ControlPlaneConfig []byte `json:"control_plane_config"`
	WorkerConfig       []byte `json:"worker_config"`
	TalosConfig        []byte `json:"talos_config"`

	KubernetesVersion string `json:"kubernetes_version"`

	Nodes []*ClusterNodeSpec `json:"nodes"`
}

type ClusterStatus struct {
	State ClusterStatusState `json:"state"`
}

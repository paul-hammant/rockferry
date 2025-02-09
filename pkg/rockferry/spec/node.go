package spec

type NodeSpec struct {
	Topology Topology `json:"topology"`

	Hostname string `json:"hostname"`
	Kernel   string `json:"kernel"`
	Uptime   int64  `json:"uptime"`

	ActiveMachines uint64 `json:"active_machines"`
	TotalMachines  uint64 `json:"total_machines"`
}

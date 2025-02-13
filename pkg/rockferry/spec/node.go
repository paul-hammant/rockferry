package spec

type NodeInterfaceFlag string

type NodeInterfaceSpec struct {
	Index int      `json:"index"`
	MTU   int      `json:"mtu"`
	Name  string   `json:"name"`
	Mac   string   `json:"mac"`
	Flags string   `json:"flags"`
	Addrs []string `json:"addrs"`
}

type NodeSpec struct {
	Topology Topology `json:"topology"`

	Hostname string `json:"hostname"`
	Kernel   string `json:"kernel"`
	Uptime   int64  `json:"uptime"`

	Interfaces []*NodeInterfaceSpec `json:"interfaces"`

	ActiveMachines uint64 `json:"active_machines"`
	TotalMachines  uint64 `json:"total_machines"`
}

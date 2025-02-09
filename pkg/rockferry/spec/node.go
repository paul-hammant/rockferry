package spec

import (
	"time"
)

type NodeSpec struct {
	Topology Topology `json:"topology"`

	Hostname string    `json:"hostname"`
	Kernel   string    `json:"kernel"`
	UpSince  time.Time `json:"up_since"`

	ActiveMachines uint64 `json:"active_machines"`
	TotalMachines  uint64 `json:"total_machines"`
}

package spec

type MachineRequestSpecDisk struct {
	Pool       string `json:"pool"`
	Capacity   uint64 `json:"capacity"`
	Allocation uint64 `json:"allocation"`
	Volume     string `json:"volume"`
	Key        string `json:"key"`
}

type MachineRequestSpecCdrom struct {
	Key string `json:"key"`
}

type MachineRequestSpec struct {
	Name     string                    `json:"name"`
	Topology Topology                  `json:"topology"`
	Network  string                    `json:"network"`
	Disks    []*MachineRequestSpecDisk `json:"disks"`
	Cdrom    *MachineRequestSpecCdrom  `json:"cdrom"`
}

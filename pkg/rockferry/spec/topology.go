package spec

// Used by node and machine
type Topology struct {
	Sockets uint64 `json:"sockets"`
	Cores   uint64 `json:"cores"`
	Threads uint64 `json:"threads"`
	Memory  uint64 `json:"memory"`
}

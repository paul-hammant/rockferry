package rockferry

import (
	"encoding/json"

	"google.golang.org/protobuf/types/known/structpb"
)

type DefaultStatus struct {
	Phase Phase   `json:"phase"`
	Error *string `json:"error"`
}

type ResourceKind = string

const (
	ResourceKindAll            = ""
	ResourceKindNode           = "node"
	ResourceKindStoragePool    = "storagepool"
	ResourceKindStorageVolume  = "storagevolume"
	ResourceKindNetwork        = "network"
	ResourceKindMachine        = "machine"
	ResourceKindMachineRequest = "machinerequest"
	ResourceKindInstance       = "instance"
)

type Phase string

const (
	PhaseRequested = "requested"
	PhaseCreating  = "creating"
	PhaseErrored   = "errored"
	PhaseCreated   = "created"
)

//type Status struct {
//	Phase Phase   `json:"phase"`
//	Error *string `json:"error"`
//}

type OwnerRef struct {
	// The resource type, such as node
	Kind string `json:"kind"`
	Id   string `json:"id"`
}

type Resource[Spec any, Status any] struct {
	Id          string            `json:"id"`
	Kind        ResourceKind      `json:"kind"`
	Annotations map[string]string `json:"annotations"`
	Owner       *OwnerRef         `json:"owner,omitempty"`
	Spec        Spec              `json:"spec"`
	Status      Status            `json:"status"`

	RawSpec   *structpb.Struct `json:"-"`
	RawStatus *structpb.Struct `json:"-"`
}

func (r *Resource[T, S]) Merge(with *Resource[T, S]) {
	// TODO: More fields possibily?
	for k, v := range with.Annotations {
		r.Annotations[k] = v
	}
}

func (r *Resource[T, S]) Generic() *Resource[any, any] {
	var spec, status interface{}
	spec = r.Spec
	status = r.Status

	return &Resource[any, any]{
		Id:          r.Id,
		Kind:        r.Kind,
		Annotations: r.Annotations,
		Owner:       r.Owner,
		Spec:        &spec, // Store spec as interface{}
		Status:      status,
	}
}

func (r *Resource[T, S]) Marshal() ([]byte, error) {
	return json.Marshal(r)
}

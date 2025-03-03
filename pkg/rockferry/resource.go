package rockferry

import (
	"encoding/json"

	"github.com/eskpil/rockferry/controllerapi"
	"github.com/eskpil/rockferry/pkg/convert"
	"google.golang.org/protobuf/types/known/structpb"
)

type DefaultStatus struct {
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
	ResourceKindClusterRequest = "clusterrequest"
	ResourceKindCluster        = "cluster"
)

type Phase string

const (
	PhasePreProcessing = "preprocessing"
	PhaseRequested     = "requested"
	PhaseCreating      = "creating"
	PhaseErrored       = "errored"
	PhaseCreated       = "created"
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
	Phase       Phase             `json:"phase"`

	RawSpec   *structpb.Struct `json:"-"`
	RawStatus *structpb.Struct `json:"-"`
}

func (r *Resource[T, S]) Merge(with *Resource[T, S]) {
	if len(with.Annotations) > 0 {
		r.Annotations = map[string]string{}
	}

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
		Phase:       r.Phase,
		Annotations: r.Annotations,
		Owner:       r.Owner,
		Spec:        &spec, // Store spec as interface{}
		Status:      status,
	}
}

func (r *Resource[T, S]) Marshal() ([]byte, error) {
	return json.Marshal(r)
}

func (r *Resource[T, S]) Transport() (*controllerapi.Resource, error) {
	out := new(controllerapi.Resource)

	out.Id = r.Id

	out.Kind = string(r.Kind)
	out.Annotations = r.Annotations
	out.Phase = string(r.Phase)

	if r.Owner != nil {
		out.Owner = new(controllerapi.Owner)
		out.Owner.Id = r.Owner.Id
		out.Owner.Kind = r.Owner.Kind
	}

	spec, err := convert.Outgoing(&r.Spec)
	if err != nil {
		return nil, err
	}

	status, err := convert.Outgoing(&r.Status)
	if err != nil {
		return nil, err
	}

	out.Spec = spec
	out.Status = status

	return out, nil
}

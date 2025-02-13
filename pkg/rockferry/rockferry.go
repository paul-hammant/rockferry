package rockferry

import (
	"github.com/eskpil/rockferry/controllerapi"
	"github.com/eskpil/rockferry/pkg/rockferry/spec"
)

type WatchAction = int

const (
	WatchActionPut WatchAction = iota
	WatchActionDelete
	WatchActionAll
)

type MachineRequest = Resource[spec.MachineRequestSpec, DefaultStatus]
type StorageVolume = Resource[spec.StorageVolumeSpec, DefaultStatus]
type StoragePool = Resource[spec.StoragePoolSpec, DefaultStatus]
type Node = Resource[spec.NodeSpec, DefaultStatus]
type Network = Resource[spec.NetworkSpec, DefaultStatus]
type Machine = Resource[spec.MachineSpec, spec.MachineStatus]
type Instance = Resource[spec.InstanceSpec, DefaultStatus]

type Client struct {
	c *controllerapi.ControllerApiClient
	t *Transport

	nodesv1            *Interface[spec.NodeSpec, DefaultStatus]
	storagevolumesv1   *Interface[spec.StorageVolumeSpec, DefaultStatus]
	machinesv1         *Interface[spec.MachineSpec, spec.MachineStatus]
	machinesrequestsv1 *Interface[spec.MachineRequestSpec, DefaultStatus]
	networksv1         *Interface[spec.NetworkSpec, DefaultStatus]
	storagepoolsv1     *Interface[spec.StoragePoolSpec, DefaultStatus]
	instancev1         *Interface[spec.InstanceSpec, DefaultStatus]
}

func New(url string) (*Client, error) {
	transport, err := NewTransport(url)
	if err != nil {
		return nil, err
	}

	return &Client{
		nodesv1:            NewInterface[spec.NodeSpec, DefaultStatus](ResourceKindNode, transport),
		storagevolumesv1:   NewInterface[spec.StorageVolumeSpec, DefaultStatus](ResourceKindStorageVolume, transport),
		machinesv1:         NewInterface[spec.MachineSpec, spec.MachineStatus](ResourceKindMachine, transport),
		machinesrequestsv1: NewInterface[spec.MachineRequestSpec, DefaultStatus](ResourceKindMachineRequest, transport),
		networksv1:         NewInterface[spec.NetworkSpec, DefaultStatus](ResourceKindNetwork, transport),
		storagepoolsv1:     NewInterface[spec.StoragePoolSpec, DefaultStatus](ResourceKindStoragePool, transport),
		instancev1:         NewInterface[spec.InstanceSpec, DefaultStatus](ResourceKindInstance, transport),

		t: transport,
	}, nil
}

func (c *Client) Nodes() *Interface[spec.NodeSpec, DefaultStatus] {
	return c.nodesv1
}

func (c *Client) StorageVolumes() *Interface[spec.StorageVolumeSpec, DefaultStatus] {
	return c.storagevolumesv1
}

func (c *Client) Generic(kind ResourceKind) *Interface[any, any] {
	return NewInterface[any, any](kind, c.t)
}

func (c *Client) Machines() *Interface[spec.MachineSpec, spec.MachineStatus] {
	return c.machinesv1
}

func (c *Client) MachineRequests() *Interface[spec.MachineRequestSpec, DefaultStatus] {
	return c.machinesrequestsv1
}

func (c *Client) Networks() *Interface[spec.NetworkSpec, DefaultStatus] {
	return c.networksv1
}

func (c *Client) StoragePools() *Interface[spec.StoragePoolSpec, DefaultStatus] {
	return c.storagepoolsv1
}

func (c *Client) Resource() *Interface[spec.InstanceSpec, DefaultStatus] {
	return c.instancev1
}

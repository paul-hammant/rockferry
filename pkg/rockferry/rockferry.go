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

type MachineRequest = Resource[spec.MachineRequestSpec]
type StorageVolume = Resource[spec.StorageVolumeSpec]
type StoragePool = Resource[spec.StoragePoolSpec]
type Node = Resource[spec.NodeSpec]
type Network = Resource[spec.NetworkSpec]
type Machine = Resource[spec.MachineSpec]
type Instance = Resource[spec.InstanceSpec]

type Client struct {
	c *controllerapi.ControllerApiClient
	t *Transport

	nodesv1            *Interface[spec.NodeSpec]
	storagevolumesv1   *Interface[spec.StorageVolumeSpec]
	machinesv1         *Interface[spec.MachineSpec]
	machinesrequestsv1 *Interface[spec.MachineRequestSpec]
	networksv1         *Interface[spec.NetworkSpec]
	storagepoolsv1     *Interface[spec.StoragePoolSpec]
	instancev1         *Interface[spec.InstanceSpec]
}

func New(url string) (*Client, error) {
	transport, err := NewTransport(url)
	if err != nil {
		return nil, err
	}

	return &Client{
		nodesv1:            NewInterface[spec.NodeSpec](ResourceKindNode, transport),
		storagevolumesv1:   NewInterface[spec.StorageVolumeSpec](ResourceKindStorageVolume, transport),
		machinesv1:         NewInterface[spec.MachineSpec](ResourceKindMachine, transport),
		machinesrequestsv1: NewInterface[spec.MachineRequestSpec](ResourceKindMachineRequest, transport),
		networksv1:         NewInterface[spec.NetworkSpec](ResourceKindNetwork, transport),
		storagepoolsv1:     NewInterface[spec.StoragePoolSpec](ResourceKindStoragePool, transport),
		instancev1:         NewInterface[spec.InstanceSpec](ResourceKindInstance, transport),

		t: transport,
	}, nil
}

func (c *Client) Nodes() *Interface[spec.NodeSpec] {
	return c.nodesv1
}

func (c *Client) StorageVolumes() *Interface[spec.StorageVolumeSpec] {
	return c.storagevolumesv1
}

func (c *Client) Generic(kind ResourceKind) *Interface[any] {
	return NewInterface[any](kind, c.t)
}

func (c *Client) Machines() *Interface[spec.MachineSpec] {
	return c.machinesv1
}

func (c *Client) MachineRequests() *Interface[spec.MachineRequestSpec] {
	return c.machinesrequestsv1
}

func (c *Client) Networks() *Interface[spec.NetworkSpec] {
	return c.networksv1
}

func (c *Client) StoragePools() *Interface[spec.StoragePoolSpec] {
	return c.storagepoolsv1
}

func (c *Client) Resource() *Interface[spec.InstanceSpec] {
	return c.instancev1
}

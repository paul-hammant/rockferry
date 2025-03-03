package tasks

import (
	"context"
	"fmt"
	"time"

	"github.com/eskpil/rockferry/pkg/mac"
	"github.com/eskpil/rockferry/pkg/rockferry"
	"github.com/eskpil/rockferry/pkg/rockferry/spec"
	"github.com/google/uuid"
)

type CreateVirtualMachineTask struct {
	Request *rockferry.MachineRequest
}

func (t *CreateVirtualMachineTask) createVmDisks(ctx context.Context, executor *Executor) ([]*spec.MachineSpecDisk, error) {
	disks := []*spec.MachineSpecDisk{}

	for _, disk := range t.Request.Spec.Disks {
		poolId := disk.Pool
		pools, err := executor.Rockferry.StoragePools().List(ctx, poolId, nil)
		if err != nil {
			return nil, err
		}

		pool := pools[0]

		d := new(spec.MachineSpecDisk)
		d.Key = disk.Key
		d.Volume = disk.Volume
		if pool.Spec.Type == "rbd" {
			d.Type = "network"
			d.Device = "disk"

			d.Network = new(spec.MachineSpecDiskNetwork)
			d.Network.Protocol = pool.Spec.Type
			d.Network.Hosts = pool.Spec.Source.Hosts
			d.Network.Auth = *pool.Spec.Source.Auth
		}

		if pool.Spec.Type == "dir" {
			d.Type = "file"
			d.Device = "disk"

			d.File = new(spec.MachineSpecDiskFile)
		}

		disks = append(disks, d)
	}

	// TODO: CDROM can be network disk as well
	cdrom := new(spec.MachineSpecDisk)

	cdrom.Key = t.Request.Spec.Cdrom.Key
	// This could probably be more clean
	cdrom.File = new(spec.MachineSpecDiskFile)
	cdrom.Device = "cdrom"
	cdrom.Type = "file"

	disks = append(disks, cdrom)

	return disks, nil
}

func (t *CreateVirtualMachineTask) createNetworkInterfaces(ctx context.Context, executor *Executor) ([]*spec.MachineSpecInterface, error) {
	interfaces := make([]*spec.MachineSpecInterface, 1)

	networks, err := executor.Rockferry.Networks().List(ctx, t.Request.Spec.Network, nil)
	if err != nil {
		return nil, err
	}

	network := networks[0]

	mac, err := mac.Generate()
	if err != nil {
		return nil, err
	}

	interfaces[0] = new(spec.MachineSpecInterface)
	interfaces[0].Mac = mac
	interfaces[0].Model = "virtio"

	interfaces[0].Network = new(string)
	*interfaces[0].Network = network.Spec.Name

	interfaces[0].Bridge = new(string)
	*interfaces[0].Bridge = network.Spec.Bridge.Name

	return interfaces, nil
}

func (t *CreateVirtualMachineTask) Execute(ctx context.Context, executor *Executor) error {
	// NOTE: Used to annotate storage volumes with the vm id. This is useful for deletion.
	vmId := uuid.NewString()

	fmt.Println("creating vm", t.Request.Spec.Name)

	disks, err := t.createVmDisks(ctx, executor)
	if err != nil {
		return err
	}

	interfaces, err := t.createNetworkInterfaces(ctx, executor)
	if err != nil {
		return err
	}

	machineSpec := new(spec.MachineSpec)

	machineSpec.Name = t.Request.Spec.Name
	machineSpec.Topology = t.Request.Spec.Topology
	machineSpec.Disks = disks
	machineSpec.Interfaces = interfaces

	res := new(rockferry.Machine)

	res.Annotations = map[string]string{}
	res.Annotations["machinerequest.id"] = t.Request.Id

	res.Id = vmId
	res.Kind = rockferry.ResourceKindMachine
	res.Owner = new(rockferry.OwnerRef)
	// TODO: Do not hardcode this
	res.Owner.Id = executor.NodeId
	res.Owner.Kind = rockferry.ResourceKindNode

	res.Status.State = spec.MachineStatusStateBooting

	if err := executor.Libvirt.CreateDomain(vmId, machineSpec); err != nil {
		return err
	}

	res.Spec = *machineSpec

	return executor.Rockferry.Machines().Create(ctx, res)
}

func (t *CreateVirtualMachineTask) Resource() *rockferry.Resource[any, any] {
	return t.Request.Generic()
}

type DeleteVmTask struct {
	Machine *rockferry.Machine
}

func (t *DeleteVmTask) Execute(ctx context.Context, e *Executor) error {
	if err := e.Libvirt.DestroyDomain(t.Machine.Id); err != nil {
		return err
	}

	// Cleanup, yay
	for _, disk := range t.Machine.Spec.Disks {
		if disk.Volume == "" {
			continue
		}

		if err := e.Rockferry.StorageVolumes().Delete(ctx, disk.Volume); err != nil {
			fmt.Println("failed to delete storage volume", err)
			continue
		}
	}

	return e.Rockferry.MachineRequests().Delete(ctx, t.Machine.Annotations["machinerequest.id"])
}

func (t *DeleteVmTask) Repeats() *time.Duration {
	return nil
}

type SyncMachineStatusesTask struct {
}

func (t *SyncMachineStatusesTask) Execute(ctx context.Context, e *Executor) error {
	fmt.Println("executing sync machine statuses task")
	iface := e.Rockferry.Machines()

	owner := new(rockferry.OwnerRef)
	owner.Id = e.NodeId
	owner.Kind = rockferry.ResourceKindNode
	machines, err := iface.List(ctx, "", owner)
	if err != nil {
		return err
	}

	for _, machine := range machines {
		// TODO: If a machine exists in rockferry but not libvirt we are out of sync.
		// 		 We need logic to sync machines as well.
		if !e.Libvirt.DomainExists(machine.Id) {
			continue
		}

		status, err := e.Libvirt.SyncDomainStatus(machine.Id)
		if err != nil {
			fmt.Println("failed to sync machine status", err)
			continue
		}

		copy := new(rockferry.Machine)
		*copy = *machine

		copy.Status = *status

		if err := iface.Patch(ctx, machine, copy); err != nil {
			fmt.Println("failed to patch machine", err)
			continue
		}
	}

	return nil
}

func (t *SyncMachineStatusesTask) Repeats() *time.Duration {
	timeout := time.Second * 2
	return &timeout
}

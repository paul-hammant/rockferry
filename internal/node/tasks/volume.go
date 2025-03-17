package tasks

import (
	"context"
	"fmt"
	"time"

	"github.com/eskpil/rockferry/pkg/rockferry"
	"github.com/mohae/deepcopy"
)

type SyncStorageVolumesTask struct {
}

func (t *SyncStorageVolumesTask) Execute(ctx context.Context, executor *Executor) error {
	volumes, err := executor.Libvirt.QueryStorageVolumes()
	if err != nil {
		return err
	}

	iface := executor.Rockferry.StorageVolumes()
	for _, local := range volumes {
		remote, err := iface.Get(ctx, local.Id, nil)
		if err != nil {
			if err == rockferry.ErrorNotFound {
				if err := iface.Create(ctx, local); err != nil {
					return err
				}

				continue
			}

			fmt.Println("failed to find already existing volume", err)
			continue
		}
		// NOTE: This will make sure we do not lose any annotations on the way.
		local.Merge(remote)

		if err := iface.Patch(ctx, remote, local); err != nil {
			panic(err)
		}

	}

	return nil
}

func (t *SyncStorageVolumesTask) Repeats() *time.Duration {
	timeout := time.Minute * 2
	return &timeout
}

type DeleteVolumeTask struct {
	Volume *rockferry.StorageVolume
}

func (t *DeleteVolumeTask) Execute(ctx context.Context, executor *Executor) error {
	return executor.Libvirt.DeleteStorageVolume(t.Volume.Spec.Key)
}

func (t *DeleteVolumeTask) Repeats() *time.Duration {
	return nil
}

type CreateVolumeTask struct {
	Volume *rockferry.StorageVolume
}

func (t *CreateVolumeTask) Execute(ctx context.Context, executor *Executor) error {
	pools, err := executor.Rockferry.StoragePools().List(ctx, t.Volume.Owner.Id, nil)
	if err != nil {
		return err
	}
	pool := pools[0]

	fmt.Println("creating storage volume for: ", t.Volume.Annotations["machinereq.name"])

	name := t.Volume.Spec.Name
	format := "raw"
	capacity := t.Volume.Spec.Capacity
	allocation := t.Volume.Spec.Allocation

	if err := executor.Libvirt.CreateVolume(pool.Spec.Name, name, format, capacity, allocation); err != nil {
		return err
	}

	updatedSpec, err := executor.Libvirt.QueryVolumeSpec(pool.Spec.Name, t.Volume.Spec.Name)
	if err != nil {
		return err
	}

	modified := deepcopy.Copy(t.Volume).(*rockferry.StorageVolume)
	modified.Spec = *updatedSpec

	return executor.Rockferry.StorageVolumes().Patch(ctx, t.Volume, modified)
}

func (t *CreateVolumeTask) Resource() *rockferry.Resource[any, any] {
	return t.Volume.Generic()
}

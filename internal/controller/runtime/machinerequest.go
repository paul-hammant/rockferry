package runtime

import (
	"context"
	"fmt"

	"github.com/eskpil/rockferry/pkg/rockferry"
	"github.com/eskpil/rockferry/pkg/rockferry/spec"
	"github.com/google/uuid"
)

func (r *Runtime) allocateMachineVolumes(ctx context.Context, req *rockferry.MachineRequest) error {
	if len(req.Spec.Disks) == 0 {
		return nil
	}

	volumes := []*rockferry.StorageVolume{}

	for i, d := range req.Spec.Disks {
		volume := new(rockferry.StorageVolume)

		name := uuid.NewString()

		id := fmt.Sprintf("%s/%s", d.Pool, name)

		volume.Owner = new(rockferry.OwnerRef)
		volume.Owner.Id = d.Pool
		volume.Owner.Kind = rockferry.ResourceKindStoragePool

		volume.Annotations = map[string]string{}
		volume.Annotations["machinereq.id"] = req.Id
		volume.Annotations["machinereq.name"] = req.Spec.Name

		volume.Kind = rockferry.ResourceKindStorageVolume
		volume.Id = id
		volume.Spec.Name = name
		volume.Spec.Allocation = d.Allocation
		volume.Spec.Capacity = d.Capacity

		req.Spec.Disks[i].Volume = id

		if err := r.CreateResource(ctx, volume.Generic()); err != nil {
			return err
		}

		volumes = append(volumes, volume)
	}

	stream, cancel, err := r.Watch(context.Background(), rockferry.WatchActionUpdate, rockferry.ResourceKindStorageVolume, "", nil)
	if err != nil {
		return err
	}

	for {
		select {
		case <-cancel:
			{
				return rockferry.ErrorStreamClosed
			}
		case resource := <-stream:
			{
				volume := rockferry.CastFromMap[spec.StorageVolumeSpec, rockferry.DefaultStatus](resource)

				for _, o := range volumes {
					if volume.Id == o.Id && volume.Phase == rockferry.PhaseRequested {
						for i, d := range req.Spec.Disks {
							if d.Volume == volume.Id {
								req.Spec.Disks[i].Key = volume.Spec.Key
							}
						}
					}
				}

				filled := true // Assume all disks have a key initially
				for _, d := range req.Spec.Disks {
					if d.Key == "" {
						filled = false // Found a disk without a key
						break          // Exit loop early
					}
				}

				if filled {
					fmt.Println("all disks have a volume")
					return nil
				}
			}
		}
	}
}

func (r *Runtime) AllocateMachineResources(ctx context.Context, req *rockferry.MachineRequest) error {
	req.Phase = rockferry.PhaseRequested

	if err := r.allocateMachineVolumes(ctx, req); err != nil {
		return err
	}

	return r.Update(ctx, req.Generic())
}

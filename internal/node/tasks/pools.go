package tasks

import (
	"context"
	"fmt"
	"time"

	"github.com/eskpil/rockferry/pkg/rockferry"
)

type SyncStoragePoolsTask struct{}

func (t *SyncStoragePoolsTask) Execute(ctx context.Context, executor *Executor) error {
	pools, err := executor.Libvirt.QueryStoragePools()
	if err != nil {
		return err
	}

	iface := executor.Rockferry.StoragePools()
	for _, local := range pools {
		local.Owner.Id = executor.NodeId

		remote, err := iface.Get(ctx, local.Id, nil)
		if err != nil {
			if err == rockferry.ErrorNotFound {
				if err := iface.Create(ctx, local); err != nil {
					return err
				}

				continue
			}

			fmt.Println("failed to find already existing pool", err)
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

func (t *SyncStoragePoolsTask) Repeats() *time.Duration {
	timeout := time.Minute * 2
	return &timeout
}

package tasks

import (
	"context"
	"fmt"
	"time"

	"github.com/eskpil/rockferry/pkg/rockferry/status"
)

type SyncStoragePoolsTask struct{}

func (t *SyncStoragePoolsTask) Execute(ctx context.Context, executor *Executor) error {
	fmt.Println("executing sync storage pools task")

	pools, err := executor.Libvirt.QueryStoragePools()
	if err != nil {
		return err
	}

	iface := executor.Rockferry.StoragePools()
	for _, local := range pools {
		local.Owner.Id = executor.NodeId

		remotes, err := iface.List(ctx, local.Id, nil)
		if err != nil {
			if status.Is(err, status.ErrNoResults) {
				if err := iface.Create(ctx, local); err != nil {
					return err
				}

				continue
			}

			fmt.Println("failed to find already existing pool", err)

			continue
		}

		if len(remotes) == 0 {
			panic("remotes is zero")
		}

		// NOTE: This will make sure we do not lose any annotations on the way.
		local.Merge(remotes[0])

		if err := iface.Patch(ctx, remotes[0], local); err != nil {
			panic(err)
		}

	}

	return nil
}

func (t *SyncStoragePoolsTask) Repeats() *time.Duration {
	timeout := time.Minute * 2
	return &timeout
}

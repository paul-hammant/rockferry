package tasks

import (
	"context"
	"fmt"
	"time"
)

type SyncStoragePoolsTask struct{}

func (t *SyncStoragePoolsTask) Execute(ctx context.Context, executor *Executor) error {
	fmt.Println("executing sync storage pools task")

	pools, err := executor.Libvirt.QueryStoragePools()
	if err != nil {
		return err
	}

	client := executor.Rockferry.StoragePools()
	for _, pool := range pools {
		pool.Owner.Id = executor.NodeId
		if err := client.Create(ctx, pool); err != nil {
			return err
		}
	}

	return nil
}

func (t *SyncStoragePoolsTask) Repeats() *time.Duration {
	timeout := time.Minute * 2
	return &timeout
}

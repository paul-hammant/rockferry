package tasks

import (
	"context"
	"fmt"
	"time"

	"github.com/eskpil/rockferry/pkg/rockferry"
)

type SyncNetworksTask struct {
}

func (t *SyncNetworksTask) Execute(ctx context.Context, e *Executor) error {
	volumes, err := e.Libvirt.ListAllNetworks()
	if err != nil {
		return err
	}

	iface := e.Rockferry.Networks()
	for _, local := range volumes {
		remote, err := iface.Get(ctx, local.Id, nil)
		if err != nil {
			if err == rockferry.ErrorNotFound {
				if err := iface.Create(ctx, local); err != nil {
					return err
				}

				continue
			}

			fmt.Println("failed to find already existing network", err)
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

func (t *SyncNetworksTask) Repeats() *time.Duration {
	timeout := time.Minute * 5
	return &timeout
}

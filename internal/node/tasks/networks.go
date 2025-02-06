package tasks

import (
	"context"
	"fmt"

	"github.com/eskpil/rockferry/pkg/rockferry/status"
)

type SyncNetworksTask struct {
}

func (t *SyncNetworksTask) Execute(ctx context.Context, e *Executor) error {
	fmt.Println("executing sync networks task")

	volumes, err := e.Libvirt.ListAllNetworks()
	if err != nil {
		return err
	}

	iface := e.Rockferry.Networks()
	for _, local := range volumes {
		remotes, err := iface.List(ctx, local.Id, nil)
		if err != nil {
			if status.Is(err, status.ErrNoResults) {
				if err := iface.Create(ctx, local); err != nil {
					return err
				}

				continue
			}

			fmt.Println("failed to find already existing network", err)

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

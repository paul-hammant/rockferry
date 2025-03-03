package controller

import (
	"context"
	"fmt"
	"time"

	"github.com/eskpil/rockferry/internal/controller/models"
	"github.com/eskpil/rockferry/pkg/rockferry"
	clientv3 "go.etcd.io/etcd/client/v3"
)

func ensureInstance(ctx context.Context, db *clientv3.Client) error {
	path := fmt.Sprintf("%s/%s/%s", models.RootKey, rockferry.ResourceKindInstance, "self")

	results, err := db.Get(ctx, path, clientv3.WithLimit(1))
	if err != nil {
		return err
	}

	if results.Count == 0 {
		// NOTE: This is only expected to happen the first time the rockferry instance
		// 		 is spun up.

		instance := new(rockferry.Instance)

		instance.Id = "self"
		instance.Kind = rockferry.ResourceKindInstance

		// NOTE: This is only a placeholder, can be changed. Possibly in a setup wizard?
		// 		 the wizard can detect that the status phase is requested and will fil out
		// 		 all neccesary props.
		instance.Spec.Name = "rockferry"
		instance.Phase = rockferry.PhaseCreated

		bytes, err := instance.Marshal()
		if err != nil {
			return err
		}

		_, err = db.Put(ctx, path, string(bytes))
		return err
	}

	return nil
}

func Initialize() error {
	ctx := context.Background()

	// TODO: Enable some kind of config
	// TODO: Avoid multiple db connections
	cli, err := clientv3.New(clientv3.Config{
		Endpoints:   []string{"localhost:2379"},
		DialTimeout: 5 * time.Second,
	})

	if err != nil {
		return err
	}

	return ensureInstance(ctx, cli)
}

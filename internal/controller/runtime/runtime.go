package runtime

import (
	"context"
	"encoding/json"
	"fmt"

	"github.com/eskpil/rockferry/internal/controller/models"
	"github.com/eskpil/rockferry/pkg/rockferry"
	"github.com/eskpil/rockferry/pkg/rockferry/spec"
	"github.com/google/uuid"
	clientv3 "go.etcd.io/etcd/client/v3"
)

type Runtime struct {
	Db *clientv3.Client
}

func New(db *clientv3.Client) *Runtime {
	r := new(Runtime)
	r.Db = db
	return r
}

func (r *Runtime) resourcePreCreate(ctx context.Context, resource *rockferry.Generic) error {
	switch resource.Kind {
	case rockferry.ResourceKindMachineRequest:
		resource.Phase = rockferry.PhasePreProcessing
		break
	case rockferry.ResourceKindCluster:
		resource.Phase = rockferry.PhaseCreated
		break
	case rockferry.ResourceKindMachine:
		resource.Phase = rockferry.PhaseCreated
		break
	case rockferry.ResourceKindStorageVolume:
		volume := rockferry.CastFromMap[spec.StorageVolumeSpec, rockferry.DefaultStatus](resource)
		resource.Id = fmt.Sprintf("%s/%s", volume.Owner.Id, volume.Spec.Name)
		resource.Phase = rockferry.PhaseRequested
	default:
		resource.Phase = rockferry.PhaseRequested
	}

	return nil
}

func (r *Runtime) resourcePostCreate(ctx context.Context, resource *rockferry.Generic) {
	var err error

	switch resource.Kind {
	case rockferry.ResourceKindClusterRequest:
		err = r.AllocateKubernetesCluster(context.WithoutCancel(ctx), rockferry.CastFromMap[spec.ClusterRequestSpec, rockferry.DefaultStatus](resource))
		break
	case rockferry.ResourceKindMachineRequest:
		req := rockferry.CastFromMap[spec.MachineRequestSpec, rockferry.DefaultStatus](resource)
		err = r.AllocateMachineResources(context.WithoutCancel(ctx), req)
		break
	default:
		break
	}

	if err != nil {
		fmt.Println("failed to process resource", err)
		panic(err)
	}
}

func (r *Runtime) Update(ctx context.Context, resource *rockferry.Generic) error {
	if resource == nil {
		return rockferry.ErrorBadArguments
	}

	if resource.Id == "" {
		return rockferry.ErrorBadArguments
	}

	path := fmt.Sprintf("%s/%s/%s", models.RootKey, resource.Kind, resource.Id)
	bytes, err := resource.Marshal()
	if err != nil {
		return err
	}

	_, err = r.Db.Put(ctx, path, string(bytes))
	return err
}

func (r *Runtime) CreateResource(ctx context.Context, resource *rockferry.Generic) error {
	if resource.Id == "" {
		resource.Id = uuid.NewString()
	}

	// Code run before the resource is created. This can be used for validating
	// the request. Creating some required sources.
	if err := r.resourcePreCreate(context.Background(), resource); err != nil {
		return err
	}

	path := fmt.Sprintf("%s/%s/%s", models.RootKey, resource.Kind, resource.Id)
	bytes, err := resource.Marshal()
	if err != nil {
		return err
	}

	_, err = r.Db.Put(ctx, path, string(bytes))
	if err != nil {
		return err
	}

	// Code ran after the resource has been created,
	// suitable for tasks which needs to be run in a
	// asyncrnous fashion.
	go r.resourcePostCreate(context.Background(), resource)

	return nil
}

func (r *Runtime) Watch(ctx context.Context, action rockferry.WatchAction, kind rockferry.ResourceKind, id string, owner *rockferry.OwnerRef) (chan *rockferry.WatchEvent[any, any], chan interface{}, error) {
	out := make(chan *rockferry.WatchEvent[any, any])
	cancel := make(chan interface{})
	var opts []clientv3.OpOption

	// Build watch path
	path := fmt.Sprintf("%s/%s/%s", models.RootKey, kind, id)
	if id == "" {
		opts = append(opts, clientv3.WithPrefix())
		path = fmt.Sprintf("%s/%s", models.RootKey, kind)
	} else if kind == rockferry.ResourceKindStorageVolume && owner != nil {
		// Use owner ID instead of resource ID for StorageVolume (refactor to avoid special case if possible)
		path = fmt.Sprintf("%s/%s/%s", models.RootKey, kind, owner.Id)
	}

	if action == rockferry.WatchActionDelete || action == rockferry.WatchActionUpdate {
		opts = append(opts, clientv3.WithPrevKV())
	}

	watchChannel := r.Db.Watch(ctx, path, opts...)

	go func() {
		defer close(out)
		defer close(cancel)

		for w := range watchChannel {
			if w.Canceled {
				cancel <- new(interface{})
				return
			}

			if err := w.Err(); err != nil {
				fmt.Println("Watch error:", err)
				cancel <- new(interface{})
				return
			}

			for _, event := range w.Events {
				var usedAction rockferry.WatchAction
				switch {
				case event.IsCreate():
					usedAction = rockferry.WatchActionCreate
				case event.IsModify():
					usedAction = rockferry.WatchActionUpdate
				default:
					usedAction = rockferry.WatchActionDelete
				}

				// Allow fallback on WatchActionAll
				if action != rockferry.WatchActionAll {
					if (usedAction == rockferry.WatchActionCreate && action != rockferry.WatchActionCreate) ||
						(usedAction == rockferry.WatchActionUpdate && action != rockferry.WatchActionUpdate) ||
						(usedAction == rockferry.WatchActionDelete && action != rockferry.WatchActionDelete) {
						continue
					}
				}

				if event.PrevKv != nil && action == rockferry.WatchActionDelete {
					event.Kv = event.PrevKv
				}

				if event.PrevKv != nil && action == rockferry.WatchActionDelete {
					event.Kv = event.PrevKv
				}

				if event.Kv == nil {
					continue
				}

				resource := new(rockferry.Generic)
				if err := json.Unmarshal(event.Kv.Value, resource); err != nil {
					fmt.Println("JSON unmarshal error:", err)
					continue
				}

				if owner != nil && owner.Id != "" && owner.Kind != "" && resource.Owner != nil {
					if owner.Id != resource.Owner.Id && owner.Kind != resource.Owner.Kind {
						continue
					}
				}

				ret := new(rockferry.WatchEvent[any, any])

				ret.Action = usedAction
				ret.Resource = resource

				if event.PrevKv != nil && action != rockferry.WatchActionDelete {
					prev := new(rockferry.Generic)
					if err := json.Unmarshal(event.PrevKv.Value, prev); err != nil {
						fmt.Println("JSON unmarshal error:", err)
						continue
					}

					ret.Prev = prev
				}

				out <- ret
			}
		}
	}()

	return out, cancel, nil
}

// Caller can provide a set of annotations which much match.
func (r *Runtime) Get(ctx context.Context, kind rockferry.ResourceKind, id string, owner *rockferry.OwnerRef, annotations map[string]string) (*rockferry.Generic, error) {
	resources, err := r.List(ctx, kind, id, owner, annotations)
	if err != nil {
		return nil, err
	}

	if len(resources) > 1 {
		return nil, rockferry.ErrorUnexpectedResults
	}

	return resources[0], nil
}

func (r *Runtime) List(ctx context.Context, kind rockferry.ResourceKind, id string, owner *rockferry.OwnerRef, annotations map[string]string) ([]*rockferry.Generic, error) {
	opts := []clientv3.OpOption{}
	if id == "" {
		opts = append(opts, clientv3.WithPrefix())
	}

	path := fmt.Sprintf("%s/%s/%s", models.RootKey, kind, id)

	results, err := r.Db.Get(ctx, path, opts...)
	if err != nil {
		return nil, err
	}

	if 0 >= len(results.Kvs) {
		return nil, rockferry.ErrorNotFound
	}

	var output []*rockferry.Generic

	for _, kv := range results.Kvs {
		resource := new(rockferry.Generic)
		if err := json.Unmarshal(kv.Value, resource); err != nil {
			panic(err)
		}

		if owner != nil && resource.Owner != nil && *owner != *resource.Owner {
			continue
		}

		if len(annotations) > 0 {
			match := false
			for k, o := range annotations {
				v, ok := resource.Annotations[k]
				if ok && v == o {
					match = true
				}
			}

			if !match {
				continue
			}
		}

		output = append(output, resource)

	}

	return output, nil
}

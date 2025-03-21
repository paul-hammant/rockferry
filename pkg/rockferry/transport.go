package rockferry

import (
	"context"
	"fmt"
	"time"

	"github.com/eskpil/rockferry/controllerapi"
	"github.com/eskpil/rockferry/pkg/convert"
	"github.com/snorwin/jsonpatch"
	"google.golang.org/grpc"
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/credentials/insecure"
	"google.golang.org/grpc/status"
)

type WatchEvent[T any, S any] struct {
	Action   WatchAction     `json:"action"`
	Resource *Resource[T, S] `json:"resource"`
	Prev     *Resource[T, S] `json:"prev"`
}

type Transport struct {
	client controllerapi.ControllerApiClient
}

func NewTransport(url string) (*Transport, error) {
	t := new(Transport)

	cc, err := grpc.NewClient(url, grpc.WithTransportCredentials(insecure.NewCredentials()))
	if err != nil {
		return nil, err
	}
	t.client = controllerapi.NewControllerApiClient(cc)

	return t, nil
}

func MapResource(unmapped *controllerapi.Resource) *Generic {
	mapped := new(Generic)

	// Map the resource
	mapped.Id = unmapped.Id
	mapped.Kind = ResourceKind(unmapped.Kind)

	if unmapped.Owner != nil {
		mapped.Owner = new(OwnerRef)
		mapped.Owner.Id = unmapped.Owner.Id
		mapped.Owner.Kind = unmapped.Owner.Kind
	}
	mapped.Phase = Phase(unmapped.Phase)

	mapped.Annotations = unmapped.Annotations

	mapped.RawStatus = unmapped.Status
	mapped.RawSpec = unmapped.Spec

	mapped.Spec, _ = convert.Convert[any](mapped.RawSpec)
	mapped.Status, _ = convert.Convert[any](mapped.RawStatus)

	return mapped
}

func (t *Transport) C() controllerapi.ControllerApiClient {
	return t.client
}

func (t *Transport) Watch(ctx context.Context, action WatchAction, kind ResourceKind, id string, owner *OwnerRef) (chan *WatchEvent[any, any], error) {
	api := t.C()

	// Create the initial watch request
	req := new(controllerapi.WatchRequest)
	req.Kind = kind
	if owner != nil {
		req.Owner.Id = owner.Id
		req.Owner.Kind = owner.Kind
	}

	req.Action = controllerapi.WatchAction(action)
	req.Action = action

	// Create the channel to send updates
	out := make(chan *WatchEvent[any, any])

	// Function to start watching and handle reconnection
	var watch func() error
	watch = func() error {
		// Call the API to start watching
		response, err := api.Watch(ctx, req)
		if err != nil {
			return err
		}

		// Process incoming resources and handle reconnection
		go func() {
			for {
				select {
				default:
					res, err := response.Recv()
					if err != nil {
						// Log the error (can be enhanced with more detailed logging)
						fmt.Printf("Watch receive error: %v. Reconnecting...\n", err)

						// Retry after a delay (backoff logic can be implemented here)
						// You may add exponential backoff, but here we'll retry immediately for simplicity
						retryDelay := 2 * time.Second // You can increase this over multiple retries
						select {
						case <-time.After(retryDelay): // Retry after waiting for the delay
							// Attempt to restart the watch connection
							if err := watch(); err != nil {
								fmt.Printf("Failed to reconnect watch: %v\n", err)
								return
							}
						case <-ctx.Done():
							close(out)
							return
						}
						return
					}

					event := new(WatchEvent[any, any])
					event.Resource = MapResource(res.Resource)

					if res.PrevResource != nil {
						event.Prev = MapResource(res.PrevResource)
					}

					// Send the mapped resource to the channel
					select {
					case out <- event:
					case <-ctx.Done():
						close(out)
						return
					}
				}
			}
		}()
		return nil
	}

	// Start the watch and handle the error if it fails
	if err := watch(); err != nil {
		return nil, err
	}

	return out, nil
}

func (t *Transport) Patch(ctx context.Context, original *Resource[any, any], modified *Resource[any, any]) error {
	api := t.C()

	patch, err := jsonpatch.CreateJSONPatch(modified, original)
	if err != nil {
		return err
	}

	// NOTE: If the resource is not update it, why bother the controller
	if 0 >= len(patch.Raw()) {
		return nil
	}

	req := new(controllerapi.PatchRequest)

	req.Id = new(string)
	*req.Id = original.Id
	req.Kind = string(original.Kind)
	if original.Owner != nil {
		req.Owner = new(controllerapi.Owner)
		req.Owner.Kind = original.Owner.Kind
		req.Owner.Id = original.Owner.Id
	}

	req.Patches = patch.Raw()

	_, err = api.Patch(ctx, req)
	if err != nil {
		return err
	}

	return nil
}

func (t *Transport) List(ctx context.Context, kind ResourceKind, id string, owner *OwnerRef) ([]*Resource[any, any], error) {
	api := t.C()

	req := new(controllerapi.ListRequest)
	if id != "" {
		req.Id = new(string)
		*req.Id = id
	}
	req.Kind = string(kind)
	if owner != nil {
		req.Owner = new(controllerapi.Owner)
		req.Owner.Id = owner.Id
		req.Owner.Kind = owner.Kind
	}

	response, err := api.List(ctx, req)
	if err != nil {
		if s, ok := status.FromError(err); ok && s != nil {
			if s.Code() == codes.NotFound {
				return nil, ErrorNotFound
			}
		}

		return nil, err
	}

	list := make([]*Resource[any, any], len(response.Resources))

	for i, unmapped := range response.Resources {
		list[i] = MapResource(unmapped)
	}

	return list, nil
}

func (t *Transport) Create(ctx context.Context, in *Resource[any, any]) error {
	api := t.C()

	req := new(controllerapi.CreateRequest)

	var err error
	req.Resource, err = in.Transport()
	if err != nil {
		return err
	}

	_, err = api.Create(ctx, req)
	return err
}

func (t *Transport) Delete(ctx context.Context, kind ResourceKind, id string) error {
	api := t.C()

	req := new(controllerapi.DeleteRequest)
	req.Kind = kind
	req.Id = id

	_, err := api.Delete(ctx, req)
	return err
}

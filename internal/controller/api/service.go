package api

import (
	"context"
	"encoding/json"
	"fmt"
	"time"

	"github.com/eskpil/rockferry/controllerapi"
	"github.com/eskpil/rockferry/internal/controller/models"
	"github.com/eskpil/rockferry/pkg/rockferry"
	jsonpatch "github.com/evanphx/json-patch/v5"
	"github.com/google/uuid"
	clientv3 "go.etcd.io/etcd/client/v3"
	"google.golang.org/grpc"
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/status"
)

func (c Controller) Watch(req *controllerapi.WatchRequest, res grpc.ServerStreamingServer[controllerapi.WatchResponse]) error {
	ctx := res.Context()

	id := ""
	if req.Id != nil {
		id = *req.Id
	}

	owner := new(rockferry.OwnerRef)
	if req.Owner != nil {
		owner.Id = req.Owner.Id
		owner.Kind = req.Owner.Kind
	}

	stream, canceled, err := c.R.Watch(ctx, req.Action, req.Kind, id, owner)
	if err != nil {
		return err
	}

	for {
		select {
		case <-canceled:
			return status.Error(codes.Aborted, "stream closed")
		case e := <-stream:
			response := new(controllerapi.WatchResponse)
			response.Resource, err = e.Resource.Transport()
			if err != nil {
				panic(err)
			}

			if e.Prev != nil {
				response.PrevResource, err = e.Prev.Transport()
				if err != nil {
					panic(err)
				}
			}

			if err := res.Send(response); err != nil {
				panic(err)
			}
		}
	}
}

func (c Controller) List(ctx context.Context, req *controllerapi.ListRequest) (*controllerapi.ListResponse, error) {
	var opts []clientv3.OpOption

	path := ""
	if req.Id == nil {
		opts = append(opts, clientv3.WithPrefix())
		path = fmt.Sprintf("%s/%s/", models.RootKey, req.Kind)
	} else {
		path = fmt.Sprintf("%s/%s/%s", models.RootKey, req.Kind, *req.Id)
	}

	// TODO: Avoid this hack
	if req.Kind == rockferry.ResourceKindStorageVolume && req.Owner != nil && req.Id == nil {
		path = fmt.Sprintf("%s/%s/%s", models.RootKey, req.Kind, req.Owner.Id)
	}

	res, err := c.Db.Get(ctx, path, opts...)
	if err != nil {
		fmt.Println("failed to fetch resources", err)
		return nil, status.Errorf(codes.Internal, "something wrong happend")
	}

	if 0 >= len(res.Kvs) {
		return nil, status.Errorf(codes.NotFound, "resource not found")
	}

	response := new(controllerapi.ListResponse)

	for _, kv := range res.Kvs {
		resource := new(controllerapi.Resource)
		if err := json.Unmarshal(kv.Value, resource); err != nil {
			fmt.Println("unable to unmarshal resource", err)
			return nil, status.Errorf(codes.Internal, "something wrong happend")
		}

		if req.Owner != nil && req.Owner.Id != "" && req.Owner.Kind != "" && resource.Owner != nil {
			if req.Owner.Id != resource.Owner.Id && req.Owner.Kind != resource.Owner.Kind {
				continue
			}
		}

		if resource.Kind == rockferry.ResourceKindMachineRequest {
			fmt.Println(resource.Phase)
		}

		response.Resources = append(response.Resources, resource)
	}

	return response, nil
}

func (c Controller) Patch(ctx context.Context, req *controllerapi.PatchRequest) (*controllerapi.PatchResponse, error) {
	ctx, cancel := context.WithTimeout(ctx, 10*time.Second)
	defer cancel()

	if req.Id == nil {
		return nil, status.Errorf(codes.InvalidArgument, "resource id must be specified")
	}

	path := fmt.Sprintf("%s/%s/%s", models.RootKey, req.Kind, *req.Id)

	res, err := c.Db.Get(ctx, path)
	if err != nil {
		fmt.Println("failed to fetch resource", err)
		return nil, status.Errorf(codes.Internal, "something wrong happend")
	}

	if 0 >= len(res.Kvs) {
		return nil, status.Errorf(codes.NotFound, "resource not found")
	}

	if 2 <= len(res.Kvs) {
		panic("more than 1 response")
	}

	original := res.Kvs[0].Value

	patch, err := jsonpatch.DecodePatch(req.Patches)
	if err != nil {
		panic(err)
	}

	modified, err := patch.Apply(original)
	if err != nil {
		panic(err)
	}

	fmt.Println("patching: ", path)

	_, err = c.Db.Put(ctx, path, string(modified))
	if err != nil {
		panic(err)
	}

	return new(controllerapi.PatchResponse), nil
}

func (c Controller) Create(ctx context.Context, input *controllerapi.CreateRequest) (*controllerapi.CreateResponse, error) {
	if input.Resource.Id == "" {
		input.Resource.Id = uuid.NewString()
	}

	mapped := rockferry.MapResource(input.GetResource())

	if err := c.R.CreateResource(ctx, mapped); err != nil {
		fmt.Println("failed to insert resource", err)
		return nil, status.Errorf(codes.Internal, "something wrong happend")
	}

	return new(controllerapi.CreateResponse), nil
}

func (c Controller) Delete(ctx context.Context, req *controllerapi.DeleteRequest) (*controllerapi.DeleteResponse, error) {
	ctx, cancel := context.WithTimeout(ctx, 10*time.Second)
	defer cancel()

	path := fmt.Sprintf("%s/%s/%s", models.RootKey, req.Kind, req.Id)

	_, err := c.Db.Delete(ctx, path)
	if err != nil {
		fmt.Println("failed to delete resource")
		return nil, status.Errorf(codes.Internal, "something wrong happend")
	}

	return new(controllerapi.DeleteResponse), nil
}

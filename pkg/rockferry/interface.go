package rockferry

import (
	"context"

	"github.com/eskpil/rockferry/pkg/convert"
)

type Interface[S any] struct {
	t    *Transport
	kind ResourceKind
}

func NewInterface[S any](kind ResourceKind, t *Transport) *Interface[S] {
	i := new(Interface[S])
	i.t = t
	i.kind = kind
	return i
}

func (i *Interface[S]) fix(unmapped *Resource[any]) *Resource[S] {
	mapped := new(Resource[S])
	mapped.Id = unmapped.Id
	mapped.Owner = unmapped.Owner
	mapped.Kind = unmapped.Kind
	mapped.Annotations = unmapped.Annotations
	mapped.Status = unmapped.Status

	spec, _ := convert.Convert[S](unmapped.RawSpec)
	mapped.Spec = *spec

	return mapped
}

func (i *Interface[S]) List(ctx context.Context, id string, owner *OwnerRef) ([]*Resource[S], error) {
	in, err := i.t.List(ctx, i.kind, id, owner)
	if err != nil {
		return nil, err
	}

	out := make([]*Resource[S], len(in))

	for idx, unmapped := range in {
		out[idx] = i.fix(unmapped)
	}

	return out, nil
}

func (i *Interface[S]) Watch(ctx context.Context, action WatchAction, id string, owner *OwnerRef) (chan *Resource[S], error) {
	in, err := i.t.Watch(ctx, action, i.kind, id, owner)
	if err != nil {
		return nil, err
	}

	out := make(chan *Resource[S])

	go func() {
		for {
			out <- i.fix(<-in)
		}
	}()

	return out, nil
}

func (i *Interface[S]) Patch(ctx context.Context, original *Resource[S], modified *Resource[S]) error {
	return i.t.Patch(ctx, original.Generic(), modified.Generic())
}

func (i *Interface[S]) Create(ctx context.Context, res *Resource[S]) error {
	return i.t.Create(ctx, res.Generic())
}

func (i *Interface[S]) Delete(ctx context.Context, id string) error {
	return i.t.Delete(ctx, i.kind, id)
}

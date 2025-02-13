package rockferry

import (
	"context"

	"github.com/eskpil/rockferry/pkg/convert"
)

type Interface[S any, T any] struct {
	t    *Transport
	kind ResourceKind
}

func NewInterface[S any, T any](kind ResourceKind, t *Transport) *Interface[S, T] {
	i := new(Interface[S, T])
	i.t = t
	i.kind = kind
	return i
}

func (i *Interface[S, T]) fix(unmapped *Resource[any, any]) *Resource[S, T] {
	mapped := new(Resource[S, T])
	mapped.Id = unmapped.Id
	mapped.Owner = unmapped.Owner
	mapped.Kind = unmapped.Kind
	mapped.Annotations = unmapped.Annotations

	status, err := convert.Convert[T](unmapped.RawStatus)
	if err != nil {
		panic(err)
	}
	mapped.Status = *status

	spec, _ := convert.Convert[S](unmapped.RawSpec)
	mapped.Spec = *spec

	return mapped
}

func (i *Interface[S, T]) List(ctx context.Context, id string, owner *OwnerRef) ([]*Resource[S, T], error) {
	in, err := i.t.List(ctx, i.kind, id, owner)
	if err != nil {
		return nil, err
	}

	out := make([]*Resource[S, T], len(in))

	for idx, unmapped := range in {
		out[idx] = i.fix(unmapped)
	}

	return out, nil
}

func (i *Interface[S, T]) Watch(ctx context.Context, action WatchAction, id string, owner *OwnerRef) (chan *Resource[S, T], error) {
	in, err := i.t.Watch(ctx, action, i.kind, id, owner)
	if err != nil {
		return nil, err
	}

	out := make(chan *Resource[S, T])

	go func() {
		for {
			out <- i.fix(<-in)
		}
	}()

	return out, nil
}

func (i *Interface[S, T]) Patch(ctx context.Context, original *Resource[S, T], modified *Resource[S, T]) error {
	return i.t.Patch(ctx, original.Generic(), modified.Generic())
}

func (i *Interface[S, T]) Create(ctx context.Context, res *Resource[S, T]) error {
	return i.t.Create(ctx, res.Generic())
}

func (i *Interface[S, T]) Delete(ctx context.Context, id string) error {
	return i.t.Delete(ctx, i.kind, id)
}

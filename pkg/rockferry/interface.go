package rockferry

import (
	"context"
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

func (i *Interface[S, T]) List(ctx context.Context, id string, owner *OwnerRef) ([]*Resource[S, T], error) {
	in, err := i.t.List(ctx, i.kind, id, owner)
	if err != nil {
		return nil, err
	}

	out := make([]*Resource[S, T], len(in))

	for idx, unmapped := range in {
		out[idx] = Cast[S, T](unmapped)
	}

	return out, nil
}

func (i *Interface[S, T]) Get(ctx context.Context, id string, owner *OwnerRef) (*Resource[S, T], error) {
	list, err := i.List(ctx, id, owner)
	if err != nil {
		return nil, err
	}

	if len(list) > 1 {
		return nil, ErrorUnexpectedResults
	}

	return list[0], nil
}

func (i *Interface[S, T]) Watch(ctx context.Context, action WatchAction, id string, owner *OwnerRef) (chan *WatchEvent[S, T], error) {
	in, err := i.t.Watch(ctx, action, i.kind, id, owner)
	if err != nil {
		return nil, err
	}

	out := make(chan *WatchEvent[S, T])

	go func() {
		for {
			unmapped := <-in

			mapped := new(WatchEvent[S, T])
			mapped.Resource = Cast[S, T](unmapped.Resource)
			if unmapped.Prev != nil {
				mapped.Prev = Cast[S, T](unmapped.Prev)
			}

			out <- mapped
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

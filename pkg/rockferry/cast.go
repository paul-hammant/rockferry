package rockferry

import (
	"encoding/json"

	"github.com/eskpil/rockferry/pkg/convert"
)

func Cast[Spec any, Status any](r *Generic) *Resource[Spec, Status] {
	mapped := new(Resource[Spec, Status])
	mapped.Id = r.Id
	mapped.Owner = r.Owner
	mapped.Kind = r.Kind
	mapped.Annotations = r.Annotations
	mapped.Phase = r.Phase

	status, err := convert.Convert[Status](r.RawStatus)
	if err != nil {
		panic(err)
	}
	mapped.Status = *status

	spec, err := convert.Convert[Spec](r.RawSpec)
	if err != nil {
		panic(err)
	}
	mapped.Spec = *spec

	return mapped
}

func CastFromMap[Spec any, Status any](r *Generic) *Resource[Spec, Status] {
	mapped := new(Resource[Spec, Status])
	mapped.Id = r.Id
	mapped.Owner = r.Owner
	mapped.Kind = r.Kind
	mapped.Annotations = r.Annotations
	mapped.Phase = r.Phase

	statusBytes, err := json.Marshal(r.Status)
	if err != nil {
		panic(err)
	}

	if err := json.Unmarshal(statusBytes, &mapped.Status); err != nil {
		panic(err)
	}

	specBytes, err := json.Marshal(r.Spec)
	if err != nil {
		panic(err)
	}

	if err := json.Unmarshal(specBytes, &mapped.Spec); err != nil {
		panic(err)
	}

	return mapped
}

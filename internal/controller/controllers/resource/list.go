package resource

import (
	"context"
	"net/http"
	"time"

	"github.com/eskpil/rockferry/internal/controller/controllers/common"
	"github.com/eskpil/rockferry/internal/controller/runtime"
	"github.com/eskpil/rockferry/pkg/rockferry"
	"github.com/labstack/echo/v4"
)

type ListFilter struct {
	Kind string `query:"kind"`
	Id   string `query:"id"`

	OwnerKind string `query:"owner_kind"`
	OwnerId   string `query:"owner_id"`
}

func List() echo.HandlerFunc {
	return func(c echo.Context) error {
		ctx, cancel := context.WithTimeout(c.Request().Context(), 10*time.Second)
		defer cancel()

		filter := new(ListFilter)
		if err := c.Bind(filter); err != nil {
			return c.JSON(http.StatusBadRequest, common.MalformedInput())
		}

		r := runtime.ExtractRuntime(c)

		var owner *rockferry.OwnerRef
		if filter.OwnerKind != "" && filter.OwnerId != "" {
			owner = new(rockferry.OwnerRef)
			owner.Kind = filter.OwnerKind
			owner.Id = filter.OwnerId
		}

		resources, err := r.List(ctx, filter.Kind, filter.Id, owner, nil)
		if err != nil {
			return c.JSON(http.StatusInternalServerError, common.InternalServerError())
		}

		list := new(common.ListResponse[rockferry.Generic])
		list.List = resources

		return c.JSON(http.StatusOK, list)
	}
}

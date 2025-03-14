package resource

import (
	"context"
	"fmt"
	"net/http"
	"time"

	"github.com/eskpil/rockferry/internal/controller/controllers/common"
	"github.com/eskpil/rockferry/internal/controller/runtime"
	"github.com/eskpil/rockferry/pkg/rockferry"
	"github.com/google/uuid"
	"github.com/labstack/echo/v4"
)

type CreateResourceInput struct {
	Annotations map[string]string      `json:"annotations"`
	Kind        rockferry.ResourceKind `json:"kind"`
	OwnerRef    *rockferry.OwnerRef    `json:"owner_ref"`
	Spec        any                    `json:"spec"`
}

type res struct {
	Ok bool `json:"ok"`
}

func Create() echo.HandlerFunc {
	return func(c echo.Context) error {
		ctx, cancel := context.WithTimeout(c.Request().Context(), 10*time.Second)
		defer cancel()

		input := new(CreateResourceInput)
		if err := c.Bind(input); err != nil {
			fmt.Println(err)
			return c.JSON(http.StatusBadRequest, common.MalformedInput())
		}

		resource := new(rockferry.Generic)

		id := uuid.NewString()

		resource.Id = id
		resource.Owner = input.OwnerRef
		resource.Kind = string(input.Kind)
		resource.Annotations = input.Annotations
		resource.Spec = input.Spec

		r := runtime.ExtractRuntime(c)

		if err := r.CreateResource(ctx, resource); err != nil {
			fmt.Println(err)
			return c.JSON(http.StatusInternalServerError, common.InternalServerError())
		}

		response := new(res)
		response.Ok = true

		return c.JSON(http.StatusCreated, response)
	}
}

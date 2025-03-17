package resource

import (
	"context"
	"fmt"
	"net/http"
	"time"

	"github.com/eskpil/rockferry/internal/controller/controllers/common"
	"github.com/eskpil/rockferry/internal/controller/runtime"
	"github.com/eskpil/rockferry/pkg/rockferry"
	jsonpatch "github.com/evanphx/json-patch/v5"
	"github.com/labstack/echo/v4"
)

type PatchResourceInput struct {
	Kind    rockferry.ResourceKind `json:"kind"`
	Id      string                 `json:"id"`
	Patches jsonpatch.Patch        `json:"patches"`
}

func Patch() echo.HandlerFunc {
	return func(c echo.Context) error {
		ctx, cancel := context.WithTimeout(c.Request().Context(), 10*time.Second)
		defer cancel()

		input := new(PatchResourceInput)
		if err := c.Bind(input); err != nil {
			fmt.Println(err)
			return c.JSON(http.StatusBadRequest, common.MalformedInput())
		}

		if input.Id == "" {
			return c.JSON(http.StatusBadRequest, common.MalformedInput())
		}

		r := runtime.ExtractRuntime(c)

		if err := r.Patch(ctx, input.Kind, input.Id, input.Patches); err != nil {
			if err == rockferry.ErrorNotFound {
				return c.JSON(http.StatusNotFound, common.NotFound())
			}

			return c.JSON(http.StatusBadRequest, common.InternalServerError())
		}

		response := new(struct{ Ok bool })
		response.Ok = true

		return c.JSON(http.StatusCreated, response)
	}
}

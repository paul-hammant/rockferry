package resource

import (
	"context"
	"fmt"
	"net/http"
	"time"

	"github.com/eskpil/rockferry/internal/controller/controllers/common"
	"github.com/eskpil/rockferry/internal/controller/db"
	"github.com/eskpil/rockferry/internal/controller/models"
	jsonpatch "github.com/evanphx/json-patch/v5"
	"github.com/labstack/echo/v4"
)

type PatchResourceInput struct {
	Kind    models.ResourceKind `json:"kind"`
	Id      string              `json:"id"`
	Patches jsonpatch.Patch     `json:"patches"`
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

		path := fmt.Sprintf("%s/%s/%s", models.RootKey, input.Kind, input.Id)

		db := db.Extract(c)

		res, err := db.Get(ctx, path)
		if err != nil {
			fmt.Println("failed to fetch resource", err)
			return c.JSON(http.StatusInternalServerError, common.InternalServerError())
		}

		if 0 >= len(res.Kvs) {
			return c.JSON(http.StatusNotFound, common.NotFound())
		}

		if 2 <= len(res.Kvs) {
			panic("more than 1 response")
		}

		original := res.Kvs[0].Value

		modified, err := input.Patches.Apply(original)
		if err != nil {
			panic(err)
		}

		fmt.Println("ui patching: ", path)

		_, err = db.Put(ctx, path, string(modified))
		if err != nil {
			panic(err)
		}

		response := new(struct{ Ok bool })
		response.Ok = true

		return c.JSON(http.StatusCreated, response)
	}
}

package resource

import (
	"encoding/json"
	"net/http"

	"github.com/eskpil/rockferry/internal/controller/controllers/common"
	"github.com/eskpil/rockferry/internal/controller/runtime"
	"github.com/eskpil/rockferry/pkg/rockferry"
	"github.com/labstack/echo/v4"
	"golang.org/x/net/websocket"
)

func WatchMiddleware() echo.MiddlewareFunc {
	return func(next echo.HandlerFunc) echo.HandlerFunc {
		return func(c echo.Context) error {

			return next(c)
		}
	}
}

type WatchFilter struct {
	Action rockferry.WatchAction `query:"action"`

	Kind string `query:"kind"`
	Id   string `query:"id"`

	OwnerKind string `query:"owner_kind"`
	OwnerId   string `query:"owner_id"`
}

func Watch() echo.HandlerFunc {
	return func(c echo.Context) error {
		filter := new(WatchFilter)
		if err := c.Bind(filter); err != nil {
			return c.JSON(http.StatusBadRequest, common.MalformedInput())
		}

		r := runtime.ExtractRuntime(c)

		stream, canceled, err := r.Watch(c.Request().Context(), filter.Action, filter.Kind, filter.Id, nil)
		if err != nil {
			return err
		}

		websocket.Handler(func(ws *websocket.Conn) {
			defer ws.Close()
			for {
				select {
				case <-c.Request().Context().Done():
					return
				case <-canceled:
					return
				case e := <-stream:
					response, err := json.Marshal(e)
					if err != nil {
						panic(err)
					}

					if _, err := ws.Write(response); err != nil {
						panic(err)
					}
				}
			}
		}).ServeHTTP(c.Response(), c.Request())
		return c.String(http.StatusOK, "done")
	}
}

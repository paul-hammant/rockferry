package runtime

import (
	"github.com/labstack/echo/v4"
)

const RuntimeKey = "runtime"

func (r *Runtime) EchoMiddleware() echo.MiddlewareFunc {
	return func(next echo.HandlerFunc) echo.HandlerFunc {
		return func(c echo.Context) error {
			c.Set(RuntimeKey, r)
			return next(c)
		}
	}
}

func ExtractRuntime(c echo.Context) *Runtime {
	return c.Get(RuntimeKey).(*Runtime)
}

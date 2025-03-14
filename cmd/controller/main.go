package main

import (
	"fmt"
	"log"
	"log/slog"
	"net"
	"net/http"
	"sync"
	"time"

	"github.com/eskpil/rockferry/controllerapi"
	"github.com/eskpil/rockferry/internal/controller"
	"github.com/eskpil/rockferry/internal/controller/api"
	"github.com/eskpil/rockferry/internal/controller/controllers/resource"
	"github.com/eskpil/rockferry/internal/controller/db"
	"github.com/eskpil/rockferry/internal/controller/runtime"
	"github.com/eskpil/rockferry/pkg/rockferry"
	"github.com/eskpil/rockferry/pkg/rockferry/spec"
	"github.com/labstack/echo/v4"
	"github.com/labstack/echo/v4/middleware"
	"google.golang.org/grpc"
	"google.golang.org/grpc/reflection"

	clientv3 "go.etcd.io/etcd/client/v3"
	"go.etcd.io/etcd/server/v3/embed"
)

func runDb(dir string) {
	cfg := embed.NewConfig()
	cfg.Dir = dir
	e, err := embed.StartEtcd(cfg)
	if err != nil {
		log.Fatal(err)
	}

	defer e.Close()
	select {
	case <-e.Server.ReadyNotify():
		log.Printf("Database is running")
	case <-time.After(60 * time.Second):
		e.Server.Stop() // trigger a shutdown
		log.Printf("Server took too long to start!")
	}

	log.Fatal(<-e.Err())
}

func main() {
	wg := new(sync.WaitGroup)

	wg.Add(1)
	go func(wg *sync.WaitGroup) {
		// TODO: Add clustering support
		runDb("salmon_vm.etcd")
		wg.Done()
	}(wg)

	if err := controller.Initialize(); err != nil {
		panic(err)
	}

	// TODO: Enable some kind of config
	// TODO: Avoid multiple db connections
	cli, err := clientv3.New(clientv3.Config{
		Endpoints:   []string{"localhost:2379"},
		DialTimeout: 5 * time.Second,
	})

	// TODO: Avoid panic
	if err != nil {
		panic(err)
	}

	r := runtime.New(cli)

	wg.Add(1)
	go func(wg *sync.WaitGroup) {
		server := echo.New()

		server.Use(r.EchoMiddleware())
		server.Use(middleware.CORSWithConfig(middleware.CORSConfig{
			AllowOrigins: []string{"*"},
			AllowHeaders: []string{echo.HeaderOrigin, echo.HeaderContentType, echo.HeaderAccept},
		}))

		server.Use(db.Middleware())

		server.GET("/v1/resources", resource.List())
		server.POST("v1/resources", resource.Create())
		server.DELETE("/v1/resources", resource.Delete())
		server.PATCH("/v1/resources", resource.Patch())

		if err := server.Start("0.0.0.0:8080"); err != nil {
			panic(err)
		}
	}(wg)

	wg.Add(1)
	go func(wg *sync.WaitGroup) {
		server := echo.New()

		server.Use(r.EchoMiddleware())
		server.Use(middleware.CORSWithConfig(middleware.CORSConfig{
			AllowOrigins: []string{"*"},
			AllowHeaders: []string{echo.HeaderOrigin, echo.HeaderContentType, echo.HeaderAccept},
		}))

		server.Use(db.Middleware())
		server.POST("/machineconfig", func(c echo.Context) error {
			uuid := c.Param("u")

			fmt.Printf("fetching config for: %s: %s\n", uuid, c.Param("h"))

			machine, err := r.Get(c.Request().Context(), rockferry.ResourceKindMachine, uuid, nil, nil)
			if err != nil {
				return c.String(http.StatusNotFound, "no machine")
			}

			machineReq, err := r.Get(c.Request().Context(), rockferry.ResourceKindMachineRequest, machine.Annotations["machinerequest.id"], nil, nil)
			if err != nil {
				return c.String(http.StatusNotFound, "not found")
			}

			resource, err := r.Get(c.Request().Context(), rockferry.ResourceKindCluster, machineReq.Annotations["cluster.id"], nil, nil)
			if err != nil {
				return err
			}

			cluster := rockferry.CastFromMap[spec.ClusterSpec, spec.ClusterStatus](resource)

			return c.String(http.StatusOK, string(cluster.Spec.ControlPlaneConfig))
		})

		if err := server.Start("0.0.0.0:10000"); err != nil {
			panic(err)
		}
	}(wg)

	wg.Add(1)
	go func(wg *sync.WaitGroup) {
		listener, err := net.Listen("tcp", "0.0.0.0:9090")
		if err != nil {
			panic(err)
		}

		api, err := api.New(r)
		if err != nil {
			panic(err)
		}

		server := grpc.NewServer()
		controllerapi.RegisterControllerApiServer(server, api)

		reflection.Register(server)

		if err := server.Serve(listener); err != nil {
			slog.Error("could not serve requests", slog.Any("err", err))
		}

	}(wg)

	wg.Wait()
}

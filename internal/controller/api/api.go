package api

import (
	"github.com/eskpil/rockferry/controllerapi"
	"github.com/eskpil/rockferry/internal/controller/runtime"
	clientv3 "go.etcd.io/etcd/client/v3"
)

type Controller struct {
	controllerapi.UnimplementedControllerApiServer
	Db *clientv3.Client
	R  *runtime.Runtime
}

func New(r *runtime.Runtime) (Controller, error) {
	controller := new(Controller)

	controller.Db = r.Db

	controller.R = r

	return *controller, nil
}

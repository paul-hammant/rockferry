package node

import (
	"context"

	"github.com/eskpil/rockferry/internal/node/config"
	"github.com/eskpil/rockferry/internal/node/tasks"
	"github.com/eskpil/rockferry/pkg/rockferry"
)

type State struct {
	Client *rockferry.Client

	t *tasks.TaskList
}

func createNodeResource(client *rockferry.Client, conf *config.Config) error {
	node := new(rockferry.Node)

	node.Id = conf.Id
	node.Kind = rockferry.ResourceKindNode
	node.Phase = rockferry.PhaseCreated

	return client.Nodes().Create(context.Background(), node)
}

func ensureNodeResource(client *rockferry.Client, conf *config.Config) error {
	_, err := client.Nodes().Get(context.Background(), conf.Id, nil)
	if err != nil {
		if err == rockferry.ErrorNotFound {
			return createNodeResource(client, conf)
		}

		return err
	}

	return nil
}

func New(c *config.Config) (*State, error) {
	var err error
	state := new(State)

	client, err := rockferry.New(c.Url)
	if err != nil {
		return nil, err
	}

	if err := ensureNodeResource(client, c); err != nil {
		return nil, err
	}

	state.t, err = tasks.NewTaskList(client, c.Id)
	if err != nil {
		return nil, err
	}

	state.Client = client

	return state, err
}

func (s *State) Watch(ctx context.Context) error {
	ctx = context.WithoutCancel(ctx)

	if err := s.startupTasks(); err != nil {
		return err
	}

	if err := s.watchStorageVolumes(ctx); err != nil {
		return err
	}

	if err := s.watchMachineRequests(ctx); err != nil {
		return err
	}

	if err := s.watchMachines(ctx); err != nil {
		return err
	}

	return s.t.Run(ctx)
}

func (s *State) startupTasks() error {
	{
		task := new(tasks.SyncNodeTask)
		s.t.AppendUnbound(task)
	}

	{
		task := new(tasks.SyncStoragePoolsTask)
		s.t.AppendUnbound(task)
	}

	{
		task := new(tasks.SyncStorageVolumesTask)
		s.t.AppendUnbound(task)
	}

	{
		task := new(tasks.SyncNetworksTask)
		s.t.AppendUnbound(task)
	}

	{
		task := new(tasks.SyncMachineStatusesTask)
		s.t.AppendUnbound(task)
	}

	return nil
}

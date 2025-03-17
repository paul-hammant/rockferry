package node

import (
	"context"

	"github.com/eskpil/rockferry/internal/node/tasks"
	"github.com/eskpil/rockferry/pkg/rockferry"
)

func (s *State) watchMachineRequests(ctx context.Context) error {
	go func() {
		requests, err := s.Client.MachineRequests().List(ctx, "", nil)
		if err != nil && err != rockferry.ErrorNotFound {
			return
		}

		for _, req := range requests {
			if req.Phase == rockferry.PhaseRequested {
				task := new(tasks.CreateVirtualMachineTask)
				task.Request = req
				s.t.AppendBound(task)
			}
		}

		stream, err := s.Client.MachineRequests().Watch(ctx, rockferry.WatchActionUpdate, "", nil)
		if err != nil {
			return
		}

		for {
			req := <-stream

			if req.Resource.Phase == rockferry.PhaseRequested {
				task := new(tasks.CreateVirtualMachineTask)
				task.Request = req.Resource
				s.t.AppendBound(task)
			}

		}
	}()

	return nil
}

func (s *State) watchMachines(ctx context.Context) error {
	go func() {
		stream, err := s.Client.Machines().Watch(ctx, rockferry.WatchActionDelete, "", nil)
		if err != nil {
			return
		}

		for {
			machine := <-stream
			task := new(tasks.DeleteVmTask)
			task.Machine = machine.Resource
			s.t.AppendUnbound(task)
		}
	}()

	go func() {
		stream, err := s.Client.Machines().Watch(ctx, rockferry.WatchActionUpdate, "", nil)
		if err != nil {
			return
		}

		for {
			e := <-stream
			task := new(tasks.UpdateVmTask)
			task.Machine = e.Resource
			task.Prev = e.Prev
			s.t.AppendUnbound(task)
		}
	}()

	return nil
}

func (s *State) watchStorageVolumes(ctx context.Context) error {
	volumes, err := s.Client.StorageVolumes().List(ctx, "", nil)
	if err != nil && err != rockferry.ErrorNotFound {
		return err
	}

	for _, vol := range volumes {
		if vol.Phase == rockferry.PhaseRequested {
			task := new(tasks.CreateVolumeTask)
			task.Volume = vol
			s.t.AppendBound(task)
		}
	}

	// TODO: Combine?
	go func() {
		stream, err := s.Client.StorageVolumes().Watch(ctx, rockferry.WatchActionCreate, "", nil)
		if err != nil {
			return
		}

		for {
			vol := <-stream

			if vol.Resource.Phase == rockferry.PhaseRequested {
				task := new(tasks.CreateVolumeTask)
				task.Volume = vol.Resource
				s.t.AppendBound(task)
			}

		}
	}()

	go func() {
		stream, err := s.Client.StorageVolumes().Watch(ctx, rockferry.WatchActionDelete, "", nil)
		if err != nil {
			return
		}

		for {
			vol := <-stream

			task := new(tasks.DeleteVolumeTask)
			task.Volume = vol.Resource
			s.t.AppendUnbound(task)

		}
	}()

	return nil
}

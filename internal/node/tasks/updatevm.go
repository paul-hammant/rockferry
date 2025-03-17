package tasks

import (
	"context"
	"fmt"
	"strconv"
	"strings"
	"time"

	"github.com/eskpil/rockferry/pkg/rockferry"
	"github.com/eskpil/rockferry/pkg/rockferry/spec"
	"github.com/mohae/deepcopy"
	"github.com/r3labs/diff/v2"
)

type UpdateVmTask struct {
	Machine *rockferry.Machine
	Prev    *rockferry.Machine
}

func (t *UpdateVmTask) handleUpdateState(_ context.Context, e *Executor, change diff.Change) error {
	desired := change.To.(spec.MachineStatusState)
	current, err := e.Libvirt.GetDomainState(t.Machine.Id)
	if err != nil {
		return err
	}

	if current == spec.MachineStatusStateStopped && desired == spec.MachineStatusStateBooting {
		return e.Libvirt.StartDomain(t.Machine.Id)
	}

	if current == spec.MachineStatusStateRunning && desired == spec.MachineStatusStateShutdown {
		// TODO: This is a bad check. Currently, if the machine runs without a qemu-guest-agent
		// 		 we just kill the qemu process. We should instead configure libvirt to use acpi.
		// 		 the hard part is knowing if the machine is still in the bootloader, where acpi
		// 		 will not work.
		if strings.Contains(strings.Join(t.Machine.Status.Errors, " "), "Guest agent is not responding: QEMU guest agent is not connected") {
			return e.Libvirt.DestroyDomain(t.Machine.Id)
		} else {
			return e.Libvirt.ShutdownDomain(t.Machine.Id)
		}
	}

	return nil
}

func (t *UpdateVmTask) handleCreateDisk(ctx context.Context, e *Executor, index int) error {
	disk := t.Machine.Spec.Disks[index]

	modified := deepcopy.Copy(t.Machine).(*rockferry.Machine)

	stream, err := e.Rockferry.StorageVolumes().Watch(ctx, rockferry.WatchActionUpdate, "", nil)
	if err != nil {
		return err
	}

	for {
		select {
		case event := <-stream:
			{
				if event.Resource.Id != disk.Volume {
					continue
				}

				if event.Resource.Phase != rockferry.PhaseRequested {
					continue
				}

				modified.Spec.Disks[index].Device = "disk"
				modified.Spec.Disks[index].Key = event.Resource.Spec.Key

				pool, err := e.Rockferry.StoragePools().Get(ctx, event.Resource.Owner.Id, nil)
				if err != nil {
					return err
				}

				if pool.Spec.Type == "rbd" {
					modified.Spec.Disks[index].Type = "network"

					modified.Spec.Disks[index].Network = new(spec.MachineSpecDiskNetwork)
					modified.Spec.Disks[index].Network.Protocol = pool.Spec.Type
					modified.Spec.Disks[index].Network.Hosts = pool.Spec.Source.Hosts
					modified.Spec.Disks[index].Network.Auth = *pool.Spec.Source.Auth

					rockferry.MachineEnsureUniqueDiskTargets(modified.Spec.Disks, rockferry.MachineDiskTargetBaseVD)
				}

				if pool.Spec.Type == "dir" {
					modified.Spec.Disks[index].Type = "file"
					modified.Spec.Disks[index].File = new(spec.MachineSpecDiskFile)

					rockferry.MachineEnsureUniqueDiskTargets(modified.Spec.Disks, rockferry.MachineDiskTargetBaseSD)
				}

				if err := e.Rockferry.Machines().Patch(ctx, t.Machine, modified); err != nil {
					return err
				}

				return e.Libvirt.DomainAddDisk(t.Machine.Id, modified.Spec.Disks[index])
			}
		}
	}

}

func (t *UpdateVmTask) handleDeleteDisk(_ context.Context, e *Executor, index int) error {
	// TODO: Implement
	return e.Libvirt.DomainRemoveDisk(t.Machine.Id, t.Prev.Spec.Disks[index])
}

// TODO: This makes me fucking cry. Implement our own powerful diffing library.
//
//	main problem is that the diff also checks the differences in slice elements.
//	this is something we do not want in this scenario. So i had deepseek write
//	a fucking terrible solution which makes me want to puke. It is a fine solution
//	to a stupid problem.
func (t *UpdateVmTask) Execute(ctx context.Context, e *Executor) error {
	changes, err := diff.Diff(t.Prev, t.Machine)
	if err != nil {
		return err
	}

	// Track disk additions and removals
	addedDisks := make(map[int]bool)   // Map to store added disk indices
	removedDisks := make(map[int]bool) // Map to store removed disk indices

	for _, change := range changes {
		path := strings.Join(change.Path, ".")

		// Check for disk additions or removals
		if strings.HasPrefix(path, "Spec.Disks.") {
			// Extract the disk index from the path
			parts := strings.Split(path, ".")
			if len(parts) >= 3 { // Ensure the path has at least 3 parts (e.g., ["Spec", "Disks", "5", ...])
				indexStr := parts[2] // The third part is the disk index (e.g., "5")
				index, err := strconv.Atoi(indexStr)
				if err != nil {
					// Handle invalid index (e.g., log the error and continue)
					fmt.Printf("Error parsing disk index: %v\n", err)
					continue
				}

				// Track added or removed disks
				if change.Type == "create" {
					addedDisks[index] = true
				} else if change.Type == "delete" {
					removedDisks[index] = true
				}
			}
		}

		// Handle other specific changes
		if change.Type == "update" && path == "Status.State" {
			return t.handleUpdateState(ctx, e, change)
		}
	}

	// Handle disk additions
	for index := range addedDisks {
		fmt.Printf("Disk added at index: %d\n", index)
		if err := t.handleCreateDisk(ctx, e, index); err != nil {
			return err
		}
	}

	// Handle disk removals
	for index := range removedDisks {
		fmt.Printf("Disk removed at index: %d\n", index)
		if err := t.handleDeleteDisk(ctx, e, index); err != nil {
			return err
		}
	}

	return nil
}

func (t *UpdateVmTask) Repeats() *time.Duration {
	return nil
}

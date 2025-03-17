package tasks

import (
	"context"
	"fmt"
	"reflect"
	"time"

	"github.com/eskpil/rockferry/internal/node/queries"
	"github.com/eskpil/rockferry/pkg/rockferry"
)

type Executor struct {
	Libvirt   *queries.Client
	Rockferry *rockferry.Client

	NodeId string
}

type Task interface {
	Execute(context.Context, *Executor) error
	Repeats() *time.Duration
}

type BoundTask interface {
	Execute(context.Context, *Executor) error
	Resource() *rockferry.Resource[any, any]
}

type TaskList struct {
	e            *Executor
	boundTasks   chan BoundTask
	unboundTasks chan Task
}

func NewTaskList(client *rockferry.Client, nodeId string) (*TaskList, error) {
	var err error
	list := new(TaskList)
	list.unboundTasks = make(chan Task, 100)
	list.boundTasks = make(chan BoundTask, 100)
	list.e = new(Executor)

	list.e.Libvirt, err = queries.NewClient()
	list.e.Rockferry = client
	list.e.NodeId = nodeId

	return list, err
}

func (t *TaskList) AppendBound(task BoundTask) {
	t.boundTasks <- task
}

func (t *TaskList) AppendUnbound(task Task) {
	t.unboundTasks <- task
}

func (t *TaskList) executeUnbound(ctx context.Context, task Task) {
	// Execute at start as well
	if err := task.Execute(ctx, t.e); err != nil {
		fmt.Println("failed to execute task", err)
	}

	if task.Repeats() == nil {
		return
	}

	// TODO: Add logic to stop.
	ticker := time.NewTicker(*task.Repeats())
	defer ticker.Stop()

	// Safe to block here, we are in our own goroutine.
	for {
		select {
		case <-ticker.C:
			{
				if err := task.Execute(ctx, t.e); err != nil {
					fmt.Println(reflect.TypeOf(task).Elem().Name(), "failed to execute task", err)
				}
			}
		}
	}

}

func (t *TaskList) setResourcePhase(ctx context.Context, original *rockferry.Resource[any, any], phase rockferry.Phase) error {
	generic := t.e.Rockferry.Generic(rockferry.ResourceKindAll)

	copy := new(rockferry.Generic)
	*copy = *original
	copy.Phase = phase

	return generic.Patch(ctx, original, copy)
}

func (t *TaskList) executeBound(ctx context.Context, task BoundTask) {
	if err := task.Execute(ctx, t.e); err != nil {
		fmt.Println(reflect.TypeOf(task).Elem().Elem().Name())
		fmt.Println("task returned error", err)
	}

	if err := t.setResourcePhase(ctx, task.Resource(), rockferry.PhaseCreated); err != nil {
		fmt.Println(err)
	}

}
func (t *TaskList) Run(ctx context.Context) error {
	for {
		select {
		case task := <-t.unboundTasks:
			{
				go t.executeUnbound(ctx, task)
			}
		case task := <-t.boundTasks:
			{
				go t.executeBound(ctx, task)
			}
		}
	}
}

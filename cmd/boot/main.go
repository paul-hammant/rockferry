package main

import (
	"context"
	"os"

	"github.com/eskpil/rockferry/pkg/rockferry"
	"github.com/eskpil/rockferry/pkg/rockferry/spec"
)

func main() {
	ctx := context.Background()

	cli, err := rockferry.New("localhost:9090")
	if err != nil {
		panic(err)
	}

	id := os.Args[1]

	machine, err := cli.Machines().Get(ctx, id, nil)
	if err != nil {
		panic(err)
	}

	_ = machine

	copy := new(rockferry.Machine)
	*copy = *machine

	copy.Status.State = spec.MachineStatusStateBooting

	if err := cli.Machines().Patch(ctx, machine, copy); err != nil {
		panic(err)
	}
}

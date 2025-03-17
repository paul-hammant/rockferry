# Contribute to Rockferry

First of all, thank you for even considering it <3.

The first step is getting it up and running on your own setup. Personally, I run a
a vm which I use for my development. And I run a seperate virtual machine for running
all the virtual machines made during development. On my development vm I run the Rockferry
controller. And the vm-vm runs the Rockferry node.

You could also run all the components locally on your development machine. No need to overcomplicate like me.
The only requirement for running the node on your own machine is to have kvm on that machine. So, Linux.

## Overcomplicated setup

If you run a overcomplicated setup like me, you would need to change some variables. Mainly,

```ts
export interface Config {
    api_url: string;
}

export const DevelopmentConfig: Config = {
    // For development change to your appropriate url here
    api_url: "THIS VALUE",
};

export const CONFIG = DevelopmentConfig;
```

in ui/src/config.ts

I personally use the make node command to automatically deploy my node to the vm-vm. So, you would need to
change there as well if you chose to do it like that. The rockferry node tries to load a config file in ./config.yml. There is a url value there, which would also
need to be changed. You probably also need to adapt the make procedure to fit your setup.

## Simple setup.

If you desire to chose the easy way. it is as easy as running

```sh
go run cmd/controller/main.go
```

```sh
go run cmd/node/main.go
```

These commands will set you up, remember to run the controller first. Or else all hell brakes loose.
Now you should be up and running. Happy Hacking! Please leave an issue if anything goes wrong.

If you encounter a resource not found error when trying to run the node for the first time, run it again.
Still have not gotten around to that issue.

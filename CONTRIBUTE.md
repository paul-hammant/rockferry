# Contribute to Rockferry

First of all, thank you for even considering it <3.

The first step is getting it up and running on your own setup. Personally, I run a
a vm which I use for my development. And I run a seperate virtual machine for running
all the virtual machines made during development. On my development vm I run the Rockferry
controller. And the vm-vm runs the Rockferry node.

You could also run all the components locally on your development machine. No need to overcomplicate like me.
The only requirement for running the node on your own machine is to have kvm on that machine. So, Linux.

## Dependencies

Rockferry is built on libvirt, so naturally libvirt needs to be installed.
Consult your distros documentation.

The latest version of golang, should be provided by your package manager.

The latest version of node.js and [yarn](https://yarnpkg.com/getting-started/install).

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

**Prereqs for recent Ubuntu versions**

```
sudo apt install -y qemu-kvm libvirt-clients libvirt-daemon-system virtinst bridge-utils curl
sudo systemctl enable libvirtd
sudo systemctl start libvirtd
sudo setfacl -m user:$USER:rw /var/run/libvirt/libvirt-sock
```

**Go**

```
rm -rf /usr/local/go && tar -C /usr/local -xzf go1.24.1.linux-amd64.tar.gz

echo '\nexport PATH=$PATH:/usr/local/go/bin\n' >> ~/.profile

# ... and restart terminal
```


**Node 20:**

```
curl -fsSL https://deb.nodesource.com/setup_20.x -o nodesource_setup.sh
sudo -E bash nodesource_setup.sh
```


If you desire to chose the easy way. it is as easy as running

```sh
go run cmd/controller/main.go
```

```sh
go run cmd/node/main.go
```

```sh
cd ui/
yarn dev --host
```

Now open the link provided by the yarn command and you will see the rockferry ui.

These commands will set you up, remember to run the controller first. Or else all hell brakes loose.
Now you should be up and running. Happy Hacking! Please leave an issue if anything goes wrong.

If you encounter a resource not found error when trying to run the node for the first time, run it again.
Still have not gotten around to that issue.


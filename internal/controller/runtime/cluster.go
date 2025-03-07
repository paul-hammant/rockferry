package runtime

import (
	"context"
	"crypto/tls"
	"errors"
	"fmt"
	"strings"
	"time"

	"github.com/eskpil/rockferry/internal/controller/models"
	"github.com/eskpil/rockferry/pkg/rockferry"
	"github.com/eskpil/rockferry/pkg/rockferry/spec"
	"github.com/eskpil/rockferry/pkg/units"
	"github.com/google/uuid"
	machineapi "github.com/siderolabs/talos/pkg/machinery/api/machine"
	"github.com/siderolabs/talos/pkg/machinery/client"
	clientconfig "github.com/siderolabs/talos/pkg/machinery/client/config"
	"github.com/siderolabs/talos/pkg/machinery/config/generate"
	"github.com/siderolabs/talos/pkg/machinery/config/machine"
	clientv3 "go.etcd.io/etcd/client/v3"
	"google.golang.org/protobuf/types/known/durationpb"
)

type ClusterAllocationError string

const (
	ClusterAllocationErrorEvenControlPlanes    ClusterAllocationError = "control planes can not be an even amount"
	ClusterAllocationErrorNoDefaultStoragePool                        = "node does not have a default storage pool"
	ClusterAllocationErrorNoDefaultNetwork                            = "node does not have a a default network"
)

func (e ClusterAllocationError) Error() string {
	return string(e)
}

func (r *Runtime) AccumulateControlPlanes(ctx context.Context, machinerequests []*rockferry.MachineRequest) ([]*rockferry.Machine, error) {
	stream, canceled, err := r.Watch(ctx, rockferry.WatchActionUpdate, rockferry.ResourceKindMachine, "", nil)
	if err != nil {
		return nil, err
	}

	machines := []*rockferry.Machine{}

	for {
		select {
		case <-canceled:
			{
				return nil, fmt.Errorf("stream closed")
			}
		case e := <-stream:
			{
				machine := rockferry.CastFromMap[spec.MachineSpec, spec.MachineStatus](e.Resource)

				if machine.Status.State != spec.MachineStatusStateRunning {
					continue
				}

				if 1 > len(machine.Status.ReachableIps) {
					continue
				}

				for _, cp_req := range machinerequests {
					if cp_req.Id == machine.Annotations["machinerequest.id"] {
						machines = append(machines, machine)
						break
					}
				}
			}
		}

		// Means we have collected all our machine requests
		if len(machines) == len(machinerequests) {
			return machines, nil
		}
	}
}

func (r *Runtime) SpreadKubernetesControlPlanes(ctx context.Context, machinerequests []*rockferry.MachineRequest) error {
	path := fmt.Sprintf("%s/%s", models.RootKey, rockferry.ResourceKindNode)
	results, err := r.Db.Get(ctx, path, clientv3.WithPrefix())
	if err != nil {
		return err
	}

	if len(results.Kvs) == len(machinerequests) {
		// Easy, one machine per node

		for i, node := range results.Kvs {
			// what is this vocabulary?
			fmt.Println("symmetrical node rockferry instance")
			// TODO: Check if node has enough available resources for
			// 		 the requested topology. For now, we do it easy
			parts := strings.Split(string(node.Key), "/")
			id := parts[len(parts)-1]

			machinerequests[i].Owner = new(rockferry.OwnerRef)
			machinerequests[i].Owner.Id = id
			machinerequests[i].Owner.Kind = rockferry.ResourceKindNode
		}

		return nil
	}

	if len(results.Kvs) == 1 && len(machinerequests) == 3 {
		fmt.Println("single node rockferry instance")
		// Easy, all machines per node
		node := results.Kvs[0]
		parts := strings.Split(string(node.Key), "/")
		id := parts[len(parts)-1]

		for _, machinereq := range machinerequests {
			machinereq.Owner = new(rockferry.OwnerRef)
			machinereq.Owner.Id = id
			machinereq.Owner.Kind = rockferry.ResourceKindNode
		}

		return nil
	}

	panic("unhandled")
}

func (r *Runtime) AssignKubernetesNodeResources(ctx context.Context, machinereq *rockferry.MachineRequest) error {
	annotations := map[string]string{
		"rockferry.default": "yes",
	}

	storagePool, err := r.Get(ctx, rockferry.ResourceKindStoragePool, "", machinereq.Owner, annotations)
	if err != nil {
		return err
	}

	disk := new(spec.MachineRequestSpecDisk)
	disk.Pool = storagePool.Id
	disk.Capacity = units.Gigabyte * 20
	machinereq.Spec.Disks = append(machinereq.Spec.Disks, disk)

	network, err := r.Get(ctx, rockferry.ResourceKindNetwork, "", machinereq.Owner, annotations)
	if err != nil {
		return err
	}

	machinereq.Spec.Network = network.Id

	return nil
}

func (r *Runtime) CreateClusterResource(ctx context.Context, request *rockferry.ClusterRequest) (*rockferry.Cluster, error) {
	cluster := new(rockferry.Cluster)

	cluster.Id = uuid.NewString()

	cluster.Annotations = map[string]string{}
	cluster.Annotations["clusterrequest.id"] = request.Id

	cluster.Owner = new(rockferry.OwnerRef)
	cluster.Owner.Id = "self"
	cluster.Owner.Kind = rockferry.ResourceKindInstance

	cluster.Kind = rockferry.ResourceKindCluster

	cluster.Spec.Name = request.Spec.Name
	cluster.Spec.KubernetesVersion = request.Spec.KubernetesVersion
	cluster.Status.State = spec.ClusterStatusStateCreating

	if err := r.CreateResource(ctx, cluster.Generic()); err != nil {
		return nil, err
	}

	return cluster, nil
}

func (r *Runtime) AllocateTalosConfig(ctx context.Context, cluster *rockferry.Cluster, request *rockferry.ClusterRequest, cps []string) error {
	opts := []generate.Option{}

	// Need something to determine wheter to use /dev/vda or /dev/sda
	opts = append(opts, generate.WithInstallDisk("/dev/sda"))
	opts = append(opts, generate.WithAllowSchedulingOnControlPlanes(true))

	// TODO: Allocate VIP somehow?
	endpoint := fmt.Sprintf("https://%s:6443", cps[0])

	config, err := generate.NewInput(request.Spec.Name, endpoint, request.Spec.KubernetesVersion, opts...)

	config.ServiceNet = []string{"10.196.0.0/24"}

	cp_config, err := config.Config(machine.TypeControlPlane)
	if err != nil {
		return err
	}

	wr_config, err := config.Config(machine.TypeWorker)
	if err != nil {
		return err
	}

	cp_bytes, err := cp_config.Bytes()
	if err != nil {
		return err
	}

	wr_bytes, err := wr_config.Bytes()
	if err != nil {
		return err
	}

	cluster.Spec.ControlPlaneConfig = cp_bytes
	cluster.Spec.WorkerConfig = wr_bytes

	talosconfig, err := config.Talosconfig()
	if err != nil {
		return err
	}

	talosconfig.Contexts[talosconfig.Context].Endpoints = cps

	tc_bytes, err := talosconfig.Bytes()
	if err != nil {
		return err
	}

	cluster.Spec.TalosConfig = tc_bytes

	return r.Update(ctx, cluster.Generic())
}

func (r *Runtime) ApplyKubernetesMachineConfigurations(ctx context.Context, nodes []string, config []byte) error {
	for _, node := range nodes {
		ctx = client.WithNode(ctx, node)

		tlsConfig := &tls.Config{
			InsecureSkipVerify: true,
		}

		client, err := client.New(ctx, client.WithTLSConfig(tlsConfig), client.WithEndpoints(nodes...))
		if err != nil {
			panic(err)
		}

		req := new(machineapi.ApplyConfigurationRequest)

		req.Data = config
		req.DryRun = false
		req.Mode = machineapi.ApplyConfigurationRequest_AUTO
		req.TryModeTimeout = durationpb.New(2 * time.Second)

		if _, err := client.ApplyConfiguration(ctx, req); err != nil {
			return err
		}
	}

	return nil
}
func (r *Runtime) BootstrapKubernetesCluster(ctx context.Context, cluster *rockferry.Cluster, nodes []string) error {
	time.Sleep(10 * time.Second)

	ctx = client.WithNode(ctx, nodes[0])

	fmt.Println(string(cluster.Spec.TalosConfig))

	cfg, err := clientconfig.FromBytes(cluster.Spec.TalosConfig)
	if err != nil {
		return fmt.Errorf("failed to parse Talos config: %w", err)
	}

	// Just bootstrap the first control plane
	c, err := client.New(ctx, client.WithConfig(cfg), client.WithEndpoints(nodes[0]))
	if err != nil {
		return fmt.Errorf("failed to create Talos client: %w", err)
	}

	req := &machineapi.BootstrapRequest{
		RecoverEtcd:          false,
		RecoverSkipHashCheck: false,
	}

	maxAttempts := 40
	timeout := 10 * time.Second

	for _ = range maxAttempts {
		err = c.Bootstrap(ctx, req)
		if err == nil {
			return nil // Bootstrap successful
		}

		if strings.Contains(err.Error(), "connection refused") || strings.Contains(err.Error(), "authentication handshake failed") {
			time.Sleep(timeout)
			continue
		}

		return fmt.Errorf("bootstrap failed: %w", err) // Unexpected error
	}

	return errors.New("bootstrap failed: maximum retry attempts reached")
}

// NOTE: this function naturally blocks until the cluster is created
func (r *Runtime) AllocateKubernetesCluster(ctx context.Context, request *rockferry.ClusterRequest) error {
	// step 1   list through all requested nodes.
	if len(request.Spec.ControlPlanes)%2 == 0 {
		return ClusterAllocationErrorEvenControlPlanes
	}

	cluster, err := r.CreateClusterResource(ctx, request)
	if err != nil {
		return err
	}

	cp_machinerequests := []*rockferry.MachineRequest{}
	for i, cp := range request.Spec.ControlPlanes {
		//		1.1 allocate a virtual machine with the correct topology
		machinereq := new(rockferry.MachineRequest)

		machinereq.Kind = rockferry.ResourceKindMachineRequest
		machinereq.Id = uuid.NewString()
		machinereq.Phase = rockferry.PhaseRequested

		machinereq.Annotations = map[string]string{}
		machinereq.Annotations["clusterrequest.id"] = request.Id
		machinereq.Annotations["clusterrequest.name"] = request.Spec.Name
		machinereq.Annotations["cluster.id"] = cluster.Id

		// TODO: Do not hardcode. Actually talk to a image factory instance and
		// 		 create a schematic
		machinereq.Annotations["kernel.download"] = "https://factory.talos.dev/image/ce4c980550dd2ab1b17bbf2b08801c7eb59418eafe8f279833297925d67c7515/v1.9.4/kernel-amd64"
		machinereq.Annotations["initramfs.download"] = "https://factory.talos.dev/image/ce4c980550dd2ab1b17bbf2b08801c7eb59418eafe8f279833297925d67c7515/v1.9.4/initramfs-amd64.xz"
		machinereq.Annotations["kernel.cmdline"] = "talos.platform=metal console=tty0 init_on_alloc=1 slab_nomerge pti=on consoleblank=0 nvme_core.io_timeout=4294967295 printk.devkmsg=on ima_template=ima-ng ima_appraise=fix ima_hash=sha512"

		machinereq.Spec.Topology = cp.Topology

		machinereq.Spec.Name = fmt.Sprintf("%s-cp%d", request.Spec.Name, i)

		machinereq.Spec.Cdrom = new(spec.MachineRequestSpecCdrom)

		machinereq.Spec.Disks = []*spec.MachineRequestSpecDisk{}

		cp_machinerequests = append(cp_machinerequests, machinereq)
	}
	//	1.1.1 spread controlplanes out over the physical nodes managed
	//		by the rockferry instance. I.E if the instance manages three
	//		physical hosts, one control plane per host can be managed
	//		if only two physical nodes is present, chose one of the nodes
	//		to have dominance. If one physical node, spin out all requested
	//		control planes on that node.
	if err := r.SpreadKubernetesControlPlanes(ctx, cp_machinerequests); err != nil {
		return err
	}

	for _, cp := range cp_machinerequests {
		if err := r.AssignKubernetesNodeResources(ctx, cp); err != nil {
			return err
		}
	}

	for _, cp := range cp_machinerequests {
		if err := r.CreateResource(ctx, cp.Generic()); err != nil {
			return err
		}
	}

	//		1.2 wait for all control plane node status to be marked as running
	machines, err := r.AccumulateControlPlanes(ctx, cp_machinerequests)
	if err != nil {
		return err
	}

	//		1.3 list all interface ip addresses of machine status
	// 		1.4 collect all nodes and ip addresses
	//

	cps := []string{}
	for _, machine := range machines {
		node := new(spec.ClusterNodeSpec)
		node.Kind = spec.ClusterNodeKindControlPlane
		node.MachineId = machine.Id

		cluster.Spec.Nodes = append(cluster.Spec.Nodes, node)

		cps = append(cps, machine.Status.ReachableIps[0].Ip)
	}

	if err := r.Update(ctx, cluster.Generic()); err != nil {
		return err
	}

	// step 2   create a talos config with the nodes
	if err := r.AllocateTalosConfig(ctx, cluster, request, cps); err != nil {
		return err
	}

	// 2.1 apply the configuration to all nodes
	if err := r.ApplyKubernetesMachineConfigurations(ctx, cps, cluster.Spec.ControlPlaneConfig); err != nil {
		return err
	}

	// 2.2 bootstrap the controlplane
	if err := r.BootstrapKubernetesCluster(ctx, cluster, cps); err != nil {
		return err
	}

	// TODO: 2.3 add worker nodes

	cluster.Status.State = spec.ClusterStatusStateHealthy

	return r.Update(ctx, cluster.Generic())
}

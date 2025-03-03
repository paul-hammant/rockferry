import { Card, Table, Badge, Text } from "@radix-ui/themes";
import {
    Cluster,
    ClusterNode,
    ClusterNodeKind,
    ClusterStatus,
} from "../../../types/cluster";
import { Resource, ResourceKind } from "../../../types/resource";
import { MachinesHeader } from "../../../components/machines";
import { Machine, MachineStatus } from "../../../types/machine";
import { useQuery } from "@tanstack/react-query";
import { get } from "../../../data/queries/get";
import { useNavigate } from "react-router";
import { convert, Units } from "../../../utils/conversion";

interface Props {
    cluster: Resource<Cluster, ClusterStatus>;
}

const NodeRow: React.FC<{ node: ClusterNode }> = ({ node }) => {
    const navigate = useNavigate();

    const vm = useQuery({
        queryKey: ["machines", node.machine_id],
        queryFn: () =>
            get<Machine, MachineStatus>(node.machine_id, ResourceKind.Machine),
    });

    if (vm.isError) {
        return <div>error</div>;
    }

    if (vm.isLoading) {
        return <div>loading..</div>;
    }

    const memory = convert(
        vm.data!.spec!.topology.memory,
        Units.Bytes,
        Units.Gigabyte,
    );
    return (
        <Table.Row
            key={vm.data!.id}
            onClick={() => navigate(`/vm/${vm.data!.id!}`)}
        >
            <Table.RowHeaderCell>
                <Badge color="green">{vm.data!.status.state}</Badge>
            </Table.RowHeaderCell>
            <Table.RowHeaderCell>{vm.data!.spec!.name}</Table.RowHeaderCell>
            <Table.Cell>
                <Badge color="purple">
                    {vm.data!.spec!.topology.cores *
                        vm.data!.spec!.topology.threads}
                </Badge>
            </Table.Cell>
            <Table.Cell>
                <Badge color="purple">{memory} Gb</Badge>
            </Table.Cell>
            <Table.Cell>
                {vm.data!.spec!.interfaces[0].mac} (
                <Badge color="amber">
                    {vm.data!.spec!.interfaces[0].network}
                </Badge>
                )
            </Table.Cell>
            <Table.Cell>
                <Badge color="amber">{vm.data!.spec!.interfaces.length}</Badge>
            </Table.Cell>
            <Table.Cell>
                <Badge color="amber">{vm.data!.spec!.disks.length}</Badge>
            </Table.Cell>
            <Table.Cell></Table.Cell>
        </Table.Row>
    );
};

export const MachinesTab: React.FC<Props> = ({ cluster }) => {
    const workers = cluster.spec!.nodes.filter(
        (node) => node.kind == ClusterNodeKind.Worker,
    );

    const controlPlanes = cluster.spec!.nodes.filter(
        (node) => node.kind == ClusterNodeKind.ControlPlane,
    );
    return (
        <>
            <Card>
                <Text m="3" weight="light">
                    Control Planes
                </Text>
                <Table.Root>
                    <MachinesHeader
                        onPlusClick={() => console.log("add node create")}
                    />

                    <Table.Body>
                        {controlPlanes.map((node) => (
                            <NodeRow key={node.machine} node={node} />
                        ))}
                    </Table.Body>
                </Table.Root>
            </Card>
            <Card mt="3">
                <Text m="3" weight="light">
                    Workers
                </Text>
                <Table.Root>
                    <MachinesHeader
                        onPlusClick={() => console.log("add node create")}
                    />

                    <Table.Body>
                        {workers.map((node) => (
                            <NodeRow key={node.machine} node={node} />
                        ))}
                    </Table.Body>
                </Table.Root>
            </Card>
        </>
    );
};

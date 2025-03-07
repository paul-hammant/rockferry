import { Table, Skeleton, Card } from "@radix-ui/themes";
import { Cluster, ClusterNode, ClusterStatus } from "../../../types/cluster";
import { Resource, ResourceKind } from "../../../types/resource";
import { MachineRow, MachinesHeader } from "../../../components/machines";
import { Machine, MachineStatus } from "../../../types/machine";
import { useQuery } from "@tanstack/react-query";
import { get } from "../../../data/queries/get";

interface Props {
    cluster: Resource<Cluster, ClusterStatus>;
}

const NodeRow: React.FC<{ node: ClusterNode }> = ({ node }) => {
    const vm = useQuery({
        queryKey: ["machines", node.machine_id],
        queryFn: () =>
            get<Machine, MachineStatus>(node.machine_id, ResourceKind.Machine),
    });

    if (vm.isError) {
        return <div>error</div>;
    }

    if (vm.isLoading) {
        return <Skeleton />;
    }

    return <MachineRow vm={vm.data!} role="cp" />;
};

export const MachinesTab: React.FC<Props> = ({ cluster }) => {
    return (
        <Card size="2">
            <Table.Root>
                <MachinesHeader withRole />
                <Table.Body>
                    {cluster.spec!.nodes.map((node) => (
                        <NodeRow key={node.machine_id} node={node} />
                    ))}
                </Table.Body>
            </Table.Root>
        </Card>
    );
};

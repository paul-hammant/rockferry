import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router";
import { list } from "../../data/queries/list";
import { ResourceKind } from "../../types/resource";
import { Table, Card, IconButton, Text, Button } from "@radix-ui/themes";
import {
    Cluster,
    ClusterNodeKind,
    ClusterStatus,
    ClusterStatusState,
} from "../../types/cluster";
import { Badge } from "@radix-ui/themes/src/index.js";

export const ClustersTab: React.FC<unknown> = () => {
    const navigate = useNavigate();
    const clusters = useQuery({
        queryKey: [ResourceKind.Instance, "self", ResourceKind.Cluster],
        queryFn: () =>
            list<Cluster, ClusterStatus>(
                ResourceKind.Cluster,
                "self",
                ResourceKind.Instance,
            ),
    });

    if (clusters.error) {
        return <div>Error fetching clusters</div>;
    }

    if (clusters.isLoading) {
        return <div>Loading...</div>;
    }

    return (
        <>
            <Button
                variant="soft"
                onClick={() => {
                    navigate("/create-cluster");
                }}
            >
                Create
            </Button>
            <Card mt="3">
                <Table.Root>
                    <Table.Header>
                        <Table.Row>
                            <Table.ColumnHeaderCell>
                                Status
                            </Table.ColumnHeaderCell>
                            <Table.ColumnHeaderCell>
                                Name
                            </Table.ColumnHeaderCell>
                            <Table.ColumnHeaderCell>
                                Workers
                            </Table.ColumnHeaderCell>
                            <Table.ColumnHeaderCell>
                                Control Planes
                            </Table.ColumnHeaderCell>
                            <Table.ColumnHeaderCell>
                                Kubernetes Version
                            </Table.ColumnHeaderCell>
                        </Table.Row>
                    </Table.Header>

                    <Table.Body>
                        {clusters.data.list != undefined ??
                            clusters.data!.list.map((resource) => {
                                let state_badge_color = "red";

                                switch (resource.status.state) {
                                    case ClusterStatusState.Healthy:
                                        state_badge_color = "green";
                                        break;
                                    case ClusterStatusState.Creating:
                                        state_badge_color = "amber";
                                        break;
                                }

                                const workers = resource.spec!.nodes
                                    ? resource.spec!.nodes.filter(
                                          (node) =>
                                              node.kind ==
                                              ClusterNodeKind.Worker,
                                      ).length
                                    : 0;

                                const controlPlanes = resource.spec!.nodes
                                    ? resource.spec!.nodes.filter(
                                          (node) =>
                                              node.kind ==
                                              ClusterNodeKind.ControlPlane,
                                      ).length
                                    : 0;

                                return (
                                    <Table.Row
                                        key={resource.id}
                                        onClick={() => {
                                            navigate(`/cluster/${resource.id}`);
                                        }}
                                    >
                                        <Table.RowHeaderCell>
                                            <Badge
                                                color={state_badge_color as any}
                                            >
                                                {resource.status.state}
                                            </Badge>
                                        </Table.RowHeaderCell>
                                        <Table.RowHeaderCell>
                                            <Text>{resource.spec!.name}</Text>
                                        </Table.RowHeaderCell>
                                        <Table.RowHeaderCell>
                                            <Badge color="purple">
                                                <Text>{workers}</Text>
                                            </Badge>
                                        </Table.RowHeaderCell>
                                        <Table.RowHeaderCell>
                                            <Badge color="purple">
                                                <Text>{controlPlanes}</Text>
                                            </Badge>
                                        </Table.RowHeaderCell>
                                        <Table.RowHeaderCell>
                                            <Badge color="amber">
                                                <Text>
                                                    v
                                                    {
                                                        resource.spec!
                                                            .kubernetes_version
                                                    }
                                                </Text>
                                            </Badge>
                                        </Table.RowHeaderCell>
                                    </Table.Row>
                                );
                            })}
                    </Table.Body>
                </Table.Root>
            </Card>
        </>
    );
};

import { useQuery } from "@tanstack/react-query";
import { list } from "../../data/queries/list";
import { Badge, Box, Table, Text } from "@radix-ui/themes";
import { useNavigate } from "react-router";
import { ResourceKind } from "../../types/resource";
import { Node } from "../../types/node";

export const NodesView: React.FC<unknown> = () => {
    const navigate = useNavigate();
    const nodes = useQuery({
        queryKey: ["nodes"],
        queryFn: () =>
            list<Node>(ResourceKind.Node, "self", ResourceKind.Instance),
    });

    if (nodes.error) {
        return <div>Error fetching nodes</div>;
    }

    return (
        <Box p="9">
            <Text size="8">Nodes</Text>
            <Box pt="3">
                <Table.Root>
                    <Table.Header>
                        <Table.Row>
                            <Table.ColumnHeaderCell></Table.ColumnHeaderCell>
                            <Table.ColumnHeaderCell>
                                Name
                            </Table.ColumnHeaderCell>
                            <Table.ColumnHeaderCell>Url</Table.ColumnHeaderCell>
                            <Table.ColumnHeaderCell>
                                Machines
                            </Table.ColumnHeaderCell>
                        </Table.Row>
                    </Table.Header>

                    <Table.Body>
                        {nodes.data?.list.map((node) => {
                            const color = "green";

                            return (
                                <Table.Row
                                    key={node.id}
                                    onClick={() => {
                                        navigate(`/nodes/${node.id}`);
                                    }}
                                >
                                    <Table.RowHeaderCell>
                                        <Badge color={color as any}>
                                            Connected
                                        </Badge>
                                    </Table.RowHeaderCell>
                                    <Table.RowHeaderCell>
                                        {node.spec!.hostname}
                                    </Table.RowHeaderCell>
                                    <Table.Cell>placeholder</Table.Cell>
                                    <Table.Cell>
                                        <Badge color="green">
                                            {node.spec!.active_machines}
                                        </Badge>
                                        /
                                        <Badge color="purple">
                                            {node.spec!.total_machines}
                                        </Badge>
                                    </Table.Cell>
                                </Table.Row>
                            );
                        })}
                    </Table.Body>
                </Table.Root>
            </Box>
        </Box>
    );
};

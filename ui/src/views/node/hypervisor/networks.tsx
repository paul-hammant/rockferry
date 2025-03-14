import { Resource, ResourceKind } from "../../../types/resource";
import { Node } from "../../../types/node";
import { Badge, Table } from "@radix-ui/themes";
import { Network } from "../../../types/network";
import { list } from "../../../data/queries/list";
import { useQuery } from "@tanstack/react-query";

interface Props {
    node: Resource<Node>;
}

export const NetworksView: React.FC<Props> = ({ node }) => {
    const {
        isError,
        isLoading,
        data: pools,
    } = useQuery({
        queryKey: [ResourceKind.Node, node.id, ResourceKind.Network],
        queryFn: () =>
            list<Network>(ResourceKind.Network, node.id, ResourceKind.Node),
    });

    if (isError) {
        return <p>error</p>;
    }

    if (isLoading) {
        return <p>loading</p>;
    }

    return (
        <Table.Root layout="auto">
            <Table.Header>
                <Table.Row>
                    <Table.ColumnHeaderCell>Name</Table.ColumnHeaderCell>
                    <Table.ColumnHeaderCell>Default</Table.ColumnHeaderCell>
                    <Table.ColumnHeaderCell>Type</Table.ColumnHeaderCell>
                    <Table.ColumnHeaderCell>Ipv6</Table.ColumnHeaderCell>
                </Table.Row>
            </Table.Header>

            <Table.Body>
                {pools?.list.map((network) => {
                    let default_ = "no";

                    if (
                        network.annotations &&
                        network.annotations["rockferry.default"] == "yes"
                    ) {
                        default_ = "yes";
                    }

                    return (
                        <Table.Row key={network.id} onClick={() => {}}>
                            <Table.RowHeaderCell>
                                {network.spec!.name}
                            </Table.RowHeaderCell>
                            <Table.Cell>{default_}</Table.Cell>
                            <Table.Cell>
                                bridge (
                                <Badge color="amber">
                                    {network.spec!.bridge?.name}
                                </Badge>
                                )
                            </Table.Cell>
                            <Table.Cell>
                                <Badge color="plum">
                                    {network.spec!.ipv6 ? "yes" : "no"}
                                </Badge>
                            </Table.Cell>
                        </Table.Row>
                    );
                })}
            </Table.Body>
        </Table.Root>
    );
};

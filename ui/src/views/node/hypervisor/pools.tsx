import { Resource, ResourceKind } from "../../../types/resource";
import { Node } from "../../../types/node";
import { Pool } from "../../../types/pool";
import { useMutation, useQuery } from "@tanstack/react-query";
import { list } from "../../../data/queries/list";
import { Badge, Button, Table } from "@radix-ui/themes";
import { convert, Units } from "../../../utils/conversion";
import { useNavigate } from "react-router";
import { del } from "../../../data/mutations/delete";

interface Props {
    node: Resource<Node>;
}

export const PoolsView: React.FC<Props> = ({ node }) => {
    const navigate = useNavigate();

    const {
        isError,
        isLoading,
        data: pools,
    } = useQuery({
        queryKey: [ResourceKind.Node, node.id, ResourceKind.StoragePool],
        queryFn: () =>
            list<Pool>(ResourceKind.StoragePool, node.id, ResourceKind.Node),
    });

    const { mutate: deleteMutation } = useMutation({
        mutationFn: del,
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
                    <Table.ColumnHeaderCell>Usage</Table.ColumnHeaderCell>
                    <Table.ColumnHeaderCell>Backend</Table.ColumnHeaderCell>
                    <Table.ColumnHeaderCell>
                        <Button
                            variant="soft"
                            style={{ width: "70%" }}
                            size="1"
                        >
                            Add
                        </Button>
                    </Table.ColumnHeaderCell>
                </Table.Row>
            </Table.Header>

            <Table.Body>
                {pools?.list?.map((pool) => {
                    let default_ = "no";

                    if (
                        pool.annotations &&
                        pool.annotations["rockferry.default"] == "yes"
                    ) {
                        default_ = "yes";
                    }

                    const capacity_gb = Math.round(
                        convert(
                            pool.spec!.capacity,
                            Units.Bytes,
                            Units.Gigabyte,
                        ),
                    );
                    const allocated_gb = Math.round(
                        convert(
                            pool.spec!.allocation,
                            Units.Bytes,
                            Units.Gigabyte,
                        ),
                    );

                    return (
                        <Table.Row
                            key={pool.id}
                            onClick={() => {
                                navigate(
                                    `/${ResourceKind.StoragePool}/${pool.id}`,
                                );
                            }}
                        >
                            <Table.RowHeaderCell>
                                {pool.spec!.name}
                            </Table.RowHeaderCell>
                            <Table.Cell>{default_}</Table.Cell>
                            <Table.Cell>
                                <Badge color="green">{allocated_gb} Gb</Badge>/
                                <Badge color="purple">{capacity_gb} Gb</Badge>
                            </Table.Cell>
                            <Table.Cell>
                                <Badge color="amber">{pool.spec!.type}</Badge>
                            </Table.Cell>
                            <Table.Cell>
                                <Button
                                    color="red"
                                    variant="soft"
                                    style={{ width: "70%" }}
                                    size="1"
                                    onClick={() => {
                                        // TODO: This is a little buggy. Since it will navigate
                                        //       you to the pool view.
                                        deleteMutation({
                                            kind: pool.kind,
                                            id: pool.id,
                                        });
                                    }}
                                >
                                    Delete
                                </Button>
                            </Table.Cell>
                        </Table.Row>
                    );
                })}
            </Table.Body>
        </Table.Root>
    );
};

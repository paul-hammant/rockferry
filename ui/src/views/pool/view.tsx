import { Badge, Box, Button, Separator, Table, Text } from "@radix-ui/themes";
import { useQuery } from "@tanstack/react-query";
import { useParams } from "react-router";
import { convert, Units } from "../../utils/conversion";
import { Resource, ResourceKind } from "../../types/resource";
import { list } from "../../data/queries/list";
import { Pool } from "../../types/pool";
import { get } from "../../data/queries/get";
import { useNavigate } from "react-router";
import { Node } from "../../types/node";
import { Volume } from "../../types/volume";
import { Card } from "@radix-ui/themes/src/index.js";

const Title: React.FC<{ pool: Resource<Pool> }> = ({ pool }) => {
    const navigate = useNavigate();

    const node = useQuery({
        queryKey: ["nodes", pool.owner?.id],
        queryFn: () => get<Node>(pool.owner!.id!, pool.owner!.kind!),
    });

    if (node.isError) {
        console.log(node.error);
        return <p>error</p>;
    }

    if (node.isLoading) {
        return <p>loading</p>;
    }

    return (
        <Box>
            <Text
                className="hover:cursor-pointer"
                color="purple"
                onClick={() => navigate(`/nodes/${node.data!.id}`)}
            >
                <Text size="6">{node.data?.spec?.hostname}</Text>
            </Text>
            <Text size="5" mr="1" ml="1">
                /
            </Text>
            <Text size="6">{pool.spec?.name}</Text>
        </Box>
    );
};

export const PoolView: React.FC<unknown> = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();

    const pool = useQuery({
        queryKey: ["pools", id],
        queryFn: () => get<Pool>(id!, ResourceKind.StoragePool),
    });

    const volumes = useQuery({
        queryKey: [id, `volumes`],
        queryFn: () =>
            list<Volume>(
                ResourceKind.StorageVolume,
                id!,
                ResourceKind.StoragePool,
            ),
    });

    if (volumes.isError || pool.isError) {
        console.log(volumes.error, pool.error);
        return <p>error</p>;
    }

    if (pool.isLoading || volumes.isLoading) {
        return <p>loading</p>;
    }

    return (
        <Box p="9" width="100%">
            <Title pool={pool.data!} />
            <Box width="100%" pt="2">
                <Separator size="4" />
            </Box>
            <Box pt="3">
                <Button
                    variant="soft"
                    color="purple"
                    onClick={() =>
                        navigate(`/pools/${pool.data!.id!}/create-volume`)
                    }
                >
                    Create
                </Button>
                <Button
                    ml="3"
                    variant="soft"
                    color="purple"
                    onClick={() =>
                        navigate(`/pools/${pool.data!.id!}/upload-volume`)
                    }
                >
                    Upload
                </Button>
            </Box>
            <Card mt="3">
                <Table.Root layout="auto">
                    <Table.Header>
                        <Table.Row>
                            <Table.ColumnHeaderCell>
                                Name
                            </Table.ColumnHeaderCell>
                            <Table.ColumnHeaderCell>Key</Table.ColumnHeaderCell>
                            <Table.ColumnHeaderCell>
                                Virtual Machine
                            </Table.ColumnHeaderCell>
                            <Table.ColumnHeaderCell>
                                Usage
                            </Table.ColumnHeaderCell>
                            <Table.ColumnHeaderCell>
                                Phase
                            </Table.ColumnHeaderCell>
                        </Table.Row>
                    </Table.Header>

                    <Table.Body>
                        {volumes.data?.list?.map((resource) => {
                            const volume = resource.spec!;

                            const vm_name = resource.annotations!["vm.name"];

                            const capacity_gb = Math.round(
                                convert(
                                    volume.capacity,
                                    Units.Bytes,
                                    Units.Gigabyte,
                                ),
                            );

                            const allocated_gb = Math.round(
                                convert(
                                    volume.allocation,
                                    Units.Bytes,
                                    Units.Gigabyte,
                                ),
                            );

                            return (
                                <Table.Row key={resource.id}>
                                    <Table.RowHeaderCell>
                                        {volume.name}
                                    </Table.RowHeaderCell>
                                    <Table.Cell>{volume.key}</Table.Cell>
                                    <Table.Cell>
                                        {vm_name ? (
                                            <Badge color="purple">
                                                {vm_name}
                                            </Badge>
                                        ) : (
                                            <Badge color="red">
                                                unassigned
                                            </Badge>
                                        )}
                                    </Table.Cell>
                                    <Table.Cell>
                                        <Badge color="green">
                                            {allocated_gb} Gb
                                        </Badge>
                                        /
                                        <Badge color="purple">
                                            {capacity_gb} Gb
                                        </Badge>
                                    </Table.Cell>
                                    <Table.Cell>
                                        <Badge color="amber">
                                            {resource.status.phase}
                                        </Badge>
                                    </Table.Cell>
                                </Table.Row>
                            );
                        })}
                    </Table.Body>
                </Table.Root>
            </Card>
        </Box>
    );
};

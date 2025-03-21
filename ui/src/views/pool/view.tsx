import { Badge, Box, IconButton, Separator, Table } from "@radix-ui/themes";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useParams } from "react-router";
import { convert, Units } from "../../utils/conversion";
import { ResourceKind } from "../../types/resource";
import { list } from "../../data/queries/list";
import { Pool } from "../../types/pool";
import { get } from "../../data/queries/get";
import { Volume } from "../../types/volume";
import { Card } from "@radix-ui/themes/src/index.js";
import { checkVolumeAllocationStatus } from "../../utils/allocationstatus";
import { ActionRow } from "./actionrow";
import { TrashIcon } from "@radix-ui/react-icons";
import { del } from "../../data/mutations/delete";
import { Breadcrumbs } from "../../components/breadcrumbs";

export const PoolView: React.FC<unknown> = () => {
    const { id } = useParams<{ id: string }>();

    const pool = useQuery({
        queryKey: [ResourceKind.StoragePool, id],
        queryFn: () => get<Pool>(id!, ResourceKind.StoragePool),
    });

    const volumes = useQuery({
        queryKey: [ResourceKind.StoragePool, id, ResourceKind.StorageVolume],
        queryFn: () =>
            list<Volume>(
                ResourceKind.StorageVolume,
                id!,
                ResourceKind.StoragePool,
            ),
    });

    const { mutate: deleteMutation } = useMutation({
        mutationFn: del,
    });

    if (volumes.isError || pool.isError) {
        console.log(volumes.error, pool.error);
        return <p>error</p>;
    }

    if (pool.isLoading || volumes.isLoading) {
        return <p>loading</p>;
    }

    let isDefault = false;

    if (
        pool.data!.annotations &&
        pool.data!.annotations["rockferry.default"] == "yes"
    ) {
        isDefault = true;
    }

    return (
        <Box p="9" width="100%">
            <Breadcrumbs res={pool.data!} />
            <Box width="100%" pt="2">
                <Separator size="4" />
            </Box>

            <ActionRow pool={pool.data!} />

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
                            <Table.ColumnHeaderCell />
                        </Table.Row>
                    </Table.Header>

                    <Table.Body>
                        {volumes.data?.list?.map((resource) => {
                            const volume = resource.spec!;

                            const vm_name =
                                resource.annotations!["machinereq.name"];

                            const capacity = Math.round(
                                convert(
                                    volume.capacity,
                                    Units.Bytes,
                                    Units.Gigabyte,
                                ),
                            );

                            const allocation = Math.round(
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
                                        <Badge
                                            color={
                                                checkVolumeAllocationStatus(
                                                    capacity,
                                                    allocation,
                                                ) as any
                                            }
                                        >
                                            {allocation} Gb
                                        </Badge>
                                        /
                                        <Badge color="purple">
                                            {capacity} Gb
                                        </Badge>
                                    </Table.Cell>
                                    <Table.Cell>
                                        <IconButton
                                            variant="soft"
                                            onClick={() => {
                                                deleteMutation({
                                                    id: resource.id,
                                                    kind: resource.kind,
                                                });
                                            }}
                                        >
                                            <TrashIcon />
                                        </IconButton>
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

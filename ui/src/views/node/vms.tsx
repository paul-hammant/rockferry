import { useQuery } from "@tanstack/react-query";
import { Badge, IconButton, Table } from "@radix-ui/themes";
import { list } from "../../data/queries/list";
import { useNavigate } from "react-router";
import { convert, Units } from "../../utils/conversion";
import { PlusIcon } from "@radix-ui/react-icons";
import { ResourceKind } from "../../types/resource";
import { Card } from "@radix-ui/themes/src/index.js";
import { Machine } from "../../types/machine";

interface Props {
    id: string;
}

// TODO: Add skeleton in table body for clean ui when loading

export const VmsView: React.FC<Props> = ({ id }) => {
    const navigate = useNavigate();

    const data = useQuery({
        queryKey: [id, `machines`],
        queryFn: () =>
            list<Machine>(ResourceKind.Machine, id, ResourceKind.Node),
    });

    if (data.isError) {
        console.log(data.error);
        return <p>error</p>;
    }

    return (
        <Card>
            <Table.Root layout="auto">
                <Table.Header>
                    <Table.Row>
                        <Table.ColumnHeaderCell>Status</Table.ColumnHeaderCell>
                        <Table.ColumnHeaderCell>Name</Table.ColumnHeaderCell>
                        <Table.ColumnHeaderCell>Cores</Table.ColumnHeaderCell>
                        <Table.ColumnHeaderCell>Memory</Table.ColumnHeaderCell>
                        <Table.ColumnHeaderCell>
                            Mac (network)
                        </Table.ColumnHeaderCell>
                        <Table.ColumnHeaderCell>
                            Interfaces
                        </Table.ColumnHeaderCell>
                        <Table.ColumnHeaderCell>Drives</Table.ColumnHeaderCell>
                        <Table.ColumnHeaderCell>
                            <IconButton
                                color="purple"
                                variant="soft"
                                size="1"
                                onClick={() =>
                                    navigate(`/nodes/${id}/create-vm`)
                                }
                            >
                                <PlusIcon />
                            </IconButton>
                        </Table.ColumnHeaderCell>
                    </Table.Row>
                </Table.Header>

                <Table.Body>
                    {data.data?.list?.map((resource) => {
                        const machine = resource.spec!;
                        const status = resource.status! as any;

                        console.log(status);

                        const memory = convert(
                            machine.topology.memory,
                            Units.Bytes,
                            Units.Gigabyte,
                        );

                        return (
                            <Table.Row
                                key={machine.uuid}
                                onClick={() => navigate(`/vm/${resource.id!}`)}
                            >
                                <Table.RowHeaderCell>
                                    <Badge color="green">{status.state}</Badge>
                                </Table.RowHeaderCell>
                                <Table.RowHeaderCell>
                                    {machine.name}
                                </Table.RowHeaderCell>
                                <Table.Cell>
                                    <Badge color="purple">
                                        {machine.topology.cores *
                                            machine.topology.threads}
                                    </Badge>
                                </Table.Cell>
                                <Table.Cell>
                                    <Badge color="purple">{memory} Gb</Badge>
                                </Table.Cell>
                                <Table.Cell>
                                    {machine.interfaces[0].mac} (
                                    <Badge color="amber">
                                        {machine.interfaces[0].network}
                                    </Badge>
                                    )
                                </Table.Cell>
                                <Table.Cell>
                                    <Badge color="amber">
                                        {machine.interfaces.length}
                                    </Badge>
                                </Table.Cell>
                                <Table.Cell>
                                    <Badge color="amber">
                                        {machine.disks.length}
                                    </Badge>
                                </Table.Cell>
                                <Table.Cell></Table.Cell>
                            </Table.Row>
                        );
                    })}
                </Table.Body>
            </Table.Root>
        </Card>
    );
};

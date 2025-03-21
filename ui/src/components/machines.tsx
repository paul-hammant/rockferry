import { Badge, Table } from "@radix-ui/themes";
import { Resource, ResourceKind } from "../types/resource";
import { Machine, MachineStatus } from "../types/machine";
import { useNavigate } from "react-router";
import { convert, Units } from "../utils/conversion";

interface Props {
    withRole?: boolean;
}

interface MachineRowProps {
    vm: Resource<Machine, MachineStatus>;
    role?: string;
}

export const MachinesHeader: React.FC<Props> = ({ withRole = false }) => {
    return (
        <>
            <Table.Header>
                <Table.Row>
                    {withRole ? (
                        <Table.ColumnHeaderCell>Role</Table.ColumnHeaderCell>
                    ) : undefined}
                    <Table.ColumnHeaderCell>Status</Table.ColumnHeaderCell>
                    <Table.ColumnHeaderCell>Name</Table.ColumnHeaderCell>
                    <Table.ColumnHeaderCell>Cores</Table.ColumnHeaderCell>
                    <Table.ColumnHeaderCell>Memory</Table.ColumnHeaderCell>
                    <Table.ColumnHeaderCell>
                        Mac (network)
                    </Table.ColumnHeaderCell>
                    <Table.ColumnHeaderCell>Interfaces</Table.ColumnHeaderCell>
                    <Table.ColumnHeaderCell>Drives</Table.ColumnHeaderCell>
                </Table.Row>
            </Table.Header>
        </>
    );
};

export const MachineRow: React.FC<MachineRowProps> = ({ vm, role }) => {
    const navigate = useNavigate();

    let status_badge = "red";
    if (vm.status.state == "running") {
        status_badge = "green";
    }

    const memory = convert(
        vm.spec!.topology.memory,
        Units.Bytes,
        Units.Gigabyte,
    );

    return (
        <Table.Row
            key={vm.id}
            onClick={() => navigate(`/${ResourceKind.Machine}/${vm.id!}`)}
        >
            {role != undefined ? (
                <Table.RowHeaderCell>
                    <Badge>{role}</Badge>
                </Table.RowHeaderCell>
            ) : undefined}

            <Table.RowHeaderCell>
                <Badge color={status_badge as any}>{vm.status.state}</Badge>
            </Table.RowHeaderCell>
            <Table.RowHeaderCell>{vm.spec!.name}</Table.RowHeaderCell>
            <Table.Cell>
                <Badge color="purple">
                    {vm.spec!.topology.cores * vm.spec!.topology.threads}
                </Badge>
            </Table.Cell>
            <Table.Cell>
                <Badge color="purple">{memory} Gb</Badge>
            </Table.Cell>
            <Table.Cell>
                {vm.spec!.interfaces[0].mac} (
                <Badge color="amber">{vm.spec!.interfaces[0].network}</Badge>)
            </Table.Cell>
            <Table.Cell>
                <Badge color="amber">{vm.spec!.interfaces.length}</Badge>
            </Table.Cell>
            <Table.Cell>
                <Badge color="amber">{vm.spec!.disks.length}</Badge>
            </Table.Cell>
        </Table.Row>
    );
};

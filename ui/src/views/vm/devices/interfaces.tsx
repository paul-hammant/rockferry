import { Badge, Button, Table } from "@radix-ui/themes";
import { Machine, MachineStatus } from "../../../types/machine";
import { Resource } from "../../../types/resource";

interface Props {
    vm: Resource<Machine, MachineStatus>;
}

export const InterfacesView: React.FC<Props> = ({ vm }) => {
    return (
        <Table.Root>
            <Table.Header>
                <Table.Row>
                    <Table.ColumnHeaderCell>Network</Table.ColumnHeaderCell>
                    <Table.ColumnHeaderCell>Mac</Table.ColumnHeaderCell>
                    <Table.ColumnHeaderCell>Model</Table.ColumnHeaderCell>
                    <Table.ColumnHeaderCell>
                        <Button variant="soft" size="1">
                            Add
                        </Button>
                    </Table.ColumnHeaderCell>
                </Table.Row>
            </Table.Header>

            <Table.Body>
                {vm.spec?.interfaces.map((iface) => {
                    return (
                        <Table.Row>
                            <Table.RowHeaderCell>
                                {iface.network} (
                                <Badge color="amber">{iface.bridge}</Badge>)
                            </Table.RowHeaderCell>
                            <Table.RowHeaderCell>
                                {iface.mac}
                            </Table.RowHeaderCell>
                            <Table.RowHeaderCell>
                                {iface.model}
                            </Table.RowHeaderCell>
                            <Table.Cell>
                                <Button variant="soft" color="red" size="1">
                                    Remove
                                </Button>
                            </Table.Cell>
                        </Table.Row>
                    );
                })}
            </Table.Body>
        </Table.Root>
    );
};

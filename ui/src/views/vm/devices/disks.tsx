import { Button, Table } from "@radix-ui/themes";
import { Machine, MachineStatus } from "../../../types/machine";
import { Resource } from "../../../types/resource";

interface Props {
    vm: Resource<Machine, MachineStatus>;
}

export const DisksView: React.FC<Props> = ({ vm }) => {
    return (
        <Table.Root>
            <Table.Header>
                <Table.Row>
                    <Table.ColumnHeaderCell>Id</Table.ColumnHeaderCell>
                    <Table.ColumnHeaderCell>Pool</Table.ColumnHeaderCell>
                    <Table.ColumnHeaderCell>Device</Table.ColumnHeaderCell>
                    <Table.ColumnHeaderCell>Type</Table.ColumnHeaderCell>
                    <Table.ColumnHeaderCell>
                        <Button variant="soft" size="1">
                            Add
                        </Button>
                    </Table.ColumnHeaderCell>
                </Table.Row>
            </Table.Header>

            <Table.Body>
                {vm.spec?.disks.map((disk) => {
                    if (disk.volume == "") return <></>;

                    return (
                        <Table.Row>
                            <Table.RowHeaderCell>
                                {disk.volume.split("/")[1]}
                            </Table.RowHeaderCell>
                            <Table.RowHeaderCell>
                                vm-fun-images
                            </Table.RowHeaderCell>
                            <Table.Cell>{disk.device}</Table.Cell>
                            <Table.Cell>{disk.type}</Table.Cell>
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

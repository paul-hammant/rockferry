import { PlusIcon } from "@radix-ui/react-icons";
import { IconButton, Table } from "@radix-ui/themes";

interface Props {
    onPlusClick: () => void;
}

export const MachinesHeader: React.FC<Props> = ({ onPlusClick }) => {
    return (
        <Table.Header>
            <Table.Row>
                <Table.ColumnHeaderCell>Status</Table.ColumnHeaderCell>
                <Table.ColumnHeaderCell>Name</Table.ColumnHeaderCell>
                <Table.ColumnHeaderCell>Cores</Table.ColumnHeaderCell>
                <Table.ColumnHeaderCell>Memory</Table.ColumnHeaderCell>
                <Table.ColumnHeaderCell>Mac (network)</Table.ColumnHeaderCell>
                <Table.ColumnHeaderCell>Interfaces</Table.ColumnHeaderCell>
                <Table.ColumnHeaderCell>Drives</Table.ColumnHeaderCell>
                <Table.ColumnHeaderCell>
                    <IconButton
                        color="purple"
                        variant="soft"
                        size="1"
                        onClick={() => onPlusClick()}
                    >
                        <PlusIcon />
                    </IconButton>
                </Table.ColumnHeaderCell>
            </Table.Row>
        </Table.Header>
    );
};

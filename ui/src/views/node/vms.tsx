import { useQuery } from "@tanstack/react-query";
import { Button, Card, Table } from "@radix-ui/themes";
import { list } from "../../data/queries/list";
import { useNavigate } from "react-router";
import { ResourceKind } from "../../types/resource";
import { Machine, MachineStatus } from "../../types/machine";
import { MachineRow, MachinesHeader } from "../../components/machines";

interface Props {
    id: string;
}

// TODO: Add skeleton in table body for clean ui when loading
export const VmsView: React.FC<Props> = ({ id }) => {
    const navigate = useNavigate();

    const data = useQuery({
        queryKey: [id, `machines`],
        queryFn: () =>
            list<Machine, MachineStatus>(
                ResourceKind.Machine,
                id,
                ResourceKind.Node,
            ),
    });

    if (data.isError) {
        console.log(data.error);
        return <p>error</p>;
    }

    return (
        <>
            <Button
                variant="soft"
                onClick={() => navigate(`/nodes/${id}/create-vm`)}
            >
                Create
            </Button>

            <Card mt="3">
                <Table.Root layout="auto">
                    <MachinesHeader />
                    <Table.Body>
                        {data.data?.list?.map((vm) => <MachineRow vm={vm} />)}
                    </Table.Body>
                </Table.Root>
            </Card>
        </>
    );
};

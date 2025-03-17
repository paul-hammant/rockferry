import { useQuery } from "@tanstack/react-query";
import { ResourceKind } from "../types/resource";
import { list } from "../data/queries/list";
import { Pool } from "../types/pool";
import { Box, Select } from "@radix-ui/themes";

export const PoolSelect: React.FC<{
    nodeId: string;
    onChange: (value: string) => void;
}> = ({ nodeId, onChange }) => {
    const data = useQuery({
        queryKey: [ResourceKind.Node, nodeId, ResourceKind.StoragePool],
        queryFn: () =>
            list<Pool>(ResourceKind.StoragePool, nodeId, ResourceKind.Node),
    });

    if (data.isError) {
        console.log(data.error);
        return <p>error</p>;
    }

    return (
        <Box width="100%">
            <Select.Root onValueChange={onChange}>
                <Box width="100%">
                    <Select.Trigger
                        placeholder="Image pool"
                        style={{ width: "100%" }}
                    ></Select.Trigger>
                </Box>
                <Select.Content>
                    <Select.Group>
                        <Select.Label>Pools</Select.Label>
                        {data?.data?.list?.map((resource) => {
                            const pool = resource!.spec;

                            return (
                                <Select.Item
                                    value={resource.id!}
                                    key={resource.id!}
                                >
                                    {pool?.name}
                                </Select.Item>
                            );
                        })}
                    </Select.Group>
                </Select.Content>
            </Select.Root>
        </Box>
    );
};

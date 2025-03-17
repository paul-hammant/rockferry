import { Box, Button, Flex } from "@radix-ui/themes";
import { Pool } from "../../types/pool";
import { Resource, ResourceKind } from "../../types/resource";
import { useNavigate } from "react-router";
import { MakeDefault } from "./make-default";
import { useMutation, useQuery } from "@tanstack/react-query";
import { list } from "../../data/queries/list";
import { Volume } from "../../types/volume";
import { del } from "../../data/mutations/delete";

interface Props {
    pool: Resource<Pool>;
}

export const DeleteUnassigned: React.FC<Props> = ({ pool }) => {
    const {
        data: volumes,
        isError,
        isLoading,
    } = useQuery({
        queryKey: [
            ResourceKind.StoragePool,
            pool.id,
            ResourceKind.StorageVolume,
        ],
        queryFn: () =>
            list<Volume>(
                ResourceKind.StorageVolume,
                pool.id!,
                ResourceKind.StoragePool,
            ),
    });

    const { mutate } = useMutation({ mutationFn: del });

    if (isError) {
        return <p>error</p>;
    }

    if (isLoading) {
        return <p>loading</p>;
    }

    return (
        <Button
            variant="soft"
            onClick={() => {
                volumes?.list?.forEach((volume) => {
                    if (
                        volume.annotations!["machinereq.id"] &&
                        volume.annotations!["machinereq.id"] != ""
                    ) {
                        return;
                    }

                    mutate({
                        kind: volume.kind,
                        id: volume.id,
                    });
                });
            }}
        >
            Delete Unassigned
        </Button>
    );
};

export const ActionRow: React.FC<Props> = ({ pool }) => {
    const navigate = useNavigate();

    let isDefault = false;

    if (pool.annotations && pool.annotations["rockferry.default"] == "yes") {
        isDefault = true;
    }

    return (
        <Box pt="3">
            <Flex dir="row" justify="between">
                <Box>
                    <Button
                        variant="soft"
                        color="purple"
                        onClick={() =>
                            navigate(`/pools/${pool.id!}/create-volume`)
                        }
                    >
                        Create
                    </Button>
                    <Button
                        ml="3"
                        variant="soft"
                        color="purple"
                        onClick={() =>
                            navigate(`/pools/${pool.id!}/upload-volume`)
                        }
                    >
                        Upload
                    </Button>
                    <MakeDefault isDefault={isDefault} pool={pool} />
                </Box>
                <Box>
                    <DeleteUnassigned pool={pool} />
                </Box>
            </Flex>
        </Box>
    );
};

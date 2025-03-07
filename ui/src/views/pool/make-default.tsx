import { Button, Skeleton } from "@radix-ui/themes";
import { Pool } from "../../types/pool";
import { Resource, ResourceKind } from "../../types/resource";
import { useMutation, useQuery } from "@tanstack/react-query";
import { patch } from "../../data/mutations/patch";
import * as jsonpatch from "fast-json-patch";
import { list } from "../../data/queries/list";

interface Props {
    pool: Resource<Pool>;
    isDefault: boolean;
}

export const MakeDefault: React.FC<Props> = ({ pool, isDefault }) => {
    const { mutate } = useMutation({ mutationFn: patch });

    const { data, isError, isLoading } = useQuery({
        queryKey: [pool.owner!.id, "pools"],
        queryFn: () =>
            list<Resource<Pool>>(
                ResourceKind.StoragePool,
                pool.owner?.id,
                pool.owner?.kind,
            ),
    });

    if (isLoading) {
        return <Skeleton />;
    }

    if (isError) {
        return <div>error...</div>;
    }

    const disableAll = () => {
        data?.list.map((pool) => {
            const observer = jsonpatch.observe<Resource<Pool>>(pool);
            pool.annotations = {
                "rockferry.default": "no",
            };
            const patches = jsonpatch.generate(observer);

            mutate({
                id: pool.id,
                kind: pool.kind,
                patches,
            });
        });
    };

    return (
        <Button
            ml="3"
            variant="soft"
            color="purple"
            disabled={isDefault}
            onClick={() => {
                disableAll();

                const observer = jsonpatch.observe<Resource<Pool>>(pool);
                pool.annotations = {
                    "rockferry.default": "yes",
                };
                const patches = jsonpatch.generate(observer);

                mutate({
                    id: pool.id,
                    kind: pool.kind,
                    patches,
                });
            }}
        >
            Make default
        </Button>
    );
};

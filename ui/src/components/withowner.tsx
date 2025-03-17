import { useQuery } from "@tanstack/react-query";
import { Resource, Status } from "../types/resource";
import { get } from "../data/queries/get";

interface WithOwnerProps<S, T = Status> {
    res: Resource<any, any>;
    children: (props: { owner: Resource<S, T> }) => React.ReactNode;
}

export const WithOwner = <S, T = Status>({
    res,
    children,
}: WithOwnerProps<S, T>) => {
    const ownerId = res.owner?.id;

    const {
        data: owner,
        isError,
        isLoading,
    } = useQuery({
        queryKey: ownerId ? [res.owner!.kind, ownerId] : [],
        queryFn: () =>
            ownerId
                ? get<S, T>(ownerId, res.owner!.kind)
                : Promise.reject("No owner ID"),
        enabled: !!ownerId, // Prevents the query from running if ownerId is undefined
    });

    if (isError) return <div>Error loading owner</div>;
    if (isLoading) return <div>Loading...</div>;
    if (!owner) return null; // Safety check

    return <>{children({ owner })}</>;
};

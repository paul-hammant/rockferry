import { List } from "..";
import { Resource, ResourceKind } from "../../types/resource";

export const get = async <T>(
    id: string,
    kind: ResourceKind,
    owner_id: string | undefined = undefined,
    owner_kind: ResourceKind | undefined = undefined,
): Promise<Resource<T>> => {
    const params = new URLSearchParams();

    params.append("id", id);
    params.append("kind", kind);

    if (owner_id && owner_kind) {
        params.append("owner_id", owner_id);
        params.append("owner_kind", owner_kind);
    }

    const resources: List<Resource<T>> = await fetch(
        `http://10.100.102:8080/v1/resources?${params.toString()}`,
        {},
    ).then((res) => res.json());

    return resources.list[0];
};

import { List } from "..";
import { Resource, ResourceKind, Status } from "../../types/resource";

export const get = async <T, S = Status>(
    id: string,
    kind: ResourceKind,
    owner_id: string | undefined = undefined,
    owner_kind: ResourceKind | undefined = undefined,
): Promise<Resource<T, S>> => {
    const params = new URLSearchParams();

    params.append("id", id);
    params.append("kind", kind);

    if (owner_id && owner_kind) {
        params.append("owner_id", owner_id);
        params.append("owner_kind", owner_kind);
    }

    const resources: List<Resource<T, S>> = await fetch(
        `http://10.100.0.186:8080/v1/resources?${params.toString()}`,
        {},
    ).then((res) => res.json());

    return resources.list[0];
};

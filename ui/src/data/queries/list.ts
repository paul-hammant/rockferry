import { Resource, ResourceKind } from "../../types/resource";
import { List } from "../index";

export const list = async <T>(
    kind: ResourceKind,
    owner_id: string | undefined = undefined,
    owner_kind: ResourceKind | undefined = undefined,
): Promise<List<Resource<T>>> => {
    const params = new URLSearchParams();

    params.append("kind", kind);

    if (owner_id && owner_kind) {
        params.append("owner_id", owner_id);
        params.append("owner_kind", owner_kind);
    }
    return fetch(
        `http://10.100.102:8080/v1/resources?${params.toString()}`,
    ).then((res) => res.json());
};

import { Resource, ResourceKind, Status } from "../../types/resource";
import { List } from "../index";

export const list = async <T, S = Status>(
    kind: ResourceKind,
    owner_id: string | undefined = undefined,
    owner_kind: ResourceKind | undefined = undefined,
): Promise<List<Resource<T, S>>> => {
    const params = new URLSearchParams();

    params.append("kind", kind);

    if (owner_id && owner_kind) {
        params.append("owner_id", owner_id);
        params.append("owner_kind", owner_kind);
    }
    return fetch(
        `http://10.100.0.186:8080/v1/resources?${params.toString()}`,
    ).then((res) => res.json());
};

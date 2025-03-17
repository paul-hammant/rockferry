import { List } from "..";
import { CONFIG } from "../../config";
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
        `${CONFIG.api_url}/v1/resources?${params.toString()}`,
        {},
    ).then((res) => res.json());

    if (resources.list!.length <= 0) {
        console.log("wtf no matches");
    }

    return resources.list![0];
};

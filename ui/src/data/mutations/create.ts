import { CONFIG } from "../../config";
import { CreateResourceInput } from "../../types/resource";

export interface Response {
    ok: boolean;
}

export const create = async <S>(
    input: CreateResourceInput<S>,
): Promise<Response> => {
    return fetch(`${CONFIG.api_url}/v1/resources`, {
        method: "POST",
        body: JSON.stringify(input),
        headers: {
            "Content-Type": "application/json",
        },
    }).then((res) => res.json());
};

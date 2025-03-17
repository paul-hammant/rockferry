import { CONFIG } from "../../config";
import { PatchResourceInput } from "../../types/resource";

export interface Response {
    ok: boolean;
}

export const patch = async (input: PatchResourceInput): Promise<Response> => {
    return fetch(`${CONFIG.api_url}/v1/resources`, {
        method: "PATCH",
        body: JSON.stringify(input),
        headers: {
            "Content-Type": "application/json",
        },
    }).then((res) => res.json());
};

import { CONFIG } from "../../config";
import { DeleteResourceInput } from "../../types/resource";

export const del = async (input: DeleteResourceInput): Promise<Response> => {
    return fetch(`${CONFIG.api_url}/v1/resources`, {
        method: "DELETE",
        body: JSON.stringify(input),
        headers: {
            "Content-Type": "application/json",
        },
    }).then((res) => res.json());
};

import { PatchResourceInput } from "../../types/resource";

export interface Response {
    ok: boolean;
}

export const patch = async (input: PatchResourceInput): Promise<Response> => {
    return fetch("http://10.100.0.186:8080/v1/resources", {
        method: "PATCH",
        body: JSON.stringify(input),
        headers: {
            "Content-Type": "application/json",
        },
    }).then((res) => res.json());
};

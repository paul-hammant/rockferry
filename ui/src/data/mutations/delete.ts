import { DeleteResourceInput } from "../../types/resource";

export const del = async (input: DeleteResourceInput): Promise<Response> => {
    return fetch("http://10.100.0.186:8080/v1/resources", {
        method: "DELETE",
        body: JSON.stringify(input),
        headers: {
            "Content-Type": "application/json",
        },
    }).then((res) => res.json());
};

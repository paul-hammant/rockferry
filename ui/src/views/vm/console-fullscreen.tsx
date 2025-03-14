import { useParams } from "react-router";
import { VncConsole } from "./vnc-console";
import { useQuery } from "@tanstack/react-query";
import { get } from "../../data/queries/get";
import { Machine, MachineStatus } from "../../types/machine";
import { ResourceKind } from "../../types/resource";

export const ConsoleFullscreen: React.FC<unknown> = () => {
    const { id } = useParams<{ id: string }>();

    const {
        data: vm,
        isError,
        isLoading,
    } = useQuery({
        queryKey: ["machines", id],
        queryFn: () => get<Machine, MachineStatus>(id!, ResourceKind.Machine),
    });

    if (isError) {
        return <div>error</div>;
    }

    if (isLoading) {
        return <div>loading..</div>;
    }

    return <VncConsole vm={vm!} />;
};

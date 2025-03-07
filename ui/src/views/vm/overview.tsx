import { useNavigate, useParams } from "react-router";
import {
    PatchResourceInput,
    Resource,
    ResourceKind,
} from "../../types/resource";
import { Machine, MachineStatus } from "../../types/machine";
import { Node } from "../../types/node";
import {
    UseMutateFunction,
    useMutation,
    useQuery,
} from "@tanstack/react-query";
import { get } from "../../data/queries/get";
import {
    Box,
    Card,
    Grid,
    Tabs,
    Text,
    DataList,
    Badge,
    Flex,
    Code,
    IconButton,
    Separator,
} from "@radix-ui/themes";
import { CopyIcon } from "@radix-ui/react-icons";
import { convert, Units } from "../../utils/conversion";
import { VncConsole } from "./vnc-console";
import { Button } from "@radix-ui/themes/src/index.js";
import { useTabState } from "../../hooks/tabstate";
import { Devices } from "./devices";
import * as jsonpatch from "fast-json-patch";
import { patch } from "../../data/mutations/patch";
import { ToastContainer, toast } from "react-toastify";
import { StateToast } from "./notification";

// TODO: react-toastify sucks ass

const startVm = (
    vm: Resource<Machine, MachineStatus>,
    mutate: UseMutateFunction<Response, Error, PatchResourceInput, unknown>,
) => {
    const observer = jsonpatch.observe<Resource<Machine, MachineStatus>>(vm);
    vm.status.state = "booting";
    const patches = jsonpatch.generate(observer);
    mutate(
        { id: vm.id, kind: vm.kind, patches },
        {
            onSuccess: () => {
                toast.success(StateToast, {
                    data: {
                        content: `starting: ${vm.spec!.name}`,
                    },
                    className: "border-2 border-green-400",
                    icon: false,
                    autoClose: 1500,
                    hideProgressBar: true,
                    closeButton: true,
                    closeOnClick: true,
                    theme: "dark",
                });
            },
        },
    );
};

const shutdownVm = (
    vm: Resource<Machine, MachineStatus>,
    mutate: UseMutateFunction<Response, Error, PatchResourceInput, unknown>,
) => {
    const observer = jsonpatch.observe<Resource<Machine, MachineStatus>>(vm);
    vm.status.state = "stopped";
    const patches = jsonpatch.generate(observer);
    mutate(
        { id: vm.id, kind: vm.kind, patches },
        {
            onSuccess: () => {
                toast.success(StateToast, {
                    data: {
                        content: `shutdown: ${vm.spec!.name}`,
                    },
                    className: "border-2 border-red-400",
                    icon: false,
                    autoClose: 1500,
                    hideProgressBar: true,
                    closeButton: true,
                    closeOnClick: true,
                    theme: "dark",
                });
            },
        },
    );
};

const Title: React.FC<{
    vm: Resource<Machine, MachineStatus>;
    node: Resource<Node>;
}> = ({ vm, node }) => {
    const navigate = useNavigate();

    return (
        <Box>
            <Text
                className="hover:cursor-pointer"
                color="purple"
                onClick={() => navigate(`/nodes/${node.id}?tab=vms`)}
            >
                <Text size="6">{node.spec?.hostname}</Text>
            </Text>
            <Text size="5" mr="1" ml="1">
                /
            </Text>
            <Text size="6">{vm.spec?.name}</Text>
        </Box>
    );
};

const VmMetadata: React.FC<{ vm: Resource<Machine, MachineStatus> }> = ({
    vm,
}) => {
    const { mutate } = useMutation({
        mutationKey: ["machine", vm.id],
        mutationFn: patch,
    });

    return (
        <Card>
            <DataList.Root>
                <DataList.Item>
                    <DataList.Label minWidth="120px">Name</DataList.Label>
                    <DataList.Value>{vm.spec?.name}</DataList.Value>
                </DataList.Item>
                <DataList.Item align="center">
                    <DataList.Label minWidth="120px">Status</DataList.Label>
                    <DataList.Value>
                        <Badge color="jade" variant="soft">
                            {vm.status.state}
                        </Badge>
                    </DataList.Value>
                </DataList.Item>
                <DataList.Item>
                    <DataList.Label minWidth="120px">ID</DataList.Label>
                    <DataList.Value>
                        <Flex align="center" gap="2">
                            <Code variant="ghost">{vm.id}</Code>
                            <IconButton
                                size="1"
                                aria-label="Copy value"
                                color="gray"
                                variant="ghost"
                            >
                                <CopyIcon />
                            </IconButton>
                        </Flex>
                    </DataList.Value>
                </DataList.Item>
            </DataList.Root>
            <Separator size="4" mt="3" mb="3" />
            <DataList.Root>
                <DataList.Item>
                    <DataList.Label minWidth="120px">Cores</DataList.Label>
                    <DataList.Value>{vm.spec?.topology.cores}</DataList.Value>
                </DataList.Item>
                <DataList.Item>
                    <DataList.Label minWidth="120px">Threads</DataList.Label>
                    <DataList.Value>{vm.spec?.topology.threads}</DataList.Value>
                </DataList.Item>
                <DataList.Item>
                    <DataList.Label minWidth="120px">Sockets</DataList.Label>
                    <DataList.Value>{vm.spec?.topology.sockets}</DataList.Value>
                </DataList.Item>
                <DataList.Item>
                    <DataList.Label minWidth="120px">Memory</DataList.Label>
                    <DataList.Value>
                        <Badge color="green">
                            {convert(
                                vm.spec!.topology.memory!,
                                Units.Bytes,
                                Units.Gigabyte,
                            )}{" "}
                            Gb
                        </Badge>
                    </DataList.Value>
                </DataList.Item>
            </DataList.Root>
            <Separator size="4" mt="3" mb="3" />

            {vm.status.state === "stopped" ? (
                <Flex mt="3" gap="3">
                    <Button
                        color="purple"
                        variant="soft"
                        onClick={() => startVm(vm, mutate)}
                    >
                        Start
                    </Button>
                </Flex>
            ) : (
                <Flex mt="3" gap="3">
                    <Button color="red" variant="soft">
                        Reboot
                    </Button>
                    <Button
                        color="red"
                        variant="soft"
                        onClick={() => shutdownVm(vm, mutate)}
                    >
                        Shutdown
                    </Button>
                    <Button color="red" variant="soft">
                        Stop
                    </Button>
                </Flex>
            )}
        </Card>
    );
};

const VmTabs: React.FC<{
    vm: Resource<Machine, MachineStatus>;
}> = ({ vm }) => {
    const {
        data: node,
        isLoading,
        isError,
    } = useQuery({
        queryKey: ["nodes", vm.owner?.id],
        queryFn: () => get<Node>(vm.owner!.id!, ResourceKind.Node),
    });

    const [tab, setTab] = useTabState("overview");

    if (isLoading) {
        return <div>loading..</div>;
    }

    if (isError) {
        return <div>error...</div>;
    }

    return (
        <Box p="9" width="100%">
            <Title vm={vm} node={node!} />
            <Box pt="3">
                <Tabs.Root defaultValue={tab}>
                    <Tabs.List>
                        <Tabs.Trigger
                            value="overview"
                            onClick={() => setTab("overview")}
                        >
                            Overview
                        </Tabs.Trigger>
                        <Tabs.Trigger
                            value="devices"
                            onClick={() => setTab("devices")}
                        >
                            Devices
                        </Tabs.Trigger>
                    </Tabs.List>

                    <Box pt="3">
                        <Tabs.Content value="overview">
                            <Grid columns="3" gap="4">
                                <Box gridColumn="1/3">
                                    <Card size="2">
                                        {vm.status.state != "running" ? (
                                            <Text color="red">
                                                Virtual Machine must be running
                                                for VNC console to work.
                                            </Text>
                                        ) : (
                                            <VncConsole vm={vm} node={node!} />
                                        )}
                                    </Card>
                                </Box>
                                <Box gridColumnStart="3">
                                    <VmMetadata vm={vm} />
                                </Box>
                            </Grid>
                        </Tabs.Content>

                        <Tabs.Content value="devices">
                            <Devices vm={vm} />
                        </Tabs.Content>
                    </Box>
                </Tabs.Root>
            </Box>
        </Box>
    );
};

export const VmOverview: React.FC<unknown> = () => {
    const { id } = useParams<{ id: string }>();

    const vm = useQuery({
        queryKey: ["machines", id],
        queryFn: () => get<Machine, MachineStatus>(id!, ResourceKind.Machine),
    });

    if (vm.isError) {
        return <div>error</div>;
    }

    if (vm.isLoading) {
        return <div>loading..</div>;
    }

    return (
        <>
            <VmTabs vm={vm.data!} />
            <ToastContainer position="bottom-right" />
        </>
    );
};

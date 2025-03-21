import {
    Badge,
    Box,
    Card,
    Code,
    DataList,
    Flex,
    Grid,
    IconButton,
    Separator,
    Tabs,
    Text,
} from "@radix-ui/themes";
import { useParams } from "react-router";
import { VmsView } from "./vms";
import { get } from "../../data/queries/get";
import { useQuery } from "@tanstack/react-query";
import { Node } from "../../types/node";
import { Resource, ResourceKind } from "../../types/resource";
import { CopyIcon } from "@radix-ui/react-icons";
import { convert, Units } from "../../utils/conversion";
import { getUptime } from "../../utils/uptime";
import { useTabState } from "../../hooks/tabstate";
import { HypervisorTab } from "./hypervisor";
import { Machine, MachineStatus } from "../../types/machine";
import { list } from "../../data/queries/list";
import { Breadcrumbs } from "../../components/breadcrumbs";

const NodeMetadata: React.FC<{ node: Resource<Node> }> = ({ node }) => {
    const now = new Date();
    const lastReboot = new Date(now.getTime() - node.spec!.uptime * 1000);

    return (
        <Card>
            <DataList.Root>
                <DataList.Item align="center">
                    <DataList.Label minWidth="88px">Status</DataList.Label>
                    <DataList.Value>
                        <Badge color="jade" variant="soft">
                            Connected
                        </Badge>
                    </DataList.Value>
                </DataList.Item>
                <DataList.Item>
                    <DataList.Label minWidth="88px">ID</DataList.Label>
                    <DataList.Value>
                        <Flex align="center" gap="2">
                            <Code variant="ghost">{node.id}</Code>
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
                    <DataList.Item>
                        <DataList.Label minWidth="88px">Kernel</DataList.Label>
                        <DataList.Value>{node.spec!.kernel}</DataList.Value>
                    </DataList.Item>
                </DataList.Item>
            </DataList.Root>
            <Separator size="4" mt="3" mb="3" />
            <DataList.Root>
                <DataList.Item>
                    <DataList.Label minWidth="88px">Cores</DataList.Label>
                    <DataList.Value>{node.spec!.topology.cores}</DataList.Value>
                </DataList.Item>
                <DataList.Item>
                    <DataList.Label minWidth="88px">Threads</DataList.Label>
                    <DataList.Value>
                        {node.spec!.topology.threads}
                    </DataList.Value>
                </DataList.Item>
                <DataList.Item>
                    <DataList.Label minWidth="88px">Sockets</DataList.Label>
                    <DataList.Value>
                        {node.spec!.topology.sockets}
                    </DataList.Value>
                </DataList.Item>
                <DataList.Item>
                    <DataList.Label minWidth="88px">Memory</DataList.Label>
                    <DataList.Value>
                        <Badge color="green">
                            {Math.round(
                                convert(
                                    node.spec!.topology.memory!,
                                    Units.Bytes,
                                    Units.Gigabyte,
                                ),
                            )}{" "}
                            Gb
                        </Badge>
                    </DataList.Value>
                </DataList.Item>
            </DataList.Root>
            <Separator size="4" mt="3" mb="3" />
            <DataList.Root>
                <DataList.Item>
                    <DataList.Label minWidth="88px">Last reboot</DataList.Label>
                    <DataList.Value>
                        <Text color="purple">
                            {lastReboot.toLocaleTimeString()}{" "}
                            {lastReboot.toLocaleDateString()}
                        </Text>
                    </DataList.Value>
                    <DataList.Label minWidth="88px">Uptime</DataList.Label>
                    <DataList.Value>
                        <Text color="purple">
                            {getUptime(node.spec!.uptime!)}
                        </Text>
                    </DataList.Value>
                </DataList.Item>
            </DataList.Root>
        </Card>
    );
};

export const NodeView: React.FC<unknown> = () => {
    const { id } = useParams<{ id: string }>();
    const data = useQuery({
        queryKey: [ResourceKind.Node, id],
        queryFn: () => get<Node>(id!, ResourceKind.Node),
    });

    const [tab, setTab] = useTabState("overview");

    if (data.isLoading && !data.isError) {
        return <Text>Loading...</Text>;
    }

    return (
        <Box p="9">
            <Breadcrumbs res={data.data!} />
            <Box pt="3">
                <Tabs.Root defaultValue={tab}>
                    <Tabs.List>
                        <Tabs.Trigger
                            value="overview"
                            onClick={() => setTab("overview")}
                        >
                            Overview
                        </Tabs.Trigger>
                        <Tabs.Trigger value="vms" onClick={() => setTab("vms")}>
                            Virtual Machines
                        </Tabs.Trigger>
                        <Tabs.Trigger
                            value="hypervisor"
                            onClick={() => setTab("hypervisor")}
                        >
                            Hypervisor
                        </Tabs.Trigger>
                    </Tabs.List>

                    <Box pt="3">
                        <Tabs.Content value="overview">
                            <Grid columns="3" gap="4">
                                <Box gridColumn="1/3">
                                    <MainArea node={data.data!} />
                                </Box>
                                <Box gridColumnStart="3">
                                    <NodeMetadata node={data.data!} />
                                </Box>
                            </Grid>
                        </Tabs.Content>

                        <Tabs.Content value="vms">
                            <VmsView id={id!} />
                        </Tabs.Content>

                        <Tabs.Content value="hypervisor">
                            <HypervisorTab node={data.data!} />
                        </Tabs.Content>
                    </Box>
                </Tabs.Root>
            </Box>
        </Box>
    );
};

const MainArea: React.FC<{ node: Resource<Node> }> = ({ node }) => {
    const {
        data: vms,
        isError,
        isLoading,
    } = useQuery({
        queryKey: [ResourceKind.Node, node.id, ResourceKind.Machine],
        queryFn: () =>
            list<Machine, MachineStatus>(
                ResourceKind.Machine,
                node.id,
                ResourceKind.Node,
            ),
    });

    if (isError) {
        return <div>error</div>;
    }

    if (isLoading) {
        return <div>loading..</div>;
    }

    return (
        <Card size="2">
            <Flex dir="row" justify="between" gap="3">
                <Card size="2" className="w-100 center">
                    vms: <Badge>{vms?.list?.length}</Badge>
                </Card>
                <Card size="2" className="w-100"></Card>
                <Card size="2" className="w-100"></Card>
                <Card size="2" className="w-100"></Card>
            </Flex>
        </Card>
    );
};

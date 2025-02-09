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
import { PoolsView } from "./pools";
import { useNavigate, useParams } from "react-router";
import { VmsView } from "./vms";
import { PieChart } from "@mui/x-charts";
import { get } from "../../data/queries/get";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { Node } from "../../types/node";
import { Resource, ResourceKind } from "../../types/resource";
import { CopyIcon } from "@radix-ui/react-icons";
import { convert, Units } from "../../utils/conversion";
import { Instance } from "../../types/instance";
import { getUptime } from "../../utils/uptime";

const Title: React.FC<{ node: Resource<Node> }> = ({ node }) => {
    const navigate = useNavigate();

    const instance = useQuery({
        queryKey: ["instance"],
        queryFn: () => get<Instance>(node.owner!.id!, node.owner!.kind!),
    });

    if (instance.isError) {
        console.log(instance.error);
        return <p>error</p>;
    }

    if (instance.isLoading) {
        return <p>loading</p>;
    }

    return (
        <Box>
            <Text
                className="hover:cursor-pointer"
                color="purple"
                onClick={() => navigate(`/`)}
            >
                <Text size="6">{instance.data?.spec?.name}</Text>
            </Text>
            <Text size="5" mr="1" ml="1">
                /
            </Text>
            <Text size="6">{node.spec?.hostname}</Text>
        </Box>
    );
};

const NodeMetadata: React.FC<{ node: Resource<Node> }> = ({ node }) => {
    const now = new Date();
    const lastReboot = new Date(now.getTime() - node.spec!.uptime * 1000);

    return (
        <Card>
            <DataList.Root>
                <DataList.Item align="center">
                    <DataList.Label minWidth="88px">Status</DataList.Label>
                    <DataList.Value>
                        <Badge color="jade" variant="soft" radius="full">
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
        queryKey: ["nodes", id],
        queryFn: () => get<Node>(id!, ResourceKind.Node),
    });

    // TODO: This whole setup causes a full page reload?
    const tabKey = `${id}/tab`;
    const [tab, setTab] = useState<string>(() => {
        return localStorage.getItem(tabKey) || "overview";
    });

    useEffect(() => {
        localStorage.setItem(tabKey, tab);
    }, [tab, tabKey]);

    if (data.isLoading && !data.isError) {
        return <Text>Loading...</Text>;
    }

    return (
        <Box p="9">
            <Title node={data.data!} />
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
                            value="pools"
                            onClick={() => setTab("pools")}
                        >
                            Storage Pools
                        </Tabs.Trigger>
                        <Tabs.Trigger
                            value="networks"
                            onClick={() => setTab("networks")}
                        >
                            Networks
                        </Tabs.Trigger>
                    </Tabs.List>

                    <Box pt="3">
                        <Tabs.Content value="overview">
                            <Grid columns="3" gap="4">
                                <Box gridColumn="1/3">
                                    <Card size="2"></Card>
                                </Box>
                                <Box gridColumnStart="3">
                                    <NodeMetadata node={data.data!} />
                                </Box>
                            </Grid>
                        </Tabs.Content>

                        <Tabs.Content value="vms">
                            <VmsView id={id!} />
                        </Tabs.Content>

                        <Tabs.Content value="pools">
                            <PoolsView nodeId={id!} />
                        </Tabs.Content>
                        <Tabs.Content value="networks">
                            <PieChart
                                skipAnimation
                                series={[
                                    {
                                        data: [
                                            {
                                                id: 0,
                                                value: 10,
                                            },
                                            {
                                                id: 1,
                                                value: 15,
                                            },
                                            {
                                                id: 2,
                                                value: 20,
                                            },
                                        ],
                                        innerRadius: 30,
                                        paddingAngle: 5,
                                        cornerRadius: 5,
                                    },
                                ]}
                                width={400}
                                height={200}
                            />
                        </Tabs.Content>
                    </Box>
                </Tabs.Root>
            </Box>
        </Box>
    );
};

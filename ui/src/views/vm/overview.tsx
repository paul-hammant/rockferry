import { useNavigate, useParams } from "react-router";
import { Resource, ResourceKind } from "../../types/resource";
import { Machine, MachineStatus } from "../../types/machine";
import { Node } from "../../types/node";
import { useQuery } from "@tanstack/react-query";
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
import { useEffect, useState } from "react";
import { CopyIcon } from "@radix-ui/react-icons";
import { convert, Units } from "../../utils/conversion";
import { VncConsole } from "./vnc-console";

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
                onClick={() => navigate(`/nodes/${node.id}`)}
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
            <DataList.Root>
                {Object.entries(vm.annotations!).map((o) => (
                    <DataList.Item key={o[0]}>
                        <DataList.Label minWidth="88px">
                            <Text size="2">{o[0]}</Text>
                        </DataList.Label>
                        <DataList.Value>
                            <Flex align="center" gap="2">
                                <Code variant="ghost">{o[1]}</Code>
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
                ))}
            </DataList.Root>
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

    const tabKey = `${vm.id}/tab`;
    const [tab, setTab] = useState<string>(() => {
        return localStorage.getItem(tabKey) || "overview";
    });

    useEffect(() => {
        localStorage.setItem(tabKey, tab);
    }, [tab, tabKey]);

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
                                        <VncConsole vm={vm} node={node!} />
                                    </Card>
                                </Box>
                                <Box gridColumnStart="3">
                                    <VmMetadata vm={vm} />
                                </Box>
                            </Grid>
                        </Tabs.Content>

                        <Tabs.Content value="devices"></Tabs.Content>
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

    return <VmTabs vm={vm.data!} />;
};

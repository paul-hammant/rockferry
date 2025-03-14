import {
    Box,
    Card,
    Text,
    DataList,
    Badge,
    Flex,
    IconButton,
    Separator,
    Tabs,
    Grid,
} from "@radix-ui/themes";
import { useQuery } from "@tanstack/react-query";
import { get } from "../../data/queries/get";
import { Instance } from "../../types/instance";
import { Resource, ResourceKind } from "../../types/resource";
import { CopyIcon } from "@radix-ui/react-icons";
import { NodesTab } from "./nodes";
import { ClustersTab } from "./clusters";
import { useTabState } from "../../hooks/tabstate";

export const Overview: React.FC<unknown> = () => {
    const data = useQuery({
        queryKey: [ResourceKind.Instance, "self"],
        queryFn: () => get<Instance>("self", ResourceKind.Instance),
    });

    const [tab, setTab] = useTabState("overview");

    if (data.isLoading && !data.isError) {
        return <Text>Loading...</Text>;
    }

    if (data.isLoading) {
        return <p>loading..</p>;
    }

    if (data.isError) {
        return <p>{data.error.message}</p>;
    }

    return (
        <Box p="9">
            <Text size="6">{data.data?.spec?.name}</Text>
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
                            value="nodes"
                            onClick={() => setTab("nodes")}
                        >
                            Nodes
                        </Tabs.Trigger>
                        <Tabs.Trigger
                            value="kubernetes-clusters"
                            onClick={() => setTab("kubernetes-clusters")}
                        >
                            Kubernetes Clusters
                        </Tabs.Trigger>
                        <Tabs.Trigger
                            value="vxlans"
                            onClick={() => setTab("vxlans")}
                        >
                            Vxlans
                        </Tabs.Trigger>
                    </Tabs.List>

                    <Box pt="3">
                        <Tabs.Content value="overview">
                            <Grid columns="3" gap="4">
                                <Box gridColumn="1/3">
                                    <Card size="2"></Card>
                                </Box>
                                <Box gridColumnStart="3">
                                    <InstanceMetadata instance={data.data!} />
                                </Box>
                            </Grid>
                        </Tabs.Content>

                        <Tabs.Content value="nodes">
                            <NodesTab />
                        </Tabs.Content>

                        <Tabs.Content value="kubernetes-clusters">
                            <ClustersTab />
                        </Tabs.Content>
                        <Tabs.Content value="vxlans"></Tabs.Content>
                    </Box>
                </Tabs.Root>
            </Box>
        </Box>
    );
};

const InstanceMetadata: React.FC<{ instance: Resource<Instance> }> = ({
    instance: _,
}) => {
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
                    </DataList.Item>
                </DataList.Item>
            </DataList.Root>
            <Separator size="4" mt="3" mb="3" />
            <DataList.Root>
                <DataList.Item>
                    <DataList.Label minWidth="88px">Cores</DataList.Label>
                </DataList.Item>
                <DataList.Item>
                    <DataList.Label minWidth="88px">Threads</DataList.Label>
                    <DataList.Value></DataList.Value>
                </DataList.Item>
                <DataList.Item>
                    <DataList.Label minWidth="88px">Sockets</DataList.Label>
                    <DataList.Value></DataList.Value>
                </DataList.Item>
                <DataList.Item>
                    <DataList.Label minWidth="88px">Memory</DataList.Label>
                    <DataList.Value>
                        <Badge color="green"></Badge>
                    </DataList.Value>
                </DataList.Item>
            </DataList.Root>
            <Separator size="4" mt="3" mb="3" />
            <DataList.Root>
                <DataList.Item>
                    <DataList.Label minWidth="88px">Last reboot</DataList.Label>
                    <DataList.Value>
                        <Text color="purple"></Text>
                    </DataList.Value>
                </DataList.Item>
            </DataList.Root>
        </Card>
    );
};

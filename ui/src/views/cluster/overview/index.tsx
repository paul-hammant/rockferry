import {
    Badge,
    Box,
    Button,
    Card,
    DataList,
    Grid,
    Separator,
    Tabs,
    Text,
} from "@radix-ui/themes";
import { useNavigate, useParams } from "react-router";
import { Cluster, ClusterStatus } from "../../../types/cluster";
import { Resource, ResourceKind } from "../../../types/resource";
import { useMutation, useQuery } from "@tanstack/react-query";
import { get } from "../../../data/queries/get";
import { MachinesTab } from "./machines";
import { ConfigTab } from "./talosconfig";
import { useTabState } from "../../../hooks/tabstate";
import { del } from "../../../data/mutations/delete";

const DeleteButton: React.FC<{ cluster: Resource<Cluster, ClusterStatus> }> = ({
    cluster,
}) => {
    const navigate = useNavigate();

    const { mutate } = useMutation({
        mutationKey: ["cluster", cluster.id],
        mutationFn: del,
    });

    return (
        <Button
            color="red"
            variant="soft"
            onClick={() => {
                mutate(
                    { kind: cluster.kind, id: cluster.id },
                    {
                        onSuccess: () => {
                            navigate("/?tab=kubernetes-clusters");
                        },
                    },
                );
            }}
        >
            Delete
        </Button>
    );
};

const InfoPane: React.FC<{
    cluster: Resource<Cluster, ClusterStatus>;
}> = ({ cluster }) => {
    return (
        <Card size="2">
            <DataList.Root>
                <DataList.Item align="center">
                    <DataList.Label minWidth="88px">Name</DataList.Label>
                    <DataList.Value>{cluster.spec!.name}</DataList.Value>
                </DataList.Item>
                <DataList.Item align="center">
                    <DataList.Label minWidth="88px">Status</DataList.Label>
                    <DataList.Value>
                        <Badge color="jade" variant="soft" radius="full">
                            {cluster.status.state}
                        </Badge>
                    </DataList.Value>
                </DataList.Item>
                <DataList.Item align="center">
                    <DataList.Label minWidth="88px">
                        Kubernetes Version
                    </DataList.Label>
                    <DataList.Value>
                        <Badge color="amber" variant="soft" radius="full">
                            v{cluster.spec?.kubernetes_version}
                        </Badge>
                    </DataList.Value>
                </DataList.Item>
                <DataList.Item align="center">
                    <DataList.Label minWidth="88px">
                        Talos Version
                    </DataList.Label>
                    <DataList.Value>
                        <Badge color="amber" variant="soft" radius="full">
                            v1.9.4
                        </Badge>
                    </DataList.Value>
                </DataList.Item>
            </DataList.Root>
            <Separator size="4" mt="3" mb="3" />
            <DeleteButton cluster={cluster!} />
        </Card>
    );
};

// TODO: Do not hardcode instance name as rockferry
const Title: React.FC<{
    cluster: Resource<Cluster, ClusterStatus>;
}> = ({ cluster }) => {
    const navigate = useNavigate();

    return (
        <Box>
            <Text
                className="hover:cursor-pointer"
                color="purple"
                onClick={() => navigate(`/`)}
            >
                <Text size="6">rockferry</Text>
            </Text>
            <Text size="5" mr="1" ml="1">
                /
            </Text>
            <Text size="6">{cluster.spec?.name}</Text>
        </Box>
    );
};

export const ClusterOverview: React.FC<unknown> = () => {
    const { id } = useParams<{ id: string }>();

    const cluster = useQuery({
        queryKey: [ResourceKind.Cluster, id],
        queryFn: () => get<Cluster, ClusterStatus>(id!, ResourceKind.Cluster),
    });

    const [tab, setTab] = useTabState("overview");

    if (cluster.isError) {
        return <div>error</div>;
    }

    if (cluster.isLoading) {
        return <div>loading..</div>;
    }
    return (
        <Box p="9" width="100%">
            <Title cluster={cluster.data!} />
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
                            value="machines"
                            onClick={() => setTab("machines")}
                        >
                            Machines
                        </Tabs.Trigger>
                        <Tabs.Trigger
                            value="talosconfig"
                            onClick={() => setTab("talosconfig")}
                        >
                            Talos Config
                        </Tabs.Trigger>
                        <Tabs.Trigger
                            value="workerconfig"
                            onClick={() => setTab("workerconfig")}
                        >
                            Worker Config
                        </Tabs.Trigger>
                        <Tabs.Trigger
                            value="controlplaneconfig"
                            onClick={() => setTab("controlplaneconfig")}
                        >
                            Control Plane Config
                        </Tabs.Trigger>
                    </Tabs.List>

                    <Box pt="3">
                        <Tabs.Content value="overview">
                            <Grid columns="3" gap="4">
                                <Box gridColumn="1/3">
                                    <Card size="2"></Card>
                                </Box>
                                <Box gridColumnStart="3">
                                    <InfoPane cluster={cluster.data!} />
                                </Box>
                            </Grid>
                        </Tabs.Content>

                        <Tabs.Content value="machines">
                            <MachinesTab cluster={cluster.data!} />
                        </Tabs.Content>

                        <Tabs.Content value="talosconfig">
                            <ConfigTab
                                filename="talosconfig"
                                config={atob(cluster.data!.spec!.talos_config)}
                            />
                        </Tabs.Content>

                        <Tabs.Content value="workerconfig">
                            <ConfigTab
                                filename="worker.yaml"
                                config={atob(cluster.data!.spec!.worker_config)}
                            />
                        </Tabs.Content>

                        <Tabs.Content value="controlplaneconfig">
                            <ConfigTab
                                filename="control_plane.yaml"
                                config={atob(
                                    cluster.data!.spec!.control_plane_config,
                                )}
                            />
                        </Tabs.Content>
                    </Box>
                </Tabs.Root>
            </Box>
        </Box>
    );
};

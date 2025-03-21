import {
    Box,
    Button,
    Flex,
    Text,
    Container,
    TextField,
    Select,
    Card,
} from "@radix-ui/themes";
import { MachineRequest } from "../../types/machinerequest";
import { Form, Formik, FormikHelpers } from "formik";
import { useParams } from "react-router";
import { useNavigate } from "react-router";
import { useMutation, useQuery } from "@tanstack/react-query";
import { convert, Units } from "../../utils/conversion";
import { CreateResourceInput, ResourceKind } from "../../types/resource";
import { list } from "../../data/queries/list";
import { Volume } from "../../types/volume";
import { Network } from "../../types/network";
import { PoolSelect } from "../../components/pool-select";
import { create } from "../../data/mutations/create";

const VolumeSelect: React.FC<{
    poolId: string;
    onChange: (value: string) => void;
}> = ({ poolId, onChange }) => {
    const data = useQuery({
        queryKey: [
            ResourceKind.StoragePool,
            poolId,
            ResourceKind.StorageVolume,
        ],
        queryFn: () =>
            list<Volume>(
                ResourceKind.StorageVolume,
                poolId,
                ResourceKind.StoragePool,
            ),
    });

    if (data.isError) {
        console.log(data.error);
        return <p>error</p>;
    }

    return (
        <Box width="100%">
            <Select.Root onValueChange={onChange}>
                <Box width="100%">
                    <Select.Trigger
                        placeholder="Volumes"
                        style={{ width: "100%" }}
                    ></Select.Trigger>
                </Box>
                <Select.Content>
                    <Select.Group>
                        <Select.Label>Volumes</Select.Label>
                        {data?.data?.list?.map((resource) => {
                            return (
                                <Select.Item
                                    value={resource.id}
                                    key={resource.id}
                                >
                                    {resource.spec?.name}
                                </Select.Item>
                            );
                        })}
                    </Select.Group>
                </Select.Content>
            </Select.Root>
        </Box>
    );
};

const NetworkSelect: React.FC<{
    nodeId: string;
    onChange: (value: string) => void;
}> = ({ nodeId, onChange }) => {
    const data = useQuery({
        queryKey: [ResourceKind.Node, nodeId, ResourceKind.Network],
        queryFn: () =>
            list<Network>(ResourceKind.Network, nodeId, ResourceKind.Node),
    });

    if (data.isError) {
        console.log(data.error);
        return <p>error</p>;
    }

    return (
        <Box width="100%">
            <Select.Root onValueChange={onChange}>
                <Box width="100%">
                    <Select.Trigger
                        placeholder="Networks"
                        style={{ width: "100%" }}
                    ></Select.Trigger>
                </Box>
                <Select.Content>
                    <Select.Group>
                        <Select.Label>Pools</Select.Label>
                        {data?.data?.list?.map((resource) => {
                            const pool = resource!.spec;

                            return (
                                <Select.Item
                                    value={resource.id!}
                                    key={resource.id!}
                                >
                                    {pool?.name}
                                </Select.Item>
                            );
                        })}
                    </Select.Group>
                </Select.Content>
            </Select.Root>
        </Box>
    );
};

interface VmCreateValues {
    name: string;

    disk_pool: string;
    disk_capacity: number;

    cdrom_pool: string;
    cdrom_key: string;

    cdrom_volume_id: string;

    network: string;

    threads: number;
    cores: number;
    memory: number;
}

export const CreateVmView: React.FC<unknown> = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();

    const { mutate } = useMutation({ mutationFn: create<MachineRequest> });

    return (
        <Box p="9">
            <Container size="1">
                <Text size="8">Create vm</Text>
                <Card mt="2">
                    <Box pt="3">
                        <Formik<VmCreateValues>
                            initialValues={{
                                name: "",

                                disk_pool: "",
                                disk_capacity: 0,

                                network: "",

                                cdrom_pool: "",
                                cdrom_key: "",
                                cdrom_volume_id: "",

                                threads: 0,
                                cores: 0,
                                memory: 0,
                            }}
                            onSubmit={(
                                values,
                                {
                                    setSubmitting,
                                }: FormikHelpers<VmCreateValues>,
                            ) => {
                                const machine_request_spec: MachineRequest = {
                                    name: values.name,
                                    topology: {
                                        sockets: 1,
                                        cores: parseInt(
                                            values.cores as unknown as string,
                                        ),
                                        threads: parseInt(
                                            values.threads as unknown as string,
                                        ),
                                        memory: convert(
                                            values.memory,
                                            Units.Gigabyte,
                                            Units.Bytes,
                                        ),
                                    },
                                    network: values.network,
                                    cdrom: {
                                        key: values.cdrom_key,
                                        volume: values.cdrom_volume_id,
                                    },
                                    disks: [
                                        {
                                            pool: values.disk_pool,
                                            capacity: convert(
                                                values.disk_capacity,
                                                Units.Gigabyte,
                                                Units.Bytes,
                                            ),
                                        },
                                    ],
                                };

                                const input: CreateResourceInput<MachineRequest> =
                                    {
                                        annotations: new Map(),
                                        kind: ResourceKind.MachineRequest,
                                        owner_ref: {
                                            id: id!,
                                            kind: ResourceKind.Node,
                                        },
                                        spec: machine_request_spec,
                                    };

                                mutate(input as any, {
                                    onSuccess: () => {
                                        setSubmitting(false);
                                        navigate(
                                            `/${ResourceKind.Node}/${id}?tab=vms`,
                                        );
                                    },
                                });
                            }}
                        >
                            {({ setFieldValue, values }) => (
                                <Form>
                                    <Box>
                                        <Box pb="1">
                                            <label htmlFor="name">Name</label>
                                        </Box>
                                        <TextField.Root
                                            placeholder="vm1"
                                            id="name"
                                            name="name"
                                            type="text"
                                            onChange={(e) =>
                                                setFieldValue(
                                                    "name",
                                                    e.target.value,
                                                )
                                            }
                                        ></TextField.Root>
                                    </Box>
                                    <Box pt="5">
                                        <Box pb="1">
                                            <label htmlFor="capacity">
                                                Disk
                                            </label>
                                        </Box>
                                        <Flex justify="between" gap="2">
                                            <Box width="50%">
                                                <PoolSelect
                                                    nodeId={id!}
                                                    onChange={(v) =>
                                                        setFieldValue(
                                                            "disk_pool",
                                                            v,
                                                        )
                                                    }
                                                />
                                            </Box>
                                            <Box width="50%">
                                                <TextField.Root
                                                    placeholder="30 GB"
                                                    id="capacity"
                                                    name="capacity"
                                                    type="number"
                                                    onChange={(e) =>
                                                        setFieldValue(
                                                            "disk_capacity",
                                                            e.target.value,
                                                        )
                                                    }
                                                ></TextField.Root>
                                            </Box>
                                        </Flex>
                                    </Box>
                                    <Box pt="3">
                                        <Box pb="1">
                                            <label htmlFor="capacity">
                                                Cdrom
                                            </label>
                                        </Box>
                                        <Flex justify="between" gap="2">
                                            <Box width="50%">
                                                <PoolSelect
                                                    nodeId={id!}
                                                    onChange={(v) =>
                                                        setFieldValue(
                                                            "cdrom_pool",
                                                            v,
                                                        )
                                                    }
                                                />
                                            </Box>
                                            <Box width="50%">
                                                {values.cdrom_pool ? (
                                                    <VolumeSelect
                                                        poolId={
                                                            values.cdrom_pool!
                                                        }
                                                        onChange={(v) =>
                                                            setFieldValue(
                                                                "cdrom_volume_id",
                                                                v,
                                                            )
                                                        }
                                                    />
                                                ) : undefined}
                                            </Box>
                                        </Flex>
                                    </Box>
                                    <Box pt="5">
                                        <Box pb="1">
                                            <label htmlFor="capacity">
                                                Topology
                                            </label>
                                        </Box>
                                        <Flex justify="between" gap="2">
                                            <Box width="50%">
                                                <TextField.Root
                                                    placeholder="Cores"
                                                    id="cores"
                                                    name="cores"
                                                    type="number"
                                                    onChange={(e) =>
                                                        setFieldValue(
                                                            "cores",
                                                            e.target.value,
                                                        )
                                                    }
                                                ></TextField.Root>
                                            </Box>
                                            <Box width="50%">
                                                <TextField.Root
                                                    placeholder="Threads"
                                                    id="threads"
                                                    name="threads"
                                                    type="number"
                                                    onChange={(e) =>
                                                        setFieldValue(
                                                            "threads",
                                                            e.target.value,
                                                        )
                                                    }
                                                ></TextField.Root>
                                            </Box>
                                        </Flex>
                                    </Box>
                                    <Box pt="3">
                                        <Box pb="1">
                                            <label htmlFor="capacity">
                                                Memory
                                            </label>
                                        </Box>
                                        <TextField.Root
                                            placeholder="4 GB"
                                            id="memory"
                                            name="memory"
                                            type="number"
                                            onChange={(e) =>
                                                setFieldValue(
                                                    "memory",
                                                    e.target.value,
                                                )
                                            }
                                        ></TextField.Root>
                                    </Box>
                                    <Box pt="5">
                                        <Box pb="1">
                                            <label htmlFor="capacity">
                                                Network
                                            </label>
                                        </Box>
                                        <NetworkSelect
                                            nodeId={id!}
                                            onChange={(v) =>
                                                setFieldValue("network", v)
                                            }
                                        />
                                    </Box>
                                    <Flex justify="end" pt="5">
                                        <Button
                                            color="red"
                                            variant="soft"
                                            type="button"
                                            onClick={() =>
                                                navigate(
                                                    `/${ResourceKind.Node}/${id}?tab=vms`,
                                                )
                                            }
                                        >
                                            Cancel
                                        </Button>
                                        <Button
                                            ml="3"
                                            variant="solid"
                                            color="purple"
                                            type="submit"
                                        >
                                            Create
                                        </Button>
                                    </Flex>
                                </Form>
                            )}
                        </Formik>
                    </Box>
                </Card>
            </Container>
        </Box>
    );
};

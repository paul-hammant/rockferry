import {
    Box,
    Container,
    Text,
    Card,
    TextField,
    Flex,
    Button,
    Separator,
    Select,
} from "@radix-ui/themes";
import { Form, Formik, FormikHelpers } from "formik";
import { useNavigate } from "react-router";
import { ResourceKind } from "../../types/resource";
import { ClusterRequest, ClusterRequestNode } from "../../types/clusterrequest";
import { convert, Units } from "../../utils/conversion";
import { useMutation } from "@tanstack/react-query";
import { create } from "../../data/mutations/create";

interface CreateClusterRequestValues {
    name: string;
    kubernetesVersion: string;

    cpTopologyCores: number;
    cpTopologyThreads: number;
    cpTopologyMemory: number;

    cpReplicas: number;
}

// TODO: This looks horrible
export const CreateClusterView: React.FC<unknown> = () => {
    const navigate = useNavigate();

    const { mutate } = useMutation({ mutationFn: create<ClusterRequest> });

    return (
        <Box p="9">
            <Container size="1">
                <Text size="6">Create Kubernetes Cluster</Text>
                <Card mt="2">
                    <Box pt="3">
                        <Formik<CreateClusterRequestValues>
                            initialValues={{
                                name: "cluster123",
                                kubernetesVersion: "1.32.2",
                                cpReplicas: 3,
                                cpTopologyCores: 2,
                                cpTopologyMemory: 4,
                                cpTopologyThreads: 2,
                            }}
                            onSubmit={(
                                values,
                                {
                                    setSubmitting,
                                }: FormikHelpers<CreateClusterRequestValues>,
                            ) => {
                                const control_planes: ClusterRequestNode[] = [];

                                for (
                                    let i: number = 0;
                                    values.cpReplicas > i;
                                    ++i
                                ) {
                                    const control_plane: ClusterRequestNode = {
                                        topology: {
                                            sockets: 1,
                                            cores: values.cpTopologyCores,
                                            threads: values.cpTopologyThreads,
                                            memory: convert(
                                                values.cpTopologyMemory,
                                                Units.Gigabyte,
                                                Units.Bytes,
                                            ),
                                        },
                                    };

                                    control_planes.push(control_plane);
                                }

                                const input = {
                                    owner_ref: undefined,
                                    annotations: {},
                                    kind: ResourceKind.ClusterRequest,
                                    spec: {
                                        name: values.name,
                                        kubernetes_version:
                                            values.kubernetesVersion,
                                        control_planes,
                                    },
                                };

                                mutate(input as any, {
                                    onSuccess: () => {
                                        setSubmitting(false);
                                        navigate("/");
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
                                            placeholder="name"
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
                                    <Box pt="3">
                                        <Box pb="1">
                                            <label htmlFor="name">
                                                Kubernetes version
                                            </label>
                                        </Box>
                                        <TextField.Root
                                            placeholder="1.32"
                                            id="kubernetesVersion"
                                            name="kubernetesVersion"
                                            defaultValue={
                                                values.kubernetesVersion
                                            }
                                            disabled={true}
                                            type="text"
                                            onChange={(e) =>
                                                setFieldValue(
                                                    "kubernetesVersion",
                                                    e.target.value,
                                                )
                                            }
                                        ></TextField.Root>
                                    </Box>
                                    <Box pt="5">
                                        <Text>Control Planes</Text>
                                        <Separator size="4" />
                                        <Box pb="1" pt="3">
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
                                                    defaultValue={
                                                        values.cpTopologyCores
                                                    }
                                                    type="number"
                                                    onChange={(e) =>
                                                        setFieldValue(
                                                            "cpTopologyCores",
                                                            parseInt(
                                                                e.target.value,
                                                            ),
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
                                                    defaultValue={
                                                        values.cpTopologyThreads
                                                    }
                                                    onChange={(e) =>
                                                        setFieldValue(
                                                            "cpTopologyThreads",
                                                            parseInt(
                                                                e.target.value,
                                                            ),
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
                                            defaultValue={
                                                values.cpTopologyMemory
                                            }
                                            onChange={(e) =>
                                                setFieldValue(
                                                    "cpTopologyMemory",
                                                    parseInt(e.target.value),
                                                )
                                            }
                                        ></TextField.Root>
                                    </Box>
                                    <Box pt="3">
                                        <Box pb="1">
                                            <label htmlFor="replicas">
                                                Replicas
                                            </label>
                                        </Box>

                                        <Select.Root
                                            defaultValue={values.cpReplicas.toString()}
                                            onValueChange={(v) => {
                                                setFieldValue(
                                                    "cpReplicas",
                                                    parseInt(v),
                                                );
                                            }}
                                        >
                                            <Select.Trigger
                                                placeholder="replicas"
                                                style={{
                                                    width: "100%",
                                                }}
                                            />
                                            <Select.Content>
                                                <Select.Group>
                                                    <Select.Item value="1">
                                                        1
                                                    </Select.Item>
                                                    <Select.Item value="3">
                                                        3
                                                    </Select.Item>
                                                    <Select.Item value="5">
                                                        5
                                                    </Select.Item>
                                                </Select.Group>
                                            </Select.Content>
                                        </Select.Root>
                                    </Box>

                                    <Flex gap="3" mt="4" justify="end">
                                        <Button
                                            variant="soft"
                                            color="red"
                                            type="button"
                                            onClick={() => {
                                                navigate(
                                                    `/?tab=kubernetes-clusters`,
                                                );
                                            }}
                                        >
                                            Cancel
                                        </Button>
                                        <Button
                                            variant="soft"
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

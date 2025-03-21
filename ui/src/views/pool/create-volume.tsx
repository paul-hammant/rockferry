import {
    Box,
    Flex,
    Button,
    TextField,
    Container,
    Text,
    Card,
} from "@radix-ui/themes";
import { Formik, FormikHelpers, Form } from "formik";
import { CreateResourceInput, ResourceKind } from "../../types/resource";
import { convert, Units } from "../../utils/conversion";
import { useParams } from "react-router";
import { useNavigate } from "react-router";
import { useMutation } from "@tanstack/react-query";
import { Volume } from "../../types/volume";
import { create } from "../../data/mutations/create";

interface CreateVolumeValues {
    name: string;
    capacity: number;
}

export const CreateVolumeView: React.FC<unknown> = () => {
    const navigate = useNavigate();
    const { id: poolId } = useParams<{ id: string }>();
    const { mutate } = useMutation({ mutationFn: create<Volume> });

    return (
        <Box p="9">
            <Container size="1">
                <Text size="6">Create Storage Volume</Text>
                <Card mt="2">
                    <Box pt="3">
                        <Formik<CreateVolumeValues>
                            initialValues={{ name: "volume123", capacity: 12 }}
                            onSubmit={(
                                values,
                                {
                                    setSubmitting,
                                }: FormikHelpers<CreateVolumeValues>,
                            ) => {
                                const capacity = convert(
                                    values.capacity,
                                    Units.Gigabyte,
                                    Units.Bytes,
                                );

                                const input: CreateResourceInput<Volume> = {
                                    owner_ref: {
                                        id: poolId!,
                                        kind: ResourceKind.StoragePool,
                                    },
                                    annotations: {},
                                    kind: ResourceKind.StorageVolume,
                                    spec: {
                                        name: values.name,
                                        capacity: capacity,
                                        allocation: capacity,
                                        key: "",
                                        pool: "",
                                    },
                                };

                                mutate(input, {
                                    onSuccess: () => {
                                        setSubmitting(false);
                                        navigate(
                                            `${ResourceKind.StoragePool}/${poolId}`,
                                        );
                                    },
                                });
                            }}
                        >
                            {({ setFieldValue }) => (
                                <Form>
                                    <Box>
                                        <Box pb="1">
                                            <label htmlFor="name">Name</label>
                                        </Box>
                                        <TextField.Root
                                            placeholder="volume123"
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
                                            <label htmlFor="capacity">
                                                Capacity
                                            </label>
                                        </Box>
                                        <TextField.Root
                                            placeholder="40 GB"
                                            id="capacity"
                                            name="capacity"
                                            type="number"
                                            onChange={(e) =>
                                                setFieldValue(
                                                    "capacity",
                                                    e.target.value,
                                                )
                                            }
                                        ></TextField.Root>
                                    </Box>

                                    <Flex gap="3" mt="4" justify="end">
                                        <Button
                                            variant="soft"
                                            color="red"
                                            type="button"
                                            onClick={() => {
                                                navigate(
                                                    `/${ResourceKind.StoragePool}/${poolId}`,
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

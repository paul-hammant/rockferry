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
import { createVolume } from "../../data/mutations/volumes";

interface CreateVolumeValues {
    name: string;
    capacity: number;
}

export const CreateVolumeView: React.FC<unknown> = () => {
    const navigate = useNavigate();
    const { id: poolId } = useParams<{ id: string }>();
    const { mutate } = useMutation({ mutationFn: createVolume });

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

                                values.capacity = capacity;

                                const input: CreateResourceInput = {
                                    owner_ref: {
                                        id: poolId!,
                                        kind: ResourceKind.StoragePool,
                                    },
                                    annotations: {},
                                    kind: ResourceKind.StorageVolume,
                                    spec: {
                                        name: values.name,
                                        capacity: values.capacity,
                                        allocation: values.capacity,
                                    },
                                };

                                mutate(input, {
                                    onSuccess: () => setSubmitting(false),
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
                                                    "capacity",
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
                                                navigate(`/pools/${poolId}`);
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

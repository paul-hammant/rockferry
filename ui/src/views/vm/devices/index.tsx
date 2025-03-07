import { Box, Button, Card, Flex, Grid } from "@radix-ui/themes";
import { Machine, MachineStatus } from "../../../types/machine";
import { Resource } from "../../../types/resource";
import { DisksView } from "./disks";
import { InterfacesView } from "./interfaces";
import { useState } from "react";

interface Props {
    vm: Resource<Machine, MachineStatus>;
}

interface Entry {
    name: string;
    component: React.FC<Props>;
}

export const Devices: React.FC<Props> = ({ vm }) => {
    const entries: Entry[] = [];

    entries.push({ name: "Disks", component: DisksView });
    entries.push({
        name: "Interfaces",
        component: InterfacesView,
    });

    const [active, setActive] = useState<string>(entries[0].name);

    return (
        <Card>
            <Grid columns="8">
                <Box className="border-r border-gray-600 h-100">
                    <Box mr="3" gridColumnStart="1" pt="2">
                        <Flex direction="column" gap="2">
                            {entries.map((entry) => (
                                <Button
                                    color={
                                        active == entry.name ? "purple" : "gray"
                                    }
                                    variant="soft"
                                    onClick={() => setActive(entry.name)}
                                >
                                    {entry.name}
                                </Button>
                            ))}
                        </Flex>
                    </Box>
                </Box>
                <Box gridColumnStart="2" gridColumnEnd="9" pl="3">
                    {entries.map((entry) => {
                        if (entry.name == active) {
                            return <entry.component vm={vm} />;
                        }
                    })}
                </Box>
            </Grid>
        </Card>
    );
};

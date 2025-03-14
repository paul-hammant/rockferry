import { Resource } from "../../../types/resource";
import { Box, Button, Card, Flex, Grid } from "@radix-ui/themes";
import { Node } from "../../../types/node";
import { NetworksView } from "./networks";
import { PoolsView } from "./pools";
import { OptionsView } from "./options";
import { useTabState } from "../../../hooks/tabstate";

interface Props {
    node: Resource<Node>;
}

interface Entry {
    name: string;
    component: React.FC<Props>;
}

export const HypervisorTab: React.FC<Props> = ({ node }) => {
    const entries: Entry[] = [];

    entries.push({ name: "Networks", component: NetworksView });
    entries.push({
        name: "Pools",
        component: PoolsView,
    });
    entries.push({
        name: "Options",
        component: OptionsView,
    });

    const [active, setActive] = useTabState("Networks", "subtab");

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
                            return <entry.component node={node} />;
                        }
                    })}
                </Box>
            </Grid>
        </Card>
    );
};

import { Machine, MachineStatus } from "../../types/machine";
import { Node, NodeInterface } from "../../types/node";
import { Resource } from "../../types/resource";
import { VncScreen } from "react-vnc";
import { Flex, IconButton, Text, Tooltip } from "@radix-ui/themes";

// This function is just chatgpt. Needed something fast to filter through all the interfaces of the node.
const selectBestInterface = (
    interfaces: NodeInterface[],
): NodeInterface | null => {
    let preferredInterface: NodeInterface | null = null;

    for (const iface of interfaces) {
        if (!iface.addrs || iface.name === "lo") continue; // Skip loopback and empty interfaces

        for (const addr of iface.addrs) {
            const [ip] = addr.split("/");

            if (/^10\.|^192\.168\.|^172\.(1[6-9]|2[0-9]|3[01])\./.test(ip)) {
                // Found a private IPv4, prefer this
                return iface;
            }

            if (
                !preferredInterface &&
                /^[0-9]+\.[0-9]+\.[0-9]+\.[0-9]+$/.test(ip)
            ) {
                // If no private IPv4 found yet, consider any IPv4
                preferredInterface = iface;
            }

            if (!preferredInterface && !ip.startsWith("fe80::")) {
                // If no IPv4, consider a global IPv6 (not link-local)
                preferredInterface = iface;
            }
        }
    }

    return preferredInterface;
};

interface Props {
    vm: Resource<Machine, MachineStatus>;
    node: Resource<Node>;
    fullscreen: boolean;
}

export const VncConsole: React.FC<Props> = ({ vm, node, fullscreen }) => {
    const vncDevices = vm.status.vnc.filter((p) => p.type == "websocket");

    if (vncDevices.length == 0) {
        return <Text>Virtual machine does not own a websocket vnc device</Text>;
    }

    const iface = selectBestInterface(node.spec!.interfaces)!;

    const url = `ws://${iface.addrs![0].split("/")[0]}:${vncDevices[0].port!}`;

    return (
        <>
            <VncScreen
                url={url}
                scaleViewport
                debug
                style={{
                    height: fullscreen ? "100%" : "45vh",
                }}
                onCredentialsRequired={(o) => {
                    const credentials = {
                        username: "",
                        password: "1234",
                        target: "",
                    };

                    o?.sendCredentials(credentials);

                    console.log("on credentials required called", o);
                }}
            />
            <Flex mt="3" direction="row-reverse">
                {fullscreen ? undefined : (
                    <Tooltip content="Enter fullscreen">
                        <IconButton
                            variant="soft"
                            onClick={() => {
                                const urlWithoutQuery =
                                    window.location.origin +
                                    window.location.pathname;
                                window.open(
                                    urlWithoutQuery + "/console-fullscreen",
                                    "_blank",
                                    "noopener,noreferrer",
                                );
                            }}
                        >
                            <svg
                                width="15"
                                height="15"
                                viewBox="0 0 15 15"
                                fill="none"
                                xmlns="http://www.w3.org/2000/svg"
                            >
                                <path
                                    d="M2 2.5C2 2.22386 2.22386 2 2.5 2H5.5C5.77614 2 6 2.22386 6 2.5C6 2.77614 5.77614 3 5.5 3H3V5.5C3 5.77614 2.77614 6 2.5 6C2.22386 6 2 5.77614 2 5.5V2.5ZM9 2.5C9 2.22386 9.22386 2 9.5 2H12.5C12.7761 2 13 2.22386 13 2.5V5.5C13 5.77614 12.7761 6 12.5 6C12.2239 6 12 5.77614 12 5.5V3H9.5C9.22386 3 9 2.77614 9 2.5ZM2.5 9C2.77614 9 3 9.22386 3 9.5V12H5.5C5.77614 12 6 12.2239 6 12.5C6 12.7761 5.77614 13 5.5 13H2.5C2.22386 13 2 12.7761 2 12.5V9.5C2 9.22386 2.22386 9 2.5 9ZM12.5 9C12.7761 9 13 9.22386 13 9.5V12.5C13 12.7761 12.7761 13 12.5 13H9.5C9.22386 13 9 12.7761 9 12.5C9 12.2239 9.22386 12 9.5 12H12V9.5C12 9.22386 12.2239 9 12.5 9Z"
                                    fill="currentColor"
                                    fill-rule="evenodd"
                                    clip-rule="evenodd"
                                ></path>
                            </svg>
                        </IconButton>
                    </Tooltip>
                )}
            </Flex>
        </>
    );
};

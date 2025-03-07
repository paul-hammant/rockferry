import { Machine, MachineStatus } from "../../types/machine";
import { Node, NodeInterface } from "../../types/node";
import { Resource } from "../../types/resource";
import { VncScreen } from "react-vnc";
import { Text } from "@radix-ui/themes";

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
}

export const VncConsole: React.FC<Props> = ({ vm, node }) => {
    const vncDevices = vm.status.vnc.filter((p) => p.type == "websocket");

    if (vncDevices.length == 0) {
        return <Text>Virtual machine does not own a websocket vnc device</Text>;
    }

    const iface = selectBestInterface(node.spec!.interfaces)!;

    const url = `ws://${iface.addrs![0].split("/")[0]}:${vncDevices[0].port!}`;

    return (
        <VncScreen
            url={url}
            scaleViewport
            debug
            style={{
                height: "45vh",
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
    );
};

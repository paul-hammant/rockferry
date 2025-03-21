import { Routes, Route, BrowserRouter } from "react-router";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import "@radix-ui/themes/styles.css";
import "./tailwind.css";
import { Theme, Text } from "@radix-ui/themes";
import { NodeView } from "./views/node/view";
import { PoolView } from "./views/pool/view";
import { CreateVmView } from "./views/vm/create";
import { Overview } from "./views/overview/overview";
import { CreateVolumeView } from "./views/pool/create-volume";
import { VmOverview } from "./views/vm/overview";
import { CreateClusterView } from "./views/cluster/create";
import { ClusterOverview } from "./views/cluster/overview";
import { ConsoleFullscreen } from "./views/vm/console-fullscreen";
import { Livedata } from "./livedata";
import { AddDiskView } from "./views/vm/add-disk";
import { ResourceKind } from "./types/resource";

const queryClient = new QueryClient();

function App() {
    return (
        <Theme appearance="dark" accentColor="purple">
            <QueryClientProvider client={queryClient}>
                <Livedata>
                    <BrowserRouter>
                        <Routes>
                            <Route index element={<Overview />} />

                            <Route
                                path="/create-cluster"
                                element={<CreateClusterView />}
                            />
                            <Route
                                path={`${ResourceKind.Cluster}/:id`}
                                element={<ClusterOverview />}
                            />

                            <Route
                                path={`${ResourceKind.Machine}/:id`}
                                element={<VmOverview />}
                            />
                            <Route
                                path={`${ResourceKind.Machine}/:id/console-fullscreen`}
                                element={<ConsoleFullscreen />}
                            />
                            <Route
                                path={`${ResourceKind.Machine}/:id/add-disk`}
                                element={<AddDiskView />}
                            />

                            <Route
                                path={`${ResourceKind.Node}/:id`}
                                element={<NodeView />}
                            />
                            <Route
                                path={`${ResourceKind.Node}/:id/create-vm`}
                                element={<CreateVmView />}
                            />

                            <Route
                                path={`${ResourceKind.StoragePool}/:id`}
                                element={<PoolView />}
                            />
                            <Route
                                path={`${ResourceKind.StoragePool}/:id/create-volume`}
                                element={<CreateVolumeView />}
                            />

                            <Route path="*" element={<Text>404 </Text>} />
                        </Routes>
                    </BrowserRouter>
                </Livedata>
            </QueryClientProvider>
        </Theme>
    );
}

export default App;

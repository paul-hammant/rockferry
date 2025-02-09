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

const queryClient = new QueryClient();

function App() {
    return (
        <Theme appearance="dark" accentColor="purple">
            <QueryClientProvider client={queryClient}>
                <BrowserRouter>
                    <Routes>
                        <Route index element={<Overview />} />
                        <Route path="nodes/:id" element={<NodeView />} />
                        <Route
                            path="nodes/:id/create-vm"
                            element={<CreateVmView />}
                        />
                        <Route path="pools/:id" element={<PoolView />} />
                        <Route
                            path="pools/:id/create-volume"
                            element={<CreateVolumeView />}
                        />
                        <Route path="*" element={<Text>404 </Text>} />
                    </Routes>
                </BrowserRouter>
            </QueryClientProvider>
        </Theme>
    );
}

export default App;

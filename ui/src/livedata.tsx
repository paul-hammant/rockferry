import { useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { ResourceKind, WatchAction, WatchResponse } from "./types/resource";
import { relatedQueryKeys } from "./data";
interface Props {
    children: React.ReactNode;
}

export const Livedata: React.FC<Props> = ({ children }) => {
    const queryClient = useQueryClient();

    useEffect(() => {
        const params = new URLSearchParams();

        params.append("action", WatchAction.All.toString());
        params.append("kind", ResourceKind.All);

        const socket = new WebSocket(
            "http://10.100.0.186:8080/v1/resources/events?" + params.toString(),
        );

        socket.onmessage = (event) => {
            const watchEvent: WatchResponse<any, any> = JSON.parse(event.data);

            const queryKeys = relatedQueryKeys(watchEvent.resource);
            queryKeys.forEach((key) => {
                if (watchEvent.action == WatchAction.Delete) {
                    queryClient.removeQueries({ queryKey: key });
                } else {
                    queryClient.invalidateQueries({ queryKey: key });
                }
            });

            // You can use queryClient here if needed
            // Example: queryClient.invalidateQueries('someQueryKey');
        };

        // Cleanup function to close the EventSource when the component unmounts
        return () => {
            socket.close();
        };
    }, [queryClient]); // Add queryClient to the dependency array if you use it inside the effect

    return <>{children}</>; // Return children wrapped in a fragment or a div
};

import { Box, Text, Button } from "@radix-ui/themes";
import { ToastContentProps } from "react-toastify";

type StateToastProps = ToastContentProps<{
    content: string;
}>;

export const StateToast: React.FC<StateToastProps> = ({
    // @ts-ignore
    closeToast: _,
    data,
    toastProps,
}) => {
    const isColored = toastProps.theme === "colored";

    return (
        <div className="flex flex-col w-full">
            <h3
                className={`text-sm font-semibold ${isColored ? "text-white" : "text-zinc-800}"} `}
            >
                {data.content}
            </h3>
        </div>
    );
};

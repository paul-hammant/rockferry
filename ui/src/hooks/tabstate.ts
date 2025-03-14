import { useEffect, useState } from "react";
import { useSearchParams } from "react-router";

export const useTabState = (
    defaultTab: string,
    tabKey: string = "tab",
): [string, (tab: string) => void] => {
    const [searchParams, setSearchParams] = useSearchParams();

    const initialTab: string = searchParams.get(tabKey) || defaultTab;
    const [tab, setTab] = useState<string>(initialTab);

    useEffect(() => {
        const currentParams = new URLSearchParams(searchParams);
        currentParams.set(tabKey, tab);
        setSearchParams(currentParams, { replace: true });
    }, [tab, setSearchParams, searchParams, tabKey]);

    return [tab, setTab];
};

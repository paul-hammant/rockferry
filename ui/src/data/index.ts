import { QueryFunction, useQuery } from "@tanstack/react-query";
import { Resource } from "../types/resource";

export interface List<T> {
    list?: T[];
}

// node / id / pools;
// node / id / vms;
//
// pool / id;
// vm / id;

export const relatedQueryKeys = (res: Resource<any, any>): string[][] => {
    const out: string[][] = [];

    if (res.owner) {
        out.push([res.owner!.kind, res.owner!.id, res.kind]);
    }

    out.push([res.kind, res.id]);
    return out;
};

interface Query<T> {
    queryKey: string[];
    queryFn: QueryFunction<T>;
}

interface Result<T, S> {
    data?: [T | undefined, S | undefined];
    isLoading: boolean;
    isError: boolean;
    error?: string;
}

export const useMultiQuery = <T, S>(
    queries: [Query<T>, Query<S>],
): Result<T, S> => {
    const [r1, r2] = queries;

    const {
        data: r1Data,
        error: r1Error,
        isError: r1IsError,
        isLoading: r1IsLoading,
    } = useQuery({
        queryKey: r1.queryKey,
        queryFn: r1.queryFn,
    });

    const {
        data: r2Data,
        error: r2Error,
        isError: r2IsError,
        isLoading: r2IsLoading,
    } = useQuery({
        queryKey: r2.queryKey,
        queryFn: r2.queryFn,
    });

    if (r1IsError || r2IsError) {
        return {
            isLoading: false,
            isError: true,
            error: r1Error?.message || r2Error?.message,
        };
    }

    if (r1IsLoading || r2IsLoading) {
        return {
            isLoading: true,
            isError: false,
            error: "",
        };
    }

    return {
        data: [r1Data, r2Data],
        isLoading: false,
        isError: false,
        error: undefined,
    };
};

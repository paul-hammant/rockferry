export const getUptime = (uptime: number): string => {
    return new Date(uptime * 1000).toISOString().slice(11, 19);
};

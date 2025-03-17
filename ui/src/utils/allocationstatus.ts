export const checkVolumeAllocationStatus = (
    capacity: number,
    allocation: number,
): string => {
    // Calculate the percentage of allocation relative to capacity
    const percentage = (allocation / capacity) * 100;

    // Determine the status based on the percentage
    if (percentage <= 80) {
        return "green";
    } else if (percentage <= 90) {
        return "amber";
    } else {
        return "red";
    }
};

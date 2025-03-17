package rockferry

import (
	"github.com/eskpil/rockferry/pkg/rockferry/spec"
)

type MachineDiskTargetBase string

const (
	MachineDiskTargetBaseSD MachineDiskTargetBase = "sd"
	MachineDiskTargetBaseVD MachineDiskTargetBase = "vd"
)

// Argument disk is expected to also the first element within disks[]

func MachineEnsureUniqueDiskTargets(disks []*spec.MachineSpecDisk, baseTarget MachineDiskTargetBase) {
	diskIndex := len(disks) - 1

	// Track all existing targets to avoid conflicts
	usedTargets := make(map[string]bool)
	for _, d := range disks {
		if d.Target != nil && d.Target.Dev != "" {
			usedTargets[d.Target.Dev] = true
		}
	}

	// If the disk already has a target, skip it
	if disks[diskIndex].Target != nil && disks[diskIndex].Target.Dev != "" {
		return
	}

	// Initialize the target if it's nil
	if disks[diskIndex].Target == nil {
		disks[diskIndex].Target = new(spec.MachineSpecDiskTarget)
	}

	// Function to generate the next target name
	generateNextTarget := func(current string) string {
		if current == "" {
			return string(baseTarget) + "a" // Start with "sda"
		}

		suffix := current[len(baseTarget):] // Extract the suffix (e.g., "a" from "sda", "aa" from "sdaa")
		runes := []rune(suffix)

		// Increment the suffix
		for i := len(runes) - 1; i >= 0; i-- {
			if runes[i] < 'z' {
				runes[i]++
				return string(baseTarget) + string(runes)
			}
			runes[i] = 'a' // Reset to 'a' and carry over
		}

		// If all characters are 'z', add a new character (e.g., "z" -> "aa")
		return string(baseTarget) + string(runes) + "a"
	}

	// Determine the next target
	var target string
	if len(disks) == 0 {
		target = string(baseTarget) + "a" // Start with "BASEa"
	} else {
		target = generateNextTarget(disks[len(disks)-1].Target.Dev)
	}

	// Ensure the target is unique
	for usedTargets[target] {
		target = generateNextTarget(target)
	}

	disks[len(disks)-1].Target.Dev = target
}

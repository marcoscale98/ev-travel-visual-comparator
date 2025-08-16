class BatterySystem {
    constructor() {
        this.chargingStops = new Map(); // Track charging stops per vehicle
    }

    calculateBatteryCapacity(vehicleData) {
        // Extract distances from CSV data
        const firstLegDistance = vehicleData['first-leg-distance']; // km - full battery to 10%
        const nextLegDistance = vehicleData['next-leg-distance']; // km - 100% to 10% after charging
        
        return {
            firstLegDistance: firstLegDistance,
            nextLegDistance: nextLegDistance,
            currentLevel: 100, // Start at 100%
            isFirstLeg: true, // Track if this is the first leg or subsequent legs
            legStartDistance: 0 // Distance at start of current leg
        };
    }

    updateBatteryLevel(vehicle, distanceTraveled) {
        if (!vehicle.battery) return;
        
        // Calculate distance traveled in current leg
        const distanceInCurrentLeg = distanceTraveled - vehicle.battery.legStartDistance;
        
        if (vehicle.battery.isFirstLeg) {
            // First leg: depletes from 100% to 10% over first-leg-distance
            const currentLegRange = vehicle.battery.firstLegDistance;
            const batteryDepletion = (distanceInCurrentLeg / currentLegRange) * 90;
            vehicle.battery.currentLevel = Math.max(10, 100 - batteryDepletion);
        } else {
            // Subsequent legs: depletes from charged level to 10% over next-leg-distance
            const currentLegRange = vehicle.battery.nextLegDistance;
            const firstLegDistance = vehicle.battery.firstLegDistance;
            const nextLegDistance = vehicle.battery.nextLegDistance;
            const chargedLevel = 10 + 90 * (nextLegDistance / firstLegDistance);
            
            const availableBattery = chargedLevel - 10; // Battery available for this leg
            const batteryDepletion = (distanceInCurrentLeg / currentLegRange) * availableBattery;
            vehicle.battery.currentLevel = Math.max(10, chargedLevel - batteryDepletion);
        }
        
        return vehicle.battery.currentLevel;
    }

    needsCharging(vehicle) {
        return vehicle.battery && vehicle.battery.currentLevel <= 10;
    }

    startCharging(vehicle, currentTime, currentPosition) {
        if (!vehicle.charging) {
            vehicle.charging = {
                isCharging: true,
                startTime: currentTime,
                location: currentPosition,
                duration: 15 // 15 minutes
            };
            
            // Track this charging stop
            if (!this.chargingStops.has(vehicle.name)) {
                this.chargingStops.set(vehicle.name, []);
            }
            this.chargingStops.get(vehicle.name).push({
                location: Math.round(currentPosition),
                startTime: currentTime
            });
        }
    }

    updateCharging(vehicle, currentTime) {
        if (!vehicle.charging || !vehicle.charging.isCharging) return false;
        
        const chargingTime = currentTime - vehicle.charging.startTime;
        
        // Charging complete after 15 minutes
        if (chargingTime >= vehicle.charging.duration) {
            // Calculate realistic battery level after 15-minute charging
            // Based on consistent energy consumption rate across legs:
            // 90% battery over first-leg = (X-10)% battery over next-leg
            // Solving: X = 10 + 90 * (next-leg-distance / first-leg-distance)
            
            const firstLegDistance = vehicle.battery.firstLegDistance;
            const nextLegDistance = vehicle.battery.nextLegDistance;
            const chargedLevel = 10 + 90 * (nextLegDistance / firstLegDistance);
            
            vehicle.battery.currentLevel = Math.min(100, chargedLevel);
            
            vehicle.charging.isCharging = false;
            
            // Start new leg after charging
            vehicle.battery.isFirstLeg = false; // All subsequent legs use next-leg-distance
            vehicle.battery.legStartDistance = vehicle.position; // Reset leg start position
            
            return true; // Charging complete
        }
        
        return false; // Still charging
    }

    getChargingProgress(vehicle, currentTime) {
        if (!vehicle.charging || !vehicle.charging.isCharging) return 0;
        
        const chargingTime = currentTime - vehicle.charging.startTime;
        const progress = Math.min(chargingTime / vehicle.charging.duration, 1);
        
        return progress * 100; // Return as percentage
    }

    getVehicleState(vehicle) {
        if (vehicle.position >= 1000) return 'ARRIVED';
        if (vehicle.charging && vehicle.charging.isCharging) return 'CHARGING';
        return 'DRIVING';
    }

    getChargingStops(vehicleName) {
        return this.chargingStops.get(vehicleName) || [];
    }
}
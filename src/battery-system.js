class BatterySystem {
    static MINIMUM_BATTERY_LEVEL = 10; // Battery level that triggers charging
    static INITIAL_BATTERY_LEVEL = 100; // Starting battery level
    static CHARGING_DURATION_MINUTES = 15; // Fast charging duration
    static BATTERY_RANGE_PERCENTAGE = 90; // Usable battery range (100% - 10%)
    
    constructor() {
        this.chargingStops = new Map(); // Track charging stops per vehicle
    }

    calculateBatteryCapacity(vehicleData) {
        this._validateVehicleData(vehicleData);
        
        const firstLegDistance = vehicleData['first-leg-distance'];
        const nextLegDistance = vehicleData['next-leg-distance'];
        
        return {
            firstLegDistance,
            nextLegDistance,
            currentLevel: BatterySystem.INITIAL_BATTERY_LEVEL,
            isFirstLeg: true,
            legStartDistance: 0
        };
    }

    _validateVehicleData(vehicleData) {
        const requiredFields = ['first-leg-distance', 'next-leg-distance'];
        for (const field of requiredFields) {
            if (!vehicleData[field] || vehicleData[field] <= 0) {
                throw new Error(`Invalid vehicle data: ${field} must be a positive number`);
            }
        }
    }

    updateBatteryLevel(vehicle, distanceTraveled) {
        if (!vehicle.battery) return;
        
        const distanceInCurrentLeg = distanceTraveled - vehicle.battery.legStartDistance;
        
        if (vehicle.battery.isFirstLeg) {
            this._updateFirstLegBattery(vehicle.battery, distanceInCurrentLeg);
        } else {
            this._updateSubsequentLegBattery(vehicle.battery, distanceInCurrentLeg);
        }
        
        return vehicle.battery.currentLevel;
    }

    _updateFirstLegBattery(battery, distanceInCurrentLeg) {
        const batteryDepletion = (distanceInCurrentLeg / battery.firstLegDistance) * BatterySystem.BATTERY_RANGE_PERCENTAGE;
        battery.currentLevel = Math.max(
            BatterySystem.MINIMUM_BATTERY_LEVEL, 
            BatterySystem.INITIAL_BATTERY_LEVEL - batteryDepletion
        );
    }

    _updateSubsequentLegBattery(battery, distanceInCurrentLeg) {
        const chargedLevel = this._calculateChargedLevel(battery.firstLegDistance, battery.nextLegDistance);
        const availableBattery = chargedLevel - BatterySystem.MINIMUM_BATTERY_LEVEL;
        const batteryDepletion = (distanceInCurrentLeg / battery.nextLegDistance) * availableBattery;
        
        // Critical fix: Allow battery to go below 10% to trigger proper charging
        battery.currentLevel = Math.max(0, chargedLevel - batteryDepletion);
    }

    _calculateChargedLevel(firstLegDistance, nextLegDistance) {
        return BatterySystem.MINIMUM_BATTERY_LEVEL + 
               BatterySystem.BATTERY_RANGE_PERCENTAGE * (nextLegDistance / firstLegDistance);
    }

    needsCharging(vehicle) {
        return vehicle.battery && vehicle.battery.currentLevel <= BatterySystem.MINIMUM_BATTERY_LEVEL;
    }

    startCharging(vehicle, currentTime, currentPosition) {
        if (this._isVehicleCharging(vehicle)) {
            return; // Already charging, prevent duplicate charging sessions
        }

        vehicle.charging = this._createChargingSession(currentTime, currentPosition);
        this._recordChargingStop(vehicle, currentPosition, currentTime);
    }

    _isVehicleCharging(vehicle) {
        return vehicle.charging && vehicle.charging.isCharging;
    }

    _createChargingSession(currentTime, currentPosition) {
        return {
            isCharging: true,
            startTime: currentTime,
            location: currentPosition,
            duration: BatterySystem.CHARGING_DURATION_MINUTES
        };
    }

    _recordChargingStop(vehicle, currentPosition, currentTime) {
        if (!this.chargingStops.has(vehicle.name)) {
            this.chargingStops.set(vehicle.name, []);
        }
        
        this.chargingStops.get(vehicle.name).push({
            location: Math.round(currentPosition),
            startTime: currentTime
        });
    }

    updateCharging(vehicle, currentTime) {
        if (!this._isVehicleCharging(vehicle)) {
            return false;
        }
        
        const chargingTime = currentTime - vehicle.charging.startTime;
        
        if (this._isChargingComplete(chargingTime, vehicle.charging.duration)) {
            this._completeCharging(vehicle);
            return true; // Charging complete
        }
        
        return false; // Still charging
    }

    _isChargingComplete(chargingTime, duration) {
        return chargingTime >= duration;
    }

    _completeCharging(vehicle) {
        const chargedLevel = this._calculateChargedLevel(
            vehicle.battery.firstLegDistance, 
            vehicle.battery.nextLegDistance
        );
        
        vehicle.battery.currentLevel = Math.min(BatterySystem.INITIAL_BATTERY_LEVEL, chargedLevel);
        vehicle.charging.isCharging = false;
        
        // Transition to subsequent leg phase
        this._startNewLeg(vehicle);
    }

    _startNewLeg(vehicle) {
        vehicle.battery.isFirstLeg = false;
        vehicle.battery.legStartDistance = vehicle.position;
    }

    getChargingProgress(vehicle, currentTime) {
        if (!this._isVehicleCharging(vehicle)) {
            return 0;
        }
        
        const chargingTime = currentTime - vehicle.charging.startTime;
        const progress = Math.min(chargingTime / vehicle.charging.duration, 1);
        
        return progress * 100; // Return as percentage
    }

    getVehicleState(vehicle) {
        const TOTAL_DISTANCE = 1000; // km
        
        if (vehicle.position >= TOTAL_DISTANCE) return 'ARRIVED';
        if (this._isVehicleCharging(vehicle)) return 'CHARGING';
        return 'DRIVING';
    }

    getChargingStops(vehicleName) {
        return this.chargingStops.get(vehicleName) || [];
    }
}
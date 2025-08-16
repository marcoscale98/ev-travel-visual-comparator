class SimulationEngine {
    constructor() {
        this.canvas = document.getElementById('simulation-canvas');
        this.ctx = this.canvas.getContext('2d');
        this.dataLoader = new DataLoader();
        this.batterySystem = new BatterySystem();
        
        this.isRunning = false;
        this.speedMultiplier = 60;
        this.elapsedTime = 0;
        this.lastTimestamp = 0;
        this.allCompleted = false;
        
        this.vehicles = [];
        this.routeStartX = 100;
        this.routeEndX = 700;
        this.totalDistance = 1000;
        
        this.init();
    }

    async init() {
        try {
            const vehicleData = await this.dataLoader.loadVehicleData();
            const colors = this.dataLoader.getVehicleColors();
            
            console.log('Vehicle data loaded:', vehicleData);
            
            if (vehicleData.length === 0) {
                console.error('No vehicle data loaded, using fallback');
                this.createFallbackVehicles();
            } else {
                const names = this.dataLoader.getVehicleNames();
                
                this.vehicles = vehicleData.map((data, index) => ({
                    name: names[index],
                    color: colors[index],
                    speed: data.averageSpeed || 80,
                    position: 0,
                    x: this.routeStartX,
                    y: 100 + (index * 80),
                    completionTime: null,
                    hasCompleted: false,
                    battery: this.batterySystem.calculateBatteryCapacity(data),
                    charging: null,
                    vehicleData: data
                }));
            }
            
            console.log('Vehicles initialized:', this.vehicles);
            this.render();
        } catch (error) {
            console.error('Error in init:', error);
            this.createFallbackVehicles();
            this.render();
        }
    }

    createFallbackVehicles() {
        const colors = ['#28a745', '#dc3545', '#fd7e14'];
        const names = ['Porsche Taycan', 'Kia EV3', 'Fiat 500e'];
        const speeds = [85, 70, 60];
        
        this.vehicles = colors.map((color, index) => ({
            name: names[index],
            color: color,
            speed: speeds[index],
            position: 0,
            x: this.routeStartX,
            y: 100 + (index * 80),
            completionTime: null,
            hasCompleted: false,
            battery: this.batterySystem.calculateBatteryCapacity({ 'first-leg-distance': 250, 'next-leg-distance': 200 }),
            charging: null,
            vehicleData: { 'usable-battery': 50, 'first-leg-distance': 250, 'next-leg-distance': 200 }
        }));
    }

    start() {
        if (!this.isRunning) {
            this.isRunning = true;
            this.lastTimestamp = performance.now();
            this.animate();
        }
    }

    pause() {
        this.isRunning = false;
    }

    setSpeedMultiplier(multiplier) {
        this.speedMultiplier = multiplier;
    }

    animate(timestamp) {
        if (!this.isRunning) return;

        if (!this.lastTimestamp) this.lastTimestamp = timestamp;
        const deltaTime = timestamp - this.lastTimestamp;
        this.lastTimestamp = timestamp;

        this.update(deltaTime);
        this.render();

        requestAnimationFrame((ts) => this.animate(ts));
    }

    update(deltaTime) {
        if (!deltaTime || isNaN(deltaTime)) return;
        
        const realTimeSeconds = deltaTime / 1000;
        const simulatedMinutes = realTimeSeconds * this.speedMultiplier / 60;
        
        if (!isNaN(simulatedMinutes)) {
            this.elapsedTime += simulatedMinutes;
        }

        this.vehicles.forEach(vehicle => {
            if (vehicle.position < this.totalDistance && vehicle.speed && !isNaN(vehicle.speed)) {
                // Check if vehicle is charging
                if (vehicle.charging && vehicle.charging.isCharging) {
                    // Vehicle is charging - update charging progress
                    const chargingComplete = this.batterySystem.updateCharging(vehicle, this.elapsedTime);
                    if (chargingComplete) {
                        console.log(`${vehicle.name} finished charging at ${Math.round(vehicle.position)}km`);
                    }
                } else {
                    // Vehicle is driving - update position and battery
                    // All vehicles travel at constant highway speed of 110 km/h
                    const currentSpeed = 110; // km/h
                    const simulatedHours = simulatedMinutes / 60; // Convert minutes to hours
                    const distanceIncrement = currentSpeed * simulatedHours; // km/h * hours = km
                    
                    if (!isNaN(distanceIncrement)) {
                        const previousPosition = vehicle.position;
                        vehicle.position = Math.min(vehicle.position + distanceIncrement, this.totalDistance);
                        
                        // Update battery level based on distance traveled
                        this.batterySystem.updateBatteryLevel(vehicle, vehicle.position);
                        
                        // Check if vehicle needs charging and isn't already charging
                        if (this.batterySystem.needsCharging(vehicle) && !vehicle.hasCompleted && (!vehicle.charging || !vehicle.charging.isCharging)) {
                            this.batterySystem.startCharging(vehicle, this.elapsedTime, vehicle.position);
                            console.log(`${vehicle.name} started charging at ${Math.round(vehicle.position)}km with ${Math.round(vehicle.battery.currentLevel)}% battery`);
                        }
                        
                        // Check if vehicle just completed the journey
                        if (!vehicle.hasCompleted && previousPosition < this.totalDistance && vehicle.position >= this.totalDistance) {
                            vehicle.hasCompleted = true;
                            vehicle.completionTime = this.elapsedTime;
                            console.log(`${vehicle.name} completed in ${Math.floor(vehicle.completionTime / 60)}h ${Math.floor(vehicle.completionTime % 60)}m`);
                        }
                        
                        const progress = vehicle.position / this.totalDistance;
                        vehicle.x = this.routeStartX + (progress * (this.routeEndX - this.routeStartX));
                    }
                }
            }
        });

        // Check if all vehicles have completed and stop the simulation
        if (!this.allCompleted && this.vehicles.every(vehicle => vehicle.hasCompleted)) {
            this.allCompleted = true;
            this.pause();
            console.log('All vehicles completed the journey. Simulation stopped.');
        }

        this.updateTimeDisplay();
        this.updateBatteryDisplays();
    }

    render() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        this.drawRoute();
        this.drawDistanceMarkers();
        this.drawChargingStops();
        this.drawVehicles();
    }

    drawRoute() {
        this.ctx.strokeStyle = '#333';
        this.ctx.lineWidth = 3;
        this.ctx.beginPath();
        this.ctx.moveTo(this.routeStartX, 400);
        this.ctx.lineTo(this.routeEndX, 400);
        this.ctx.stroke();

        this.ctx.fillStyle = '#333';
        this.ctx.font = '14px Arial';
        this.ctx.fillText('0 km', this.routeStartX - 20, 420);
        this.ctx.fillText('1000 km', this.routeEndX - 30, 420);
    }

    drawDistanceMarkers() {
        const markers = [250, 500, 750];
        this.ctx.strokeStyle = '#666';
        this.ctx.lineWidth = 1;
        
        markers.forEach(distance => {
            const x = this.routeStartX + (distance / this.totalDistance) * (this.routeEndX - this.routeStartX);
            this.ctx.beginPath();
            this.ctx.moveTo(x, 395);
            this.ctx.lineTo(x, 405);
            this.ctx.stroke();
            
            this.ctx.fillStyle = '#666';
            this.ctx.font = '12px Arial';
            this.ctx.fillText(`${distance}`, x - 10, 390);
        });
    }

    drawChargingStops() {
        // Draw charging plug icons for all recorded charging stops
        this.vehicles.forEach(vehicle => {
            const chargingStops = this.batterySystem.getChargingStops(vehicle.name);
            chargingStops.forEach(stop => {
                const x = this.routeStartX + (stop.location / this.totalDistance) * (this.routeEndX - this.routeStartX);
                
                // Draw charging plug icon using vehicle's color
                this.ctx.fillStyle = vehicle.color;
                this.ctx.font = 'bold 16px Arial';
                this.ctx.fillText('🔌', x - 8, 385);
                
                // Draw small marker on route using vehicle's color
                this.ctx.strokeStyle = vehicle.color;
                this.ctx.lineWidth = 2;
                this.ctx.beginPath();
                this.ctx.moveTo(x, 395);
                this.ctx.lineTo(x, 405);
                this.ctx.stroke();
            });
        });
    }

    drawVehicles() {
        this.vehicles.forEach((vehicle, index) => {
            if (!vehicle.x || !vehicle.y || isNaN(vehicle.x) || isNaN(vehicle.y)) {
                console.log(`Skipping vehicle ${index} - invalid position:`, vehicle);
                return;
            }
            
            const state = this.batterySystem.getVehicleState(vehicle);
            
            // Draw vehicle circle with state-specific styling
            this.ctx.fillStyle = vehicle.color;
            this.ctx.beginPath();
            this.ctx.arc(vehicle.x, vehicle.y, 12, 0, 2 * Math.PI);
            this.ctx.fill();
            
            // Add special effects for charging state
            if (state === 'CHARGING') {
                // Pulsing effect for charging
                this.ctx.strokeStyle = '#007bff';
                this.ctx.lineWidth = 3;
                this.ctx.setLineDash([5, 5]);
                this.ctx.stroke();
                this.ctx.setLineDash([]); // Reset dash
            } else {
                this.ctx.strokeStyle = '#fff';
                this.ctx.lineWidth = 2;
                this.ctx.stroke();
            }
            
            // Position display
            this.ctx.fillStyle = '#333';
            this.ctx.font = '12px Arial';
            this.ctx.fillText(
                `${Math.round(vehicle.position || 0)} km`, 
                vehicle.x - 20, 
                vehicle.y - 20
            );
            
            // State-specific displays
            if (state === 'ARRIVED') {
                this.ctx.fillStyle = vehicle.color;
                this.ctx.font = 'bold 14px Arial';
                this.ctx.fillText('ARRIVED', vehicle.x - 25, vehicle.y + 25);
                
                // Display completion time
                if (vehicle.completionTime !== null) {
                    const hours = Math.floor(vehicle.completionTime / 60);
                    const minutes = Math.floor(vehicle.completionTime % 60);
                    this.ctx.font = '12px Arial';
                    this.ctx.fillText(`${hours}h ${minutes}m`, vehicle.x - 25, vehicle.y + 40);
                }
            } else if (state === 'CHARGING') {
                this.ctx.fillStyle = '#007bff';
                this.ctx.font = 'bold 14px Arial';
                this.ctx.fillText('CHARGING', vehicle.x - 30, vehicle.y + 25);
                
                // Show charging progress
                const progress = Math.round(this.batterySystem.getChargingProgress(vehicle, this.elapsedTime));
                this.ctx.font = '12px Arial';
                this.ctx.fillText(`${progress}%`, vehicle.x - 12, vehicle.y + 40);
            } else if (state === 'DRIVING') {
                // Show battery level
                const batteryLevel = Math.round(vehicle.battery.currentLevel);
                this.ctx.fillStyle = batteryLevel <= 10 ? '#dc3545' : '#28a745';
                this.ctx.font = '12px Arial';
                this.ctx.fillText(`${batteryLevel}%`, vehicle.x - 12, vehicle.y + 25);
            }
        });
    }

    updateTimeDisplay() {
        const hours = Math.floor(this.elapsedTime / 60);
        const minutes = Math.floor(this.elapsedTime % 60);
        document.getElementById('elapsed-time').textContent = `${hours}h ${minutes}m`;
    }

    updateBatteryDisplays() {
        const batteryIndicators = document.querySelectorAll('.battery-indicator');
        this.vehicles.forEach((vehicle, index) => {
            if (batteryIndicators[index] && vehicle.battery) {
                const batteryLevel = Math.round(vehicle.battery.currentLevel);
                const state = this.batterySystem.getVehicleState(vehicle);
                
                let displayText = `🔋 ${batteryLevel}%`;
                if (state === 'CHARGING') {
                    const progress = Math.round(this.batterySystem.getChargingProgress(vehicle, this.elapsedTime));
                    displayText = `⚡ Charging ${progress}%`;
                } else if (state === 'ARRIVED') {
                    displayText = `🏁 ${batteryLevel}%`;
                }
                
                batteryIndicators[index].textContent = displayText;
            }
        });
    }

    reset() {
        this.elapsedTime = 0;
        this.allCompleted = false;
        this.vehicles.forEach(vehicle => {
            vehicle.position = 0;
            vehicle.x = this.routeStartX;
            vehicle.completionTime = null;
            vehicle.hasCompleted = false;
            if (vehicle.battery) {
                vehicle.battery.currentLevel = 100;
                vehicle.battery.isFirstLeg = true;
                vehicle.battery.legStartDistance = 0;
            }
            vehicle.charging = null;
        });
        // Clear charging stops
        this.batterySystem.chargingStops.clear();
        this.updateTimeDisplay();
        this.updateBatteryDisplays();
        this.render();
    }
}

let simulationEngine;

document.addEventListener('DOMContentLoaded', () => {
    simulationEngine = new SimulationEngine();
});
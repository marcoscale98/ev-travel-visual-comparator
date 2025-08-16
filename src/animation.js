class SimulationEngine {
    constructor() {
        this.canvas = document.getElementById('simulation-canvas');
        this.ctx = this.canvas.getContext('2d');
        this.dataLoader = new DataLoader();
        this.batterySystem = new BatterySystem();
        
        this.isRunning = false;
        this.speedMultiplier = 900;
        this.elapsedTime = 0;
        this.lastTimestamp = 0;
        this.allCompleted = false;
        
        this.vehicles = [];
        
        // Layout configuration - centralized constants
        this.layout = {
            route: {
                startX: 100,
                endX: 700,
                totalDistance: 1000
            },
            vehicle: {
                startY: 100,
                verticalSpacing: 150,
                travelLineOffset: 70 // Distance below vehicle path to travel line
            },
            markers: {
                distances: [250, 500, 750],
                height: 10, // Half height of marker lines
                fontSize: 12
            },
            labels: {
                fontSize: 14,
                offset: 20
            }
        };
        
        // Cache for expensive calculations
        this.renderCache = {
            travelLinePositions: new Map(),
            vehiclePositions: new Map()
        };
        
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
                    x: this.layout.route.startX,
                    y: this.layout.vehicle.startY + (index * this.layout.vehicle.verticalSpacing),
                    completionTime: null,
                    hasCompleted: false,
                    battery: this.batterySystem.calculateBatteryCapacity(data),
                    charging: null,
                    vehicleData: data
                }));
                
                // Pre-calculate travel line positions for performance
                this._cacheRenderPositions();
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
            x: this.layout.route.startX,
            y: this.layout.vehicle.startY + (index * this.layout.vehicle.verticalSpacing),
            completionTime: null,
            hasCompleted: false,
            battery: this.batterySystem.calculateBatteryCapacity({ 'first-leg-distance': 250, 'next-leg-distance': 200 }),
            charging: null,
            vehicleData: { 'usable-battery': 50, 'first-leg-distance': 250, 'next-leg-distance': 200 }
        }));
        
        // Pre-calculate render positions
        this._cacheRenderPositions();
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
            if (vehicle.position < this.layout.route.totalDistance && vehicle.speed && !isNaN(vehicle.speed)) {
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
                        vehicle.position = Math.min(vehicle.position + distanceIncrement, this.layout.route.totalDistance);
                        
                        // Update battery level based on distance traveled
                        this.batterySystem.updateBatteryLevel(vehicle, vehicle.position);
                        
                        // Check if vehicle needs charging and isn't already charging
                        if (this.batterySystem.needsCharging(vehicle) && !vehicle.hasCompleted && (!vehicle.charging || !vehicle.charging.isCharging)) {
                            this.batterySystem.startCharging(vehicle, this.elapsedTime, vehicle.position);
                            console.log(`${vehicle.name} started charging at ${Math.round(vehicle.position)}km with ${Math.round(vehicle.battery.currentLevel)}% battery`);
                        }
                        
                        // Check if vehicle just completed the journey
                        if (!vehicle.hasCompleted && previousPosition < this.layout.route.totalDistance && vehicle.position >= this.layout.route.totalDistance) {
                            vehicle.hasCompleted = true;
                            vehicle.completionTime = this.elapsedTime;
                            console.log(`${vehicle.name} completed in ${Math.floor(vehicle.completionTime / 60)}h ${Math.floor(vehicle.completionTime % 60)}m`);
                        }
                        
                        const progress = vehicle.position / this.layout.route.totalDistance;
                        vehicle.x = this.layout.route.startX + (progress * (this.layout.route.endX - this.layout.route.startX));
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
        const routeStyle = { strokeStyle: '#333', lineWidth: 2 };
        const labelStyle = { fillStyle: '#333', font: `${this.layout.labels.fontSize}px Arial` };
        
        // Draw all travel lines efficiently
        this._drawTravelLines(routeStyle);
        
        // Draw route labels only on bottom line
        this._drawRouteLabels(labelStyle);
    }
    
    _drawTravelLines(style) {
        this._applyCanvasStyle(style);
        
        this.vehicles.forEach((vehicle, index) => {
            const lineY = this._getCachedTravelLineY(index);
            this._drawSingleLine(this.layout.route.startX, this.layout.route.endX, lineY);
        });
    }
    
    _drawRouteLabels(style) {
        this._applyCanvasStyle(style);
        
        const bottomLineY = this._getCachedTravelLineY(this.vehicles.length - 1);
        const labelOffset = this.layout.labels.offset;
        
        this.ctx.fillText('0 km', this.layout.route.startX - labelOffset, bottomLineY + labelOffset);
        this.ctx.fillText(`${this.layout.route.totalDistance} km`, this.layout.route.endX - 30, bottomLineY + labelOffset);
    }
    
    _drawSingleLine(startX, endX, y) {
        this.ctx.beginPath();
        this.ctx.moveTo(startX, y);
        this.ctx.lineTo(endX, y);
        this.ctx.stroke();
    }
    
    _applyCanvasStyle(style) {
        Object.entries(style).forEach(([property, value]) => {
            this.ctx[property] = value;
        });
    }

    getTravelLineY(vehicleIndex) {
        // Travel line positioned below each vehicle's path
        return this.layout.vehicle.startY + (vehicleIndex * this.layout.vehicle.verticalSpacing) + this.layout.vehicle.travelLineOffset;
    }
    
    _getCachedTravelLineY(vehicleIndex) {
        if (!this.renderCache.travelLinePositions.has(vehicleIndex)) {
            this.renderCache.travelLinePositions.set(vehicleIndex, this.getTravelLineY(vehicleIndex));
        }
        return this.renderCache.travelLinePositions.get(vehicleIndex);
    }
    
    _cacheRenderPositions() {
        // Pre-calculate all travel line positions for better performance
        this.vehicles.forEach((vehicle, index) => {
            this._getCachedTravelLineY(index);
        });
    }

    drawDistanceMarkers() {
        const markerStyle = { strokeStyle: '#666', lineWidth: 1 };
        const textStyle = { fillStyle: '#666', font: `${this.layout.markers.fontSize}px Arial` };
        const bottomLineY = this._getCachedTravelLineY(this.vehicles.length - 1);
        
        this._applyCanvasStyle(markerStyle);
        
        this.layout.markers.distances.forEach(distance => {
            const x = this._calculateMarkerX(distance);
            this._drawMarkerLine(x, bottomLineY);
            
            this._applyCanvasStyle(textStyle);
            this._drawMarkerLabel(distance, x, bottomLineY);
        });
    }
    
    _calculateMarkerX(distance) {
        const routeWidth = this.layout.route.endX - this.layout.route.startX;
        return this.layout.route.startX + (distance / this.layout.route.totalDistance) * routeWidth;
    }
    
    _drawMarkerLine(x, bottomLineY) {
        const markerHeight = this.layout.markers.height;
        this.ctx.beginPath();
        this.ctx.moveTo(x, bottomLineY - markerHeight / 2);
        this.ctx.lineTo(x, bottomLineY + markerHeight / 2);
        this.ctx.stroke();
    }
    
    _drawMarkerLabel(distance, x, bottomLineY) {
        this.ctx.fillText(`${distance}`, x - 10, bottomLineY - 10);
    }

    drawChargingStops() {
        this.vehicles.forEach((vehicle, vehicleIndex) => {
            const chargingStops = this.batterySystem.getChargingStops(vehicle.name);
            const lineY = this._getCachedTravelLineY(vehicleIndex);
            
            chargingStops.forEach(stop => {
                this._drawSingleChargingStop(vehicle, stop, lineY, vehicleIndex);
            });
        });
    }
    
    _drawSingleChargingStop(vehicle, stop, lineY, vehicleIndex) {
        const baseX = this._calculateChargingStopX(stop.location);
        
        // Add horizontal offset to prevent overlapping
        const horizontalOffset = (vehicleIndex - 1) * 12; // 12px spacing between vehicles
        const x = baseX + horizontalOffset;
        
        // Draw charging plug icon
        this._drawChargingIcon(vehicle.color, x, lineY);
        
        // Draw charging marker line
        this._drawChargingMarker(vehicle.color, x, lineY);
    }
    
    _calculateChargingStopX(location) {
        const routeWidth = this.layout.route.endX - this.layout.route.startX;
        return this.layout.route.startX + (location / this.layout.route.totalDistance) * routeWidth;
    }
    
    _drawChargingIcon(color, x, lineY) {
        const iconStyle = { fillStyle: color, font: 'bold 16px Arial' };
        this._applyCanvasStyle(iconStyle);
        this.ctx.fillText('🔌', x - 8, lineY - 15);
    }
    
    _drawChargingMarker(color, x, lineY) {
        const markerStyle = { strokeStyle: color, lineWidth: 4 };
        this._applyCanvasStyle(markerStyle);
        
        this.ctx.beginPath();
        this.ctx.moveTo(x, lineY - 8);
        this.ctx.lineTo(x, lineY + 8);
        this.ctx.stroke();
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
            vehicle.x = this.layout.route.startX;
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
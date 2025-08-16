class SimulationEngine {
    constructor() {
        this.canvas = document.getElementById('simulation-canvas');
        this.ctx = this.canvas.getContext('2d');
        this.dataLoader = new DataLoader();
        
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
                    hasCompleted: false
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
            hasCompleted: false
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
                const distanceIncrement = vehicle.speed * simulatedMinutes;
                
                if (!isNaN(distanceIncrement)) {
                    const previousPosition = vehicle.position;
                    vehicle.position = Math.min(vehicle.position + distanceIncrement, this.totalDistance);
                    
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
        });

        // Check if all vehicles have completed and stop the simulation
        if (!this.allCompleted && this.vehicles.every(vehicle => vehicle.hasCompleted)) {
            this.allCompleted = true;
            this.pause();
            console.log('All vehicles completed the journey. Simulation stopped.');
        }

        this.updateTimeDisplay();
    }

    render() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        this.drawRoute();
        this.drawDistanceMarkers();
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

    drawVehicles() {
        this.vehicles.forEach((vehicle, index) => {
            if (!vehicle.x || !vehicle.y || isNaN(vehicle.x) || isNaN(vehicle.y)) {
                console.log(`Skipping vehicle ${index} - invalid position:`, vehicle);
                return;
            }
            
            this.ctx.fillStyle = vehicle.color;
            this.ctx.beginPath();
            this.ctx.arc(vehicle.x, vehicle.y, 12, 0, 2 * Math.PI);
            this.ctx.fill();
            
            this.ctx.strokeStyle = '#fff';
            this.ctx.lineWidth = 2;
            this.ctx.stroke();
            
            this.ctx.fillStyle = '#333';
            this.ctx.font = '12px Arial';
            this.ctx.fillText(
                `${Math.round(vehicle.position || 0)} km`, 
                vehicle.x - 20, 
                vehicle.y - 20
            );
            
            if (vehicle.position >= this.totalDistance) {
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
            }
        });
    }

    updateTimeDisplay() {
        const hours = Math.floor(this.elapsedTime / 60);
        const minutes = Math.floor(this.elapsedTime % 60);
        document.getElementById('elapsed-time').textContent = `${hours}h ${minutes}m`;
    }

    reset() {
        this.elapsedTime = 0;
        this.allCompleted = false;
        this.vehicles.forEach(vehicle => {
            vehicle.position = 0;
            vehicle.x = this.routeStartX;
            vehicle.completionTime = null;
            vehicle.hasCompleted = false;
        });
        this.updateTimeDisplay();
        this.render();
    }
}

let simulationEngine;

document.addEventListener('DOMContentLoaded', () => {
    simulationEngine = new SimulationEngine();
});
class DataLoader {
    constructor() {
        this.vehicleData = [];
    }

    async loadVehicleData() {
        try {
            const response = await fetch('data/ev-data.csv');
            const csvText = await response.text();
            
            this.vehicleData = this.parseCSV(csvText);
            return this.vehicleData;
        } catch (error) {
            console.error('Error loading vehicle data:', error);
            return [];
        }
    }

    parseCSV(csvText) {
        const lines = csvText.trim().split('\n');
        const headers = lines[0].split(',');
        const vehicles = [];

        for (let i = 1; i < lines.length; i++) {
            const values = lines[i].split(',');
            const vehicle = {};
            
            headers.forEach((header, index) => {
                const value = values[index];
                if (header === 'ev-name') {
                    vehicle[header] = value;
                } else {
                    vehicle[header] = parseFloat(value);
                }
            });

            const averageSpeed = this.calculateAverageSpeed(vehicle);
            vehicle.averageSpeed = averageSpeed;
            
            vehicles.push(vehicle);
        }

        return vehicles;
    }

    calculateAverageSpeed(vehicle) {
        const totalDistance = 1000;
        const firstLegTime = vehicle['first-leg-duration'];
        const firstLegDist = vehicle['first-leg-distance'];
        
        const remainingDistance = totalDistance - firstLegDist;
        const nextLegDistance = vehicle['next-leg-distance'];
        const nextLegTime = vehicle['next-leg-duration'];
        
        const numberOfNextLegs = Math.ceil(remainingDistance / nextLegDistance);
        const totalTime = firstLegTime + (numberOfNextLegs * nextLegTime);
        
        return totalDistance / totalTime * 60;
    }

    getVehicleColors() {
        return ['#28a745', '#dc3545', '#fd7e14'];
    }

    getVehicleNames() {
        return this.vehicleData.map(vehicle => 
            vehicle['ev-name'].split(' ').slice(0, 2).join(' ')
        );
    }
}
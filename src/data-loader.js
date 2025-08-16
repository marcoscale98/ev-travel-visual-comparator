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

            // All vehicles travel at constant 110 km/h highway speed
            vehicle.speed = 110;
            
            vehicles.push(vehicle);
        }

        return vehicles;
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
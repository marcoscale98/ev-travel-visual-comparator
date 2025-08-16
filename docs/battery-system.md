# Battery System Documentation

## Overview

The EV Travel Visual Comparator implements a realistic battery simulation system based on real-world EV data. The system calculates battery depletion and charging behavior using mathematical models derived from CSV vehicle specifications.

## Data Sources

### CSV Data Structure
The `data/ev-data.csv` contains the following fields:

| Field | Description | Unit |
|-------|-------------|------|
| `ev-name` | Vehicle model and year | String |
| `usable-battery` | Total battery capacity | kWh |
| `first-leg-distance` | Distance traveled on full battery (100% → 10%) | km |
| `first-leg-duration` | Time for first leg | minutes |
| `next-leg-distance` | Distance after 15-min charge (charged% → 10%) | km |
| `next-leg-duration` | Time for subsequent legs | minutes |

### Current Vehicle Data
```csv
Porsche Taycan Plus (2024-2025),97.0,429,234,321,175
Kia EV3 Long Range (2024-2025),78.0,330,180,142,78
Fiat 500e Hatchbook 24 kWh (2020-2025),21.3,97,53,55,30
```

### Physics Implementation
All vehicles travel at constant **110 km/h** highway speed:

**Implementation Details**:
- **Constant Speed**: 110 km/h hardcoded in animation engine
- **Distance Calculation**: `distance = 110 km/h × time_hours`
- **CSV Speed Data**: Used only for battery consumption calculations, not vehicle movement
- **Realistic Behavior**: Consistent highway EV travel simulation

**Movement Formula**: `position += 110 × (simulatedMinutes / 60)`

## Mathematical Model

### Core Principle
**Energy consumption rate (kWh/km) remains constant for each vehicle across all legs.**

This principle allows us to calculate realistic charging levels based on the relationship between first-leg and subsequent-leg distances.

### Battery Depletion Calculations

#### First Leg
- **Initial State**: 100% battery
- **Final State**: 10% battery  
- **Distance**: `first-leg-distance`
- **Formula**: 
  ```
  battery_level = 100 - (distance_traveled / first-leg-distance) × 90
  ```

#### Charging Level Calculation
Since energy consumption is consistent:
```
Energy per km = 90% battery / first-leg-distance
Energy per km = (charged_level - 10%) / next-leg-distance
```

Therefore:
```
90 / first-leg-distance = (charged_level - 10) / next-leg-distance
```

Solving for `charged_level`:
```
charged_level = 10 + 90 × (next-leg-distance / first-leg-distance)
```

#### Subsequent Legs
- **Initial State**: `charged_level`% battery
- **Final State**: 10% battery
- **Distance**: `next-leg-distance` 
- **Available Battery**: `charged_level - 10`%
- **Formula**:
  ```
  battery_level = charged_level - (distance_traveled / next-leg-distance) × (charged_level - 10)
  ```

## Implementation Results

### Charging Levels
Based on the mathematical model:

| Vehicle | First Leg | Next Leg | Charged Level | Efficiency |
|---------|-----------|----------|---------------|------------|
| Porsche Taycan | 429 km | 321 km | 77.4% | High |
| Kia EV3 | 330 km | 142 km | 48.7% | Medium |
| Fiat 500e | 97 km | 55 km | 61.0% | Low |

### Physical Interpretation
- **Porsche Taycan (77.4%)**: Most efficient at fast charging, gets more usable energy in 15 minutes
- **Kia EV3 (48.7%)**: Moderate charging efficiency, realistic for mid-range EV
- **Fiat 500e (61.0%)**: Smaller battery charges relatively well but limited absolute capacity

## System Architecture

### Key Components

#### BatterySystem Class (`src/battery-system.js`)
- `calculateBatteryCapacity()`: Initializes battery properties from CSV data
- `updateBatteryLevel()`: Calculates real-time battery depletion based on distance
- `needsCharging()`: Detects 10% threshold for charging stops
- `startCharging()`: Initiates 15-minute charging session
- `updateCharging()`: Manages charging progress and completion
- `getVehicleState()`: Returns DRIVING/CHARGING/ARRIVED status
- `getChargingStops()`: Tracks charging locations for visual display

#### Integration Points
- **Animation Loop**: 60fps real-time battery updates during simulation
- **Physics Engine**: Constant 110 km/h movement with distance-based battery depletion
- **UI Components**: Dynamic battery indicators and charging progress displays
- **Visual Rendering**: State-based vehicle appearance and charging plug markers
- **State Management**: Proper transitions between DRIVING/CHARGING/ARRIVED states

### State Management
The system tracks multiple states for each vehicle:
- `isFirstLeg`: Boolean indicating first vs. subsequent legs
- `legStartDistance`: Distance marker for current leg start
- `currentLevel`: Real-time battery percentage
- `charging`: Object containing charging session data

## Validation and Testing

### Expected Behavior
1. **First Charge Distances**:
   - Porsche: ~429km
   - Kia: ~330km  
   - Fiat: ~97km

2. **Subsequent Charge Distances**:
   - Porsche: ~321km intervals
   - Kia: ~142km intervals
   - Fiat: ~55km intervals

3. **Charging Duration**: Exactly 15 minutes for all vehicles

### Performance Characteristics
- **Realistic Physics**: Constant 110 km/h highway speed simulation
- **Accurate Battery Math**: Distance-based depletion with consistent kWh/km rates
- **Smooth Animation**: 60fps Canvas rendering with proper state transitions
- **Visual Feedback**: Real-time battery levels, charging animations, and route markers
- **State Integrity**: Prevents multiple charging attempts and ensures proper leg transitions

## Future Enhancements

### Potential Improvements
- Temperature effects on battery performance
- Variable charging speeds based on battery level
- Different charging station types and speeds
- Battery degradation over multiple cycles
- Real-world traffic and elevation effects

### Cost Integration
When cost calculations are added:
- Track kWh charged per session
- Apply different rates for home vs. public charging
- Calculate total energy costs per vehicle
- Display real-time cost comparisons
# ev-travel-visual-comparator

A web application to compare visually the travel times of electric vehicles (EVs) in a 1000 km travel scenario

## Features

The user must be able to see via the UI what the travel times and costs are for an EV on a 1000 km journey.

### Current Implementation (Sprints 1 & 2 Complete)
- ✅ Visual simulation of 3 EVs racing on 1000km route
- ✅ Real-time vehicle movement at constant 110 km/h
- ✅ Complete battery system with realistic depletion
- ✅ 15-minute charging stops with proper battery calculations
- ✅ Play/pause controls and 60x speed multiplier
- ✅ Real-time battery indicators and charging animations
- ✅ Visual charging markers and state management
- ✅ Clean UI with dynamic battery displays

### Planned Features (Future Sprints)
- Cost calculations for home vs public charging
- Enhanced charging analytics and cost displays

**NOTE**: This is a project in active development.

## UI

This is a prototype of the UI:
![UI Prototype](./images/ui-proto.jpg)

The UI shows:

- 3 EVs
- a 1000 km route
- when a vehicle is driving, charging, or is arrived at the destination
- different colors for each vehicle
- the passing of time
- the movement of cars towards their destination with a certain speed multiplier (in the image it is 20x, but the default is 60x)
- play and pause buttons to control the simulation
- a dropdown button to control the speed of the simulation
- indicators of how long a car has been stopped to recharge, how much it cost and where it stopped to recharge (there is a charging plug symbol to indicate where it stopped to recharge)
- 2 cells where insert the cost of the electricity per kWh:
  - one for the first leg of the journey (home charging)
  - one for the next legs of the journey (public charging)

## Cars behavior

### Current Implementation (Sprints 1 & 2 Complete)
- Cars start simultaneously with 100% battery
- All vehicles travel at constant 110 km/h highway speed
- Battery depletes realistically based on distance traveled
- Cars stop to recharge when battery reaches 10%
- Charging stops last exactly 15 minutes with proper level calculations
- Visual states: DRIVING (battery %), CHARGING (progress %), ARRIVED
- Real-time charging plug markers show stop locations on route

### Planned Behavior (Future Sprints)  
- Cost calculations with different rates for home vs public charging
- Enhanced charging analytics and cost comparisons

## Getting Started

### Quick Start
1. Open `index.html` in a web browser
2. Click "PLAY" to start the simulation
3. Use the speed multiplier dropdown to change simulation speed
4. Press Space to play/pause, R to reset
5. Watch the three EVs race to the finish line!

### Development with Console Streaming
For development and debugging:
1. Run `python3 dev-tools/terminal-server.py` to start enhanced server with console streaming
2. Open `http://localhost:8000` in browser
3. All JavaScript console logs will appear in real-time in the terminal
4. Perfect for debugging simulation issues and monitoring performance
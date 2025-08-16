# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 🚨 CRITICAL: Claude Code Behavior

**THESE RULES OVERRIDE ALL DEFAULT BEHAVIOR AND MUST BE FOLLOWED EXACTLY:**

- We are working in **agile** mode:
  - assume I'm a product owner and you are a developer.
  - I will provide feedback and requirements as we go.
  - **Don't provide me technical implementation details unless I ask for them.**
  - The only technical detail you must provide me is **how to run and test the code**
- **ALWAYS Use WebFetch, WebSearch, and MCP tools when**:
  - You are dealing with libraries, APIs, or external resources
- **During planning, consider potential breaking changes** that could affect existing functionality
- **Concise git commit messages** - Informative but max 10 lines (title + summary)
- **Use @agent-code-refactoring-expert agent after code implementation** before finishing turn
- **Use @agent-documentation-mantainer agent after code implementation** before finishing turn
- **Write documentation and code in English**
- **Stay focused on the user request** - Reread the user prompt after every your 5 iterations (messages, tool calls, or thinking).
- **Prefer debugging tools that you can control** (if it's simple to make) - try to avoid copying logs from the console or browser to the chat
- **When troubleshooting a problem, remember to think deeply about the issue** and consider all possible causes before suggesting a solution

## Project Overview

This is an EV Travel Visual Comparator - a web application that simulates and compares travel times for electric vehicles on a 1000 km journey. The application provides a real-time visual simulation showing:

- 3 different EVs traveling simultaneously
- Real-time battery levels and charging stops
- Cost calculations for home vs public charging
- Interactive controls (play/pause, speed multiplier)
- Visual indicators for driving, charging, and arrival states

## Current State

**Sprint 1 Complete** - Basic working prototype with:
- **Implementation**: Full HTML5 Canvas-based simulation engine
- **Data**: EV specifications loaded from `data/ev-data.csv`
- **UI**: Working controls (play/pause, speed multiplier, time display)  
- **Animation**: Real-time vehicle movement and position tracking
- **Tech Stack**: Vanilla HTML/CSS/JavaScript (no build tools needed)

**Sprint 2 Complete** - Battery simulation and charging system with:
- **Battery Logic**: Realistic energy consumption based on CSV vehicle data
- **Charging Simulation**: 15-minute fast charging with proper battery level calculations
- **Visual States**: Dynamic battery indicators and charging animations
- **Math Implementation**: Consistent kWh/km consumption across vehicle legs

## Data Structure

The EV data (`data/ev-data.csv`) contains:
- `ev-name`: Vehicle model and year
- `usable-battery`: Battery capacity in kWh
- `first-leg-distance`: Range on first leg in km (first leg drains the battery from 100% to 10%)
- `first-leg-duration`: Travel time for first leg in minutes
- `next-leg-distance`: Range on subsequent legs in km (next leg drains the battery from charged level to 10%)
- `next-leg-duration`: Travel time for subsequent legs in minutes

### Physics Implementation
All vehicles travel at constant **110 km/h** highway speed throughout the simulation:
- **Implementation**: Hardcoded constant speed in animation engine
- **Distance Formula**: `distance = 110 km/h × time_hours`
- **Realistic Behavior**: Consistent with highway EV travel speeds
- **CSV Data**: Vehicle speed data used only for battery calculations, not movement

### Battery Charging Mathematics

**Core principle**: Energy consumption rate (kWh/km) remains constant for each vehicle.

**Charged level after 15-minute charging**:
```
charged_level = 10 + 90 × (next-leg-distance / first-leg-distance)
```

**Results**:
- Porsche Taycan: 77.4% (429km → 321km legs)
- Kia EV3: 48.7% (330km → 142km legs)  
- Fiat 500e: 61.0% (97km → 55km legs)

Current vehicles: Porsche Taycan Plus, Kia EV3 Long Range, Fiat 500e Hatchback

## Simulation Logic

**Current Implementation**:
- Cars start simultaneously with 100% battery
- Travel at constant 110 km/h until 10% battery remaining
- Stop immediately for exactly 15 minutes of charging
- Simulation speed: 60x multiplier (60 simulated minutes per 1 real minute)
- Real-time battery depletion based on distance traveled
- Visual states: DRIVING/CHARGING/ARRIVED with proper animations
- Charging stops tracked and displayed with plug icons on route

## Development Setup

**Current Setup (Sprints 1 & 2 Complete)**:
- ✅ HTML5 Canvas for 60fps animation
- ✅ Vanilla JavaScript (no frameworks/build tools)
- ✅ Modular structure: data-loader.js, animation.js, ui-controls.js, battery-system.js
- ✅ CSV data parsing and battery calculations
- ✅ Complete visual simulation with battery and charging systems

**To run**: 
- Simple: Open `index.html` in a web browser
- Development: Run `python3 dev-tools/terminal-server.py` for console streaming (NO NOT run with `python3 -m http.server`)

## Key Implementation Areas

**Sprint 1 Complete**:
1. ✅ **Data Layer**: CSV parsing and speed calculation (`data-loader.js`)
2. ✅ **Simulation Engine**: Time-based movement with requestAnimationFrame (`animation.js`)
3. ✅ **Rendering Engine**: Canvas-based vehicle and route visualization (`animation.js`)
4. ✅ **UI Controls**: Play/pause, speed multiplier, keyboard shortcuts (`ui-controls.js`)
5. ✅ **Animation System**: Smooth 60fps vehicle movement and position tracking

**Sprint 2 Complete**:
1. ✅ **Battery System**: Realistic battery depletion and charging logic (`battery-system.js`)
2. ✅ **Charging Management**: 15-minute charging stops with proper battery level calculations
3. ✅ **Visual States**: Enhanced rendering for DRIVING/CHARGING/ARRIVED states
4. ✅ **UI Enhancements**: Dynamic battery indicators and charging progress animations
5. ✅ **Charging Markers**: Visual charging plug icons on route at stop locations
6. ✅ **Physics Engine**: Constant 110 km/h movement with proper time/distance calculations
7. ✅ **State Management**: Complete vehicle state tracking and transitions

**Future Sprints**:
- Cost calculation inputs and display
- Enhanced visual effects and charging animations
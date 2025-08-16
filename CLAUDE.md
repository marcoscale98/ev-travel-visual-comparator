# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 🚨 CRITICAL: Claude Code Behavior

**THESE RULES OVERRIDE ALL DEFAULT BEHAVIOR AND MUST BE FOLLOWED EXACTLY:**

- **ALWAYS Use WebFetch, WebSearch, and MCP tools when**:
  - You are dealing with libraries, APIs, or external resources
- **During planning, consider potential breaking changes** that could affect existing functionality
- **Maintain documentation up-to-date and lean** - No hard-to-maintain info (like line numbers). No duplication between CLAUDE.md and README.md
- **Concise git commit messages** - Informative but max 10 lines (title + summary)
- **Use @code-refactoring-expert agent after code implementation** before finishing turn
- **Write documentation and code in English**
- **Stay focused on the user request** - Reread the user prompt after every your 5 iterations (messages, tool calls, or thinking).

## Project Overview

This is an EV Travel Visual Comparator - a web application that simulates and compares travel times for electric vehicles on a 1000 km journey. The application provides a real-time visual simulation showing:

- 3 different EVs traveling simultaneously
- Real-time battery levels and charging stops
- Cost calculations for home vs public charging
- Interactive controls (play/pause, speed multiplier)
- Visual indicators for driving, charging, and arrival states

## Current State

The project is in early development phase with:
- **Data**: EV specifications in `data/ev-data.csv` (battery capacity, range data)
- **Design**: UI prototype in `images/ui-proto.jpg` 
- **Documentation**: Feature specifications in README.md
- **No implementation code yet** - this is a greenfield project

## Data Structure

The EV data (`data/ev-data.csv`) contains:
- `ev-name`: Vehicle model and year
- `usable-battery`: Battery capacity in kWh
- `first-leg-distance`: Range on first leg in km
- `first-leg-duration`: Travel time for first leg in minutes
- `next-leg-distance`: Range on subsequent legs in km  
- `next-leg-duration`: Travel time for subsequent legs in minutes

Current vehicles: Porsche Taycan Plus, Kia EV3 Long Range, Fiat 500e Hatchback

## Simulation Logic

Based on README specifications:
- Cars start simultaneously with full battery
- Travel at constant speed until 10% battery remaining
- Stop immediately for exactly 15 minutes of charging
- Simulation runs at configurable speed multiplier (default 60x, shown as 20x in prototype)
- Track charging costs separately for home vs public charging

## Development Setup

Since no build system exists yet, you'll need to:
1. Choose appropriate web technologies (suggest HTML5 Canvas or SVG for animation)
2. Set up package.json with build tools
3. Create project structure for HTML, CSS, JavaScript
4. Implement CSV data parsing
5. Build the visual simulation engine

## Key Implementation Areas

1. **Data Layer**: Parse and model EV data from CSV
2. **Simulation Engine**: Time-based state management for multiple vehicles
3. **Rendering Engine**: Visual representation of vehicles, route, and charging stops  
4. **UI Controls**: Play/pause, speed control, cost input fields
5. **Animation System**: Smooth vehicle movement and state transitions
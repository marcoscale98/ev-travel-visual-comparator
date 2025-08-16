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
- **Maintain documentation up-to-date and lean** - No hard-to-maintain info (like line numbers). No duplication between CLAUDE.md and README.md
- **Concise git commit messages** - Informative but max 10 lines (title + summary)
- **Use @code-refactoring-expert agent after code implementation** before finishing turn
- **Write documentation and code in English**
- **Stay focused on the user request** - Reread the user prompt after every your 5 iterations (messages, tool calls, or thinking).
- **Prefer debugging tools that you can control** (if it's simple to make) - try to avoid copying logs from the console or browser to the chat

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

**Current Setup (Sprint 1)**:
- ✅ HTML5 Canvas for smooth animation
- ✅ Vanilla JavaScript (no frameworks/build tools)
- ✅ Modular structure: data-loader.js, animation.js, ui-controls.js
- ✅ CSV data parsing implemented
- ✅ Visual simulation engine working

**To run**: 
- Simple: Open `index.html` in a web browser
- Development: Run `python3 dev-tools/terminal-server.py` for console streaming

## Key Implementation Areas

**Sprint 1 Complete**:
1. ✅ **Data Layer**: CSV parsing and speed calculation (`data-loader.js`)
2. ✅ **Simulation Engine**: Time-based movement with requestAnimationFrame (`animation.js`)
3. ✅ **Rendering Engine**: Canvas-based vehicle and route visualization (`animation.js`)
4. ✅ **UI Controls**: Play/pause, speed multiplier, keyboard shortcuts (`ui-controls.js`)
5. ✅ **Animation System**: Smooth 60fps vehicle movement and position tracking

**Future Sprints**:
- Battery simulation and charging stop logic
- Cost calculation inputs and display
- Enhanced visual effects and charging animations
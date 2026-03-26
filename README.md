# Real-Time Odds Monitoring & Validation System

## Overview

This project is a real-time application designed to consume sports betting odds from an external API while applying validation safeguards to protect against unreliable data.

The system is not only focused on displaying odds, but on handling a critical real-world constraint:

As an API consumer, we must fully trust the API — while also assuming it can fail.

The application demonstrates how to:
- process real-time data safely
- detect incorrect or suspicious odds
- avoid blindly trusting external data
- simulate abnormal scenarios to validate system behavior

---

## Problem Context

When consuming external APIs in real-time systems, data cannot be blindly trusted.

Possible issues include:
- incorrect odds values
- wrong fixture mapping
- invalid market/outcome relationships
- delayed or stale updates
- inconsistent bookmaker data

If this data is used without validation, it can lead to incorrect decisions and financial loss.

This project introduces a validation layer between the data feed and the UI, ensuring that only consistent and reliable data is considered.

---

## System Architecture

The system is split into two main parts:

- Backend (Fastify)
- Frontend (React)

---

## High-Level Architecture

External Odds API
|
|  REST (fixtures, markets, odds snapshot)
v
Backend (Fastify)
|
|  normalized responses
v
Frontend (React)
|
|  WebSocket stream
v
Update Handler
|
v
Validation Layer
|
v
State (validated odds)
|
v
UI Rendering


Snapshot Load
↓
Initial State
↓
WebSocket Updates
↓
Odds Handler
↓
Validation Checks
↓
Simulation (optional)
↓
State Update
↓
UI Rendering


---

## Backend Design

The backend acts as a controlled entry point to the external API.

Responsibilities:
- Fetch sports and live fixtures
- Normalize fixture structure
- Fetch markets metadata
- Fetch odds snapshot per fixture
- Normalize bookmaker odds into a flat structure
- Build market → outcome → odds mapping
- Proxy participant and bookmaker images

Why this matters:
- simplifies frontend logic
- avoids inconsistent API structures
- prepares the system for caching and rate limiting

---

## Frontend Architecture

The frontend is responsible for:
- loading initial snapshot
- connecting to WebSocket
- handling real-time updates
- validating incoming odds
- simulating abnormal prices
- rendering only reliable data

---

## Snapshot + WebSocket Strategy

The system uses a hybrid approach:

Snapshot (REST):
- provides a consistent starting point

WebSocket:
- provides real-time updates

Why this is important:
- avoids incomplete state
- reduces race conditions
- ensures stable mapping between fixtures, markets and odds

---

## Odds Processing Pipeline

Every incoming odd follows this flow:


Incoming Odd
↓
Normalization
↓
Validation
↓
Simulation (if enabled)
↓
State Update
↓
UI Rendering


---

## Validation Logic

Validation is applied before storing any odd.

Checks performed:

1. Structural Validation
- odd must exist
- required fields must exist
- marketId, outcomeId and bookmaker must be valid

2. Activity Check
- inactive odds are ignored

3. Price Validation
- decimal price must be within valid range
- american price must be valid
- invalid formats are rejected

4. Fixture Consistency
- odd must belong to the current fixture

5. Market & Outcome Mapping
- market must exist
- outcome must belong to that market

6. Staleness Protection
- outdated odds are rejected

---

## Defensive Design Approach

The system assumes data may be incorrect.

Instead of failing:
- invalid odds are ignored
- existing odds are marked invalid
- system continues running safely

---

## Simulation System

The system supports simulation of abnormal scenarios.

Each odd can have simulation flags:
- outlier → small variation
- deviation → medium abnormal change
- harddeviation → extreme variation

Important design choice:
- simulatedPrice is generated once per update
- it is stored and reused
- it is not recalculated per render

This ensures consistency.

---

## Data Model

Each odd contains:

- price → decimal price
- priceAmerican → american format
- simulatedPrice → generated once
- displayPrice → value used for rendering
- marketId / outcomeId / bookmaker
- isValid → validation flag

---

## Display Logic

The system separates raw data from display logic.

raw data → price / priceAmerican
simulation → simulatedPrice
display → displayPrice


Display price is determined dynamically:

if simulation enabled → simulatedPrice
else → price or priceAmerican

---

## Real-Time Handling

WebSocket updates are processed using:

- filtering by bookmaker
- validation before state update
- normalization of incoming data
- incremental state updates

---

## Race Condition Handling

The system avoids crashes by:

- ignoring updates when fixture is not ready
- validating existence before accessing data
- using refs to access latest state inside async handlers

---

## State Management

The system uses:

- useImmer for safe updates
- useRef to avoid stale state in async callbacks
- separation between:
  - odds
  - simulation state
  - validation flags

---

## Validation Engine (Foundation)

A validation engine groups odds by:

This prepares the system for:
- comparing odds across bookmakers
- detecting abnormal deviations
- building a reference price

---

## Future Fault Detection

The system is designed to support:

- fault accumulation per odd
- increasing faults on anomalies
- decreasing faults on recovery

Possible states:
- OK
- SUSPICIOUS
- FROZEN

---

## Real-World Improvements

If this was production:

### API Key Security
- move API key to backend env variables
- never expose in frontend

### WebSocket Proxy Layer



Benefits:
- avoid IP limits
- centralize connection
- validate before broadcasting
- share data across users

### Centralized Validation
- move validation logic to backend
- ensure consistency across clients

### Caching
- cache fixtures and markets
- reduce API calls

### Monitoring
- detect anomalies
- track feed stability

### Deterministic Simulation
- replace random simulation with seeded values

### Containerization
- Docker for backend and frontend
- reproducible environments

---

## Trade-offs

Due to time constraints:

- validation engine is partially implemented
- simulation is random
- frontend connects directly to WebSocket
- no full fault scoring yet

These were conscious trade-offs to focus on core validation logic.

---

## How to Run

### Backend

cd server
npm install
node index.js


Runs on:
http://localhost:3500

---

### Frontend


cd frontend
npm install
npm run dev



Open:
http://localhost:5173

---

## Final Thoughts

This project focuses on a key real-world challenge:

Trusting external data without blindly accepting it.

The goal was to build a system that:
- processes real-time data
- validates it before use
- remains stable under faulty conditions

This approach reflects real-world trading systems where data reliability is critical.












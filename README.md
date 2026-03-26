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
- invalid market or outcome relationships
- delayed or stale updates
- inconsistent bookmaker data

If this data is used without validation, it can lead to incorrect decisions and financial loss.

This project introduces a validation layer between the data feed and the UI, ensuring that only consistent and reliable data is considered.

---

## System Architecture

The system is split into two main parts:

Backend (Fastify)  
Frontend (React)

---

## High-Level Architecture

External Odds API  
↓  
Backend (Fastify)  
↓  
Frontend (React)  
↓  
WebSocket Updates  
↓  
Odds Handler  
↓  
Validation Layer  
↓  
State (validated odds)  
↓  
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
Simulation  
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
- Build market and outcome relationships
- Proxy participant and bookmaker images

This simplifies frontend logic and creates a safer boundary between external data and the UI.

---

## Frontend Architecture

The frontend is responsible for:
- loading snapshot data
- connecting to WebSocket
- processing real-time updates
- validating incoming odds
- simulating abnormal prices
- rendering only validated data

---

## Snapshot and Real-Time Strategy

The system uses a hybrid model.

Snapshot provides a consistent starting point.  
WebSocket provides incremental updates.

This avoids incomplete state and reduces race conditions.

---

## Odds Processing Pipeline

Incoming Odd  
↓  
Normalization  
↓  
Validation  
↓  
Simulation  
↓  
State Update  
↓  
UI Rendering  

---

## Validation Logic

Validation is applied before any odd is accepted into state.

Checks performed:

Structural validation ensures the object exists and contains required fields.

Activity validation ensures only active odds are processed.

Price validation ensures decimal and american prices are within valid ranges.

Fixture validation ensures the odd belongs to the current fixture.

Market validation ensures the market exists inside the fixture.

Outcome validation ensures the outcome belongs to the market.

Staleness validation ensures outdated odds are ignored.

---

## Advanced Validation and Safety Model

This system follows a defensive validation model similar to real trading systems.

Instead of immediately trusting or removing data, each odd transitions through states.

### Odd Lifecycle

Incoming Odd  
↓  
Valid  
↓  
Suspicious  
↓  
Frozen or Removed  

### Suspicious State

If an odd fails validation temporarily or shows abnormal behaviour:
- it is not immediately removed
- it is marked as suspicious
- the system continues tracking it

This avoids reacting to temporary feed glitches.

### Frozen State

If an odd repeatedly fails validation:
- it is considered unreliable
- it is frozen and excluded from decision making

### Removal Strategy

An odd is removed only when:
- it becomes inactive
- it no longer belongs to the fixture
- its market or outcome becomes invalid
- it is consistently stale
- it repeatedly fails validation over time

This prevents aggressive removal due to temporary inconsistencies.

---

## Fixture Validation Strategy

Fixtures are also treated as dynamic and potentially unreliable.

A fixture is considered valid only if:
- it exists in the snapshot
- it contains valid markets
- it receives consistent updates

A fixture can be ignored or removed if:
- it stops receiving updates
- its structure becomes inconsistent
- its markets cannot be validated
- it becomes stale over time

This ensures that the system does not rely on broken fixture data.

---

## Deviation-Based Validation

The system is designed to compare odds within the same market and outcome.

Grouping logic:

marketId + outcomeId

This allows comparing multiple bookmakers offering the same outcome.

Future validation includes:
- calculating a reference price
- measuring deviation from the reference
- increasing fault score when deviation is too high

This mimics real-world anomaly detection in trading systems.

---

## Fault Accumulation Model

Each odd can accumulate faults over time.

When behaviour is abnormal:
- faults increase

When behaviour stabilizes:
- faults decrease

When faults exceed a threshold:
- the odd is considered unreliable
- it is frozen or removed

This avoids reacting to single anomalies and instead focuses on patterns.

---

## Simulation System

The system includes simulation to test abnormal conditions.

Each odd may have:
- outlier behaviour
- deviation behaviour
- hard deviation behaviour

Simulated prices are generated once and stored.

They are not recalculated on each render, ensuring consistency.

---

## Display Logic

The system separates data from presentation.

Raw data includes price and priceAmerican.  
Simulation includes simulatedPrice.  
Display value is derived dynamically.

This prevents inconsistencies and keeps logic clean.

---

## Real-Time Handling

WebSocket updates are processed using:
- bookmaker filtering
- validation before update
- normalization
- incremental updates

---

## Race Condition Handling

The system avoids runtime errors by:
- ignoring updates when fixture is not ready
- validating existence before access
- using refs to access latest state

---

## State Management

The system uses:
- useImmer for safe updates
- useRef to avoid stale closures
- separation of concerns between state types

---

## Real-World Security Improvements

If this system was deployed in production:

API keys would be moved to environment variables and never exposed to the frontend.

WebSocket connections would be proxied through the backend.

Client → Backend → External API

This would:
- avoid IP-based rate limits
- centralize data flow
- allow validation before broadcasting
- protect API credentials

Validation would run server-side to ensure consistency across all clients.

Caching would reduce API pressure.

Monitoring would detect abnormal patterns in real time.

Simulation would become deterministic instead of random.

Containers would be used for consistent environments.

---

## Trade-offs

Due to time constraints:

validation engine is partially implemented  
simulation is random  
frontend connects directly to WebSocket  
fault scoring system is not fully completed  

These were conscious decisions to focus on validation architecture.

---

## How to Run

Backend

cd server  
npm install  
node index.js  

Runs on  
http://localhost:3500  

Frontend

cd frontend  
npm install  
npm run dev  

Open  
http://localhost:5173  

---

## Final Thoughts

This project focuses on a key challenge in real systems:

trusting external data without blindly accepting it

The goal was to build a system that:
- processes real-time data
- validates it before use
- detects abnormal behaviour
- remains stable under faulty conditions

This reflects how real trading systems protect themselves from unreliable feeds.
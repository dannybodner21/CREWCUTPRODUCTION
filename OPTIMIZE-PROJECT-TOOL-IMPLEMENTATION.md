# Tool 1: optimizeProject - Implementation Complete ✅

## Overview
Successfully implemented the first development advisor tool for LEWIS that analyzes development sites and suggests optimal unit count, project size, and development approach.

## Files Modified

### 1. Tool Definition
**File:** `src/tools/custom-api-tool/index.ts`
- Added `optimizeProject` tool definition (lines 320-346)
- Parameters: `jurisdiction`, `lotSize`, `projectType` (Single-Family/Multi-Family), optional `budget`
- Triggers on queries like "what should I build?", "optimal project size", "how many units?"

### 2. API Handler
**File:** `src/app/api/lewis/route.ts`
- Added case `'optimizeProject'` handler (lines 441-567)
- Calculates 3 scenarios using real fee data from FeeCalculator
- **Multi-Family scenarios:**
  - Conservative: 2-story, 40 units/acre, 900 sq ft/unit
  - Moderate: 3-story, 60 units/acre, 850 sq ft/unit
  - Aggressive: 4-story, 80 units/acre, 800 sq ft/unit
- **Single-Family scenarios:**
  - Low: 4 units/acre, 2,500 sq ft homes
  - Medium: 6 units/acre, 2,200 sq ft homes
  - High: 8 units/acre, 2,000 sq ft homes
- Construction cost estimates: $200/sqft (MF), $150/sqft (SF)

### 3. Client-Side Implementation
**File:** `src/tools/custom-api-tool/actions.ts`
- Added `optimizeProject` function (lines 895-986)
- Calls API endpoint and formats response as table
- Shows recommendation (moderate scenario)
- Includes key considerations (dev fees %, monthly costs, timeline)
- Optional budget analysis

### 4. Interface Update
**File:** `src/tools/custom-api-tool/actions.ts`
- Added to `CustomApiToolAction` interface (line 140)

### 5. System Prompt Updates
**File:** `packages/const/src/settings/lewis-agent.ts`
- Added RULE #2 at top (lines 21-23)
- Enhanced "BE PROACTIVE" rule (lines 56-61)
- Added detailed tool selection rule #5 (lines 113-131)
- Emphasized: Call ONCE with Multi-Family as default
- Prevents asking clarifying questions

### 6. LEWIS Tool Manifest
**File:** `src/tools/custom-api-tool/index.ts`
- Updated systemRole to include optimizeProject in tools list (line 417)

## How It Works

1. **User asks:** "I have a 3-acre lot in Austin, what should I build?"

2. **LEWIS immediately calls:**
   ```typescript
   optimizeProject({
     jurisdiction: "Austin",
     lotSize: 3,
     projectType: "Multi-Family"
   })
   ```

3. **API calculates:**
   - Buildable area (60% of lot = 1.8 acres)
   - 3 scenarios with different densities
   - Real development fees from database for each scenario
   - Construction cost estimates
   - Total costs and per-unit breakdowns

4. **Returns formatted table:**
   ```
   | Scenario | Units | Total SF | Dev Fees | Est. Construction | Total Cost | Cost/Unit |
   |----------|-------|----------|----------|-------------------|------------|-----------|
   | Conservative | 72 | 64,800 | $X | $Y | $Z | $A |
   | Moderate | 108 | 91,800 | $X | $Y | $Z | $A |
   | Aggressive | 144 | 115,200 | $X | $Y | $Z | $A |
   ```

5. **Plus:**
   - Recommendation (moderate scenario)
   - Dev fees as % of total cost
   - Monthly operating costs
   - Timeline estimate (18-24 months)
   - Budget analysis (if provided)

## Testing

### Restart Dev Server
```bash
# Stop current server (Ctrl+C), then:
npm run dev
```

### Test Queries
```
"I have a 3-acre lot in Austin, what should I build?"
"What's optimal for my 5-acre site in Phoenix?"
"How many units can I build on 2 acres in Denver?"
"Best use for my 10-acre parcel in Los Angeles?"
```

### Expected Behavior
- LEWIS calls optimizeProject **immediately** (no questions)
- Shows formatted table with 3 scenarios
- Provides clear recommendation
- Asks about next steps (pro forma, compare other locations)

## Key Features

✅ **Proactive** - No clarifying questions, just runs analysis
✅ **Real Data** - Uses actual fee data from FeeCalculator
✅ **Multiple Scenarios** - Conservative, Moderate, Aggressive densities
✅ **Cost Breakdown** - Dev fees, construction, total costs
✅ **Recommendation** - Highlights best scenario with reasoning
✅ **Budget Analysis** - Optional budget constraint checking
✅ **Professional Format** - Clean table with all key metrics

## Next Steps

Ready to implement:
- **Tool 2:** `compareScenarios` - Compare same project across multiple cities
- **Tool 3:** `generateProForma` - Full financial analysis with revenue projections

## Notes

- Default is Multi-Family (most common development type)
- Assumes 60% buildable area (40% for setbacks, parking, etc.)
- Construction costs are market averages and should be adjusted per market
- User can request Single-Family by saying "single-family homes" explicitly

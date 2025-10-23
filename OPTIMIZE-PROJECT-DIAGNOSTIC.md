# optimizeProject Tool Diagnostic Guide

## What We Fixed

### 1. Added to Builtin Tool Action Interface ✅
**File:** `src/store/tool/slices/builtin/action.ts`
- Line 39: Added `optimizeProject: (params: any) => Promise<any>;` to interface
- Line 86: Added `optimizeProject: customApiActions.optimizeProject,` to export

### 2. Enhanced Logging ✅
**File:** `src/tools/custom-api-tool/actions.ts`
- Lines 897-924: Added extensive console logging to track execution

### 3. Verified All Components ✅
- ✅ Tool definition in `src/tools/custom-api-tool/index.ts:320-346`
- ✅ API handler in `src/app/api/lewis/route.ts:441-567`
- ✅ Client function in `src/tools/custom-api-tool/actions.ts:895-991`
- ✅ Interface declaration in `src/tools/custom-api-tool/actions.ts:140`
- ✅ Export mapping in `src/store/tool/slices/builtin/action.ts:86`
- ✅ System prompt in `packages/const/src/settings/lewis-agent.ts`

## Diagnostic Steps

### Step 1: Restart Dev Server (REQUIRED)
```bash
# Stop current server (Ctrl+C)
npm run dev
```

### Step 2: Open Browser Console
1. Open http://localhost:3010
2. Open DevTools (F12 or Cmd+Option+I)
3. Go to Console tab
4. Clear console

### Step 3: Test with LEWIS
Send message: **"I have a 3-acre lot in Austin, what should I build?"**

### Step 4: Check Console Output

You should see these logs in order:

```
🔧 LEWIS TOOL: optimizeProject called with: { jurisdiction: 'Austin', lotSize: 3, projectType: 'Multi-Family' }
🔧 LEWIS TOOL: Fetching from /api/lewis with action=optimizeProject
🔧 LEWIS TOOL: Response status: 200
🔧 LEWIS TOOL: optimizeProject API result: { success: true, data: {...} }
```

### Step 5: Troubleshooting

#### Problem: No console logs appear
**Cause:** Function isn't being called
**Fix:** Check that tool is registered
```bash
# Search for optimizeProject in builtin action
grep -n "optimizeProject" src/store/tool/slices/builtin/action.ts
# Should show lines 39 and 86
```

#### Problem: Logs show "Response status: 404"
**Cause:** API endpoint not found
**Fix:** Verify API handler exists
```bash
# Check API route has optimizeProject case
grep -n "case 'optimizeProject'" src/app/api/lewis/route.ts
# Should show line 441
```

#### Problem: Logs show "Response status: 500"
**Cause:** Server error in API handler
**Fix:** Check server console for error details

#### Problem: Logs show result but LLM gets params echo
**Cause:** Result format issue
**Fix:** Check that result is a string, not object

## Test API Directly

Create test file:

```typescript
// test-optimize-api.ts
async function testOptimizeAPI() {
  const response = await fetch('http://localhost:3010/api/lewis', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      action: 'optimizeProject',
      params: {
        jurisdiction: 'Austin',
        lotSize: 3,
        projectType: 'Multi-Family'
      }
    })
  });

  const result = await response.json();
  console.log('API Response:', JSON.stringify(result, null, 2));
}

testOptimizeAPI();
```

Run:
```bash
npx tsx test-optimize-api.ts
```

Expected output:
```json
{
  "success": true,
  "data": {
    "jurisdiction": "Austin",
    "lotSize": 3,
    "projectType": "Multi-Family",
    "buildableAcres": 1.8,
    "scenarios": [
      {
        "name": "Conservative (2-story)",
        "units": 72,
        "squareFeet": 64800,
        "developmentFees": 123456,
        "constructionCost": 12960000,
        "totalDevCost": 13083456,
        "costPerUnit": 181714,
        "monthlyFees": 500
      },
      ...
    ]
  }
}
```

## What Should Happen

1. **LEWIS receives message** → Triggers `optimizeProject` tool
2. **Client function called** → `src/tools/custom-api-tool/actions.ts:895`
3. **Fetches API** → `POST /api/lewis` with `action: optimizeProject`
4. **API processes** → `src/app/api/lewis/route.ts:441`
5. **Calculates fees** → Uses FeeCalculator for 3 scenarios
6. **Returns data** → `{ success: true, data: {...} }`
7. **Client formats** → Builds markdown table string
8. **Returns to LLM** → Formatted responseMessage string
9. **LLM displays** → Shows table to user

## Common Issues

### Issue: "Jurisdiction not found"
- **Cause:** City name not in database
- **Fix:** Try: "Phoenix", "Denver", "Los Angeles", "Portland", "Salt Lake City"

### Issue: Empty scenarios array
- **Cause:** FeeCalculator failing to get fees
- **Fix:** Check Supabase connection and database has fee data for city

### Issue: Tool called twice (Multi-Family then Single-Family)
- **Cause:** LLM ignoring system prompt
- **Fix:** System prompt updated to say "Call ONCE"

## Files Modified (for reference)

1. `src/tools/custom-api-tool/index.ts` - Tool definition
2. `src/app/api/lewis/route.ts` - API handler (case 'optimizeProject')
3. `src/tools/custom-api-tool/actions.ts` - Client implementation
4. `src/store/tool/slices/builtin/action.ts` - Action registration
5. `packages/const/src/settings/lewis-agent.ts` - System prompt

## Next Steps After Fixing

Once optimizeProject works:
- **Tool 2:** `compareScenarios` - Same project across multiple cities
- **Tool 3:** `generateProForma` - Full financial analysis

## Emergency Fallback

If still not working after all fixes, try this minimal implementation:

```typescript
// In src/tools/custom-api-tool/actions.ts
optimizeProject: async (params: any) => {
  return `Test response for ${params.jurisdiction} - ${params.lotSize} acres - ${params.projectType}`;
},
```

This will at least confirm the tool routing works.

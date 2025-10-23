# CRITICAL: Rebuild Required

## The Problem
The `optimizeProject` tool is registered but may not be working due to build cache.

## Solution: Clean Rebuild

```bash
# 1. Stop dev server (Ctrl+C if running)

# 2. Delete build cache
rm -rf .next

# 3. Reinstall dependencies (just in case)
pnpm install

# 4. Start fresh
npm run dev
```

## Quick Test After Rebuild

1. Open http://localhost:3010
2. Open browser console (F12)
3. Type to LEWIS: **"I have a 3-acre lot in Austin, what should I build?"**
4. Check console for logs starting with "🔧 LEWIS TOOL:"

## What You Should See

**In Console:**
```
🔧 LEWIS TOOL: optimizeProject called with: {jurisdiction: "Austin", lotSize: 3, projectType: "Multi-Family"}
🔧 LEWIS TOOL: Fetching from /api/lewis with action=optimizeProject
🔧 LEWIS TOOL: Response status: 200
🔧 LEWIS TOOL: optimizeProject API result: {...}
```

**In Chat:**
A formatted table with 3 scenarios showing units, square footage, development fees, construction costs, etc.

## If Still Not Working

Run this diagnostic command:
```bash
# Check if optimizeProject is in the built code
grep -r "optimizeProject" .next/server/app/api/lewis/route.js 2>/dev/null || echo "Not found in build"
```

If it says "Not found in build", the build is stale - repeat clean rebuild steps above.

## Alternative: Test API Directly

```bash
# Create quick test
cat > test-api-direct.sh << 'EOF'
#!/bin/bash
curl -X POST http://localhost:3010/api/lewis \
  -H "Content-Type: application/json" \
  -d '{
    "action": "optimizeProject",
    "params": {
      "jurisdiction": "Austin",
      "lotSize": 3,
      "projectType": "Multi-Family"
    }
  }' | jq
EOF

chmod +x test-api-direct.sh
./test-api-direct.sh
```

Expected: JSON with `success: true` and `data` containing scenarios.

## Summary of All Changes

These files were modified and **need to be in the build**:

1. ✅ `src/store/tool/slices/builtin/action.ts` - Added optimizeProject to interface and export
2. ✅ `src/tools/custom-api-tool/actions.ts` - Implemented optimizeProject function
3. ✅ `src/app/api/lewis/route.ts` - Added API handler case
4. ✅ `src/tools/custom-api-tool/index.ts` - Added tool definition
5. ✅ `packages/const/src/settings/lewis-agent.ts` - Updated system prompt

**All changes are syntactically correct (no TypeScript errors).**
**The issue is likely stale build cache.**

## Last Resort: Manual Verification

```typescript
// In browser console, check if function exists:
// (This won't work but shows the concept)
fetch('/api/lewis', {
  method: 'POST',
  headers: {'Content-Type': 'application/json'},
  body: JSON.stringify({action:'optimizeProject',params:{jurisdiction:'Austin',lotSize:3,projectType:'Multi-Family'}})
}).then(r=>r.json()).then(console.log)
```

Should return object with `success: true` and scenarios array.

# Frontend Markdown Rendering Bug - Currency Formatting

## Problem
LEWIS tool responses display broken currency formatting:
```
One-Time Fees:
395
,
706
(
```
Instead of: `One-Time Fees: $395,706 ($7,914/unit)`

## Root Cause
The **frontend markdown renderer** in LobeChat's `ChatItem` component is incorrectly parsing tool response strings.

## Evidence

### 1. Tool Returns Correct String
The tool (`compareCities` in `src/tools/custom-api-tool/actions.ts`) returns:
```typescript
"• One-Time Fees: $395,706 ($7,914/unit)\n"
```

Debug logging confirms this (line 794-795):
```typescript
console.log('🔍 Final responseMessage length:', responseMessage.length);
console.log('🔍 First 200 chars:', responseMessage.substring(0, 200));
```

### 2. Frontend Breaks It
The output shows:
- First render: `395,706(` (missing $, broken character-by-character)
- Then: `395,706(7,914/unit)` (duplicated, partially correct)

### 3. Selective Breakage
- ✅ Fee names with amounts render correctly: `$240,000`
- ✅ Monthly fees render correctly: `$122/month`
- ❌ One-time fees in parentheses break: `$395,706 ($7,914/unit)` → `395,706(395,706(7,914/unit)`

This indicates specific patterns trigger the bug.

## Technical Details

### Where The Bug Occurs
**File:** `src/features/Conversation/components/ChatItem/index.tsx`

**Flow:**
1. Tool returns formatted string (correct)
2. String passed to `ChatItem` component from `@lobehub/ui`
3. `markdownProps` configured (lines 185-204):
   ```typescript
   const markdownProps = useMemo(
     () => ({
       animated,
       components,
       customRender: markdownCustomRender,
       rehypePlugins: item?.role === 'user' ? undefined : rehypePlugins,
       remarkPlugins: item?.role === 'user' ? undefined : remarkPlugins,
     }),
     [...]
   );
   ```
4. Markdown renderer applies plugins
5. **Currency formatting breaks during markdown parsing**

### Markdown Configuration
- **rehypePlugins:** HTML post-processing (from `markdownElements`)
- **remarkPlugins:** Markdown pre-processing (from `markdownElements`)
- **customRender:** Custom rendering logic

One of these plugins is incorrectly parsing currency patterns.

## Attempted Fixes (All Failed)

### Backend/Tool Fixes Tried:
1. ✗ Changed `$${amount}` to `'$' + amount` (string concatenation)
2. ✗ Created explicit `formatCurrency` helper
3. ✗ Changed bullet points from `-` to `•`
4. ✗ Added LEWIS system prompt instructions
5. ✗ Wrapped in code blocks
6. ✗ Added extensive debug logging

**All confirmed:** The tool returns the correct string. The frontend breaks it.

## Solution Required

### Option 1: Disable Markdown Parsing for Tool Responses (Recommended)
Modify `ChatItem` to treat tool responses as plain text, not markdown:

```typescript
// In ChatItem/index.tsx
const markdownProps = useMemo(
  () => {
    // CRITICAL: For assistant messages containing tool responses,
    // disable markdown parsing to prevent currency formatting breaks
    const isToolResponse = item?.content?.includes('One-Time Fees:') ||
                          item?.content?.includes('compareCities') ||
                          item?.tools?.length > 0;

    if (isToolResponse && item?.role === 'assistant') {
      return {
        // Disable plugins that break currency formatting
        rehypePlugins: [],
        remarkPlugins: [],
        components: {
          // Render as pre-formatted text
          p: ({ children }) => <pre style={{ whiteSpace: 'pre-wrap' }}>{children}</pre>
        }
      };
    }

    return {
      animated,
      components,
      customRender: markdownCustomRender,
      rehypePlugins: item?.role === 'user' ? undefined : rehypePlugins,
      remarkPlugins: item?.role === 'user' ? undefined : remarkPlugins,
    };
  },
  [...]
);
```

### Option 2: Fix Markdown Plugin
Identify which rehype/remark plugin breaks currency formatting and fix it.

**Investigation needed:**
```typescript
// Check markdownElements.ts
import { markdownElements } from '../MarkdownElements';

const rehypePlugins = markdownElements.map((element) => element.rehypePlugin).filter(Boolean);
const remarkPlugins = markdownElements.map((element) => element.remarkPlugin).filter(Boolean);
```

Likely culprits:
- Plugin that processes parentheses `()`
- Plugin that processes dollar signs `$`
- Plugin that processes numbers/commas

### Option 3: Pre-escape Currency in Tools
Escape currency patterns before returning:

```typescript
// In actions.ts
const escapeCurrency = (str: string): string => {
  // Wrap currency amounts in code tags to prevent markdown parsing
  return str.replace(/(\$\d{1,3}(,\d{3})*)/g, '`$1`');
};

return escapeCurrency(responseMessage);
```

Output: `` `$395,706` `` renders as inline code, preserving formatting.

## Recommended Fix

**Use Option 3 (Pre-escape)** - quickest fix without touching frontend code:

1. Add escape function to `actions.ts`
2. Apply to all currency amounts before returning
3. Markdown renders as inline code: `$395,706`
4. Visual appearance nearly identical, formatting preserved

## Files to Modify

### Quick Fix (Option 3):
- `src/tools/custom-api-tool/actions.ts` - Add escape function

### Proper Fix (Option 1):
- `src/features/Conversation/components/ChatItem/index.tsx` - Disable markdown for tool responses

### Deep Fix (Option 2):
- `src/features/Conversation/components/MarkdownElements/index.ts` - Fix plugin
- Investigation required

## Test Case

After fix, LEWIS should display:
```
**Austin** (Cheapest ✓)
• One-Time Fees: $395,706 ($7,914/unit)
• Monthly Fees: $122/month
• Top 3 Fees:
  • Water Impact Fee: $240,000
  • Wastewater Impact Fee: $145,000
  • Plan Review Fee: $6,534
```

Not:
```
Austin (Cheapest ✓)
One-Time Fees:
395
,
706
(
```

## Priority
**HIGH** - This breaks core functionality of LEWIS cost comparisons, making output unreadable.

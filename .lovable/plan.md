

## Fix Build Errors + Map Implementation Gaps

### Build Error Fixes

**1. `PredictivePage.tsx` line 439** — The `PatternMatch.outcome` type is `'slipped' | 'delivered_on_time' | 'delivered_early'`, but the filter compares `'slipped'` against `'delivered_early'` in a way TS flags as impossible overlap. Fix: split the filter into two separate checks or use `includes()`.

**2. `VisibilityPage.tsx` line 636** — `xmlns` attribute on a `<div>` inside `<foreignObject>`. TypeScript's JSX types don't allow `xmlns` on `div`. Fix: cast the props or remove `xmlns` (browsers don't require it when the foreignObject already establishes the XHTML namespace).

### No Additional Feature Work

This response is purely the flow diagram + build error fixes. No new features added.

### Technical Details

**PredictivePage.tsx line 439:**
```typescript
// Current (broken):
patterns.filter(p => p.outcome === 'delivered_on_time' || p.outcome === 'delivered_early')
// The type says outcome can only be 'slipped' | 'delivered_on_time' | 'delivered_early'
// but TS infers a narrowed type after a prior filter. Fix by using a set:
patterns.filter(p => ['delivered_on_time', 'delivered_early'].includes(p.outcome))
```

**VisibilityPage.tsx line 636:**
```typescript
// Remove xmlns attribute or cast:
<div style={{...}}>  // just drop xmlns
```


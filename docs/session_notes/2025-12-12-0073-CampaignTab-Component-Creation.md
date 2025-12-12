# Session Notes: CampaignTab Component Creation

**Date**: 2025-12-12
**Session ID**: 0073
**Focus**: Creating CampaignTab.svelte component with sub-tab navigation

---

## Overview

Successfully created a new CampaignTab.svelte component that serves as a tabbed container for campaign-related content. The component implements three sub-tabs: Modules, Uploads, and Custom (GM-only), following existing design patterns from the codebase.

---

## What Was Implemented

### 1. Created CampaignTab.svelte Component

**Location:** `D:\Projects\VTT\apps\web\src\lib\components\campaign\CampaignTab.svelte`

**Component Structure:**
- Sub-tab navigation bar with three tabs
- Content area with slot-based architecture
- Conditional visibility for GM-only features
- Event forwarding system for child components

**Props:**
```typescript
export let campaignId: string;
export let gameSystemId: string | null = null;
export let isGM: boolean = false;
export let actors: any[] = [];
```

**Sub-tabs:**
1. **Modules** - For CompendiumBrowser integration (game system content)
2. **Uploads** - For asset upload and file browsing
3. **Custom** - For custom item template management (GM-only)

---

## Implementation Details

### Tab Configuration System

```typescript
type SubTab = 'modules' | 'uploads' | 'custom';

interface TabConfig {
  id: SubTab;
  label: string;
  visible: boolean;
}

$: subTabs = [
  { id: 'modules' as SubTab, label: 'Modules', visible: true },
  { id: 'uploads' as SubTab, label: 'Uploads', visible: true },
  { id: 'custom' as SubTab, label: 'Custom', visible: isGM }
].filter(tab => tab.visible) as TabConfig[];
```

**Features:**
- Dynamic tab visibility based on user role (GM check)
- Type-safe tab IDs
- Reactive tab filtering
- Auto-fallback to first visible tab if active tab becomes invalid

### Slot-Based Content Architecture

The component uses named slots for maximum flexibility:

```svelte
<slot name="modules">
  <!-- Default content if no slot provided -->
</slot>

<slot name="uploads">
  <!-- Default content if no slot provided -->
</slot>

<slot name="custom">
  <!-- Default content if no slot provided -->
</slot>
```

**Benefits:**
- Parent components can inject custom content
- Fallback to default placeholder content
- Maintains separation of concerns
- Easy to test and modify

### Default Content Displays

Each tab has informative placeholder content when no slot is provided:

**Modules Tab:**
- Shows game system ID and campaign ID when available
- Empty state with icon when no game system selected
- Clear messaging about requirements

**Uploads Tab:**
- Placeholder for asset uploader integration
- Shows campaign ID for context

**Custom Tab:**
- Placeholder for custom template management
- Shows actor count
- Indicates GM-only feature

---

## Design Patterns Used

### 1. Followed Existing Component Patterns

**Reference Components Analyzed:**
- `AssetBrowser.svelte` - Tab structure and styling
- `OverlaySidebar.svelte` - Tab navigation patterns
- `TabbedSidebar.svelte` - Simplified tab implementation

**Patterns Applied:**
- Consistent color scheme (#111827, #1f2937, #374151)
- Active tab highlighting with bottom border (#3b82f6)
- Hover states with color transitions
- Flex-based layout for responsive behavior

### 2. CSS Architecture

**Component Structure:**
```
.campaign-tab (flex column, full height)
  └─ .sub-tab-bar (flex row, shrink)
      └─ .sub-tab-button (flex item, transitions)
  └─ .sub-tab-content (flex column, grow)
      └─ .content-panel (flex column, fill)
```

**Key CSS Features:**
- Flexbox for responsive layout
- `min-height: 0` to prevent flex overflow
- Overflow hidden on parent, scroll on children
- Global selectors for slotted content styling

### 3. State Management

**Reactive Statements:**
```typescript
// Ensure active tab is always valid
$: if (!subTabs.find(t => t.id === activeSubTab)) {
  activeSubTab = subTabs[0]?.id || 'modules';
}
```

**Benefits:**
- Prevents invalid state
- Handles permission changes gracefully
- Auto-recovery from errors

---

## Styling Details

### Tab Navigation Bar

```css
.sub-tab-bar {
  display: flex;
  align-items: stretch;
  background-color: #111827;
  border-bottom: 2px solid #374151;
  flex-shrink: 0;
}
```

### Tab Buttons

**Default State:**
- Gray text (#9ca3af)
- Transparent background
- Subtle border

**Hover State:**
- Lighter text (#d1d5db)
- Darker background (#1f2937)
- Smooth transition (0.2s)

**Active State:**
- Blue text (#60a5fa)
- Darker background (#1f2937)
- Blue bottom border (#3b82f6)
- Positioned with pseudo-element

### Empty States

```css
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  padding: 2rem;
  gap: 1rem;
  color: #9ca3af;
  text-align: center;
}
```

**Includes:**
- SVG icon (64px, opacity 0.5)
- Primary message
- Secondary hint text
- Centered layout

---

## Testing Results

### Component Verification

**Svelte Type Check:**
- No TypeScript errors
- No component structure issues
- Props correctly typed

**File Verification:**
- File created successfully
- Size: 5,805 bytes
- Permissions: rw-r--r--
- Location: `D:\Projects\VTT\apps\web\src\lib\components\campaign\CampaignTab.svelte`

---

## Usage Examples

### Basic Usage

```svelte
<script>
  import CampaignTab from '$lib/components/campaign/CampaignTab.svelte';
  import CompendiumBrowser from '$lib/components/assets/CompendiumBrowser.svelte';
  import AssetBrowser from '$lib/components/assets/AssetBrowser.svelte';

  let campaignId = "campaign-123";
  let gameSystemId = "dnd5e";
  let isGM = true;
  let actors = [];
</script>

<CampaignTab
  {campaignId}
  {gameSystemId}
  {isGM}
  {actors}
>
  <div slot="modules">
    <CompendiumBrowser
      systemId={gameSystemId}
      {campaignId}
    />
  </div>

  <div slot="uploads">
    <AssetBrowser
      {campaignId}
    />
  </div>

  <div slot="custom">
    <!-- Custom template management component -->
  </div>
</CampaignTab>
```

### Using Default Content

```svelte
<!-- Shows placeholder content for all tabs -->
<CampaignTab
  campaignId="campaign-123"
  gameSystemId="dnd5e"
  isGM={false}
/>
```

### Event Forwarding

```svelte
<CampaignTab
  {campaignId}
  {gameSystemId}
  {isGM}
  {actors}
  on:create-actor={handleCreateActor}
  on:edit-actor={handleEditActor}
  on:select-token={handleSelectToken}
/>
```

---

## Files Created

1. **apps/web/src/lib/components/campaign/CampaignTab.svelte** (180 lines)
   - Main component implementation
   - TypeScript script section (70 lines)
   - Svelte template section (60 lines)
   - Scoped styles (50 lines)

---

## Component Features

### Accessibility
- Semantic HTML (buttons for tabs)
- Type attributes on buttons
- Clear visual states (hover, active)
- Proper nesting and structure

### Responsiveness
- Flexible width (100%)
- Overflow handling
- Scroll where needed
- Fills parent container

### Extensibility
- Slot-based content injection
- Event forwarding system
- Type-safe props
- Modular design

### Performance
- Minimal re-renders (reactive statements)
- CSS transitions (GPU accelerated)
- No unnecessary DOM updates
- Efficient slot rendering

---

## Integration Points

### Parent Components
- Campaign page containers
- Admin panels
- GM management interfaces

### Child Components (via slots)
- CompendiumBrowser (Modules tab)
- AssetBrowser/AssetUploader (Uploads tab)
- Custom template management (Custom tab)

### Event System
- `create-actor` - Forward to parent
- `edit-actor` - Forward to parent
- `select-token` - Forward to parent
- Extensible for additional events

---

## Next Steps

### Immediate Integration

1. **Import Component in Parent**
   - Find campaign page component
   - Import CampaignTab
   - Replace existing tab structure

2. **Populate Slots**
   - Add CompendiumBrowser to modules slot
   - Add AssetBrowser to uploads slot
   - Create custom template component for custom slot

3. **Wire Up Events**
   - Connect event handlers
   - Test event flow
   - Verify state updates

### Future Enhancements

1. **Tab State Persistence**
   - Remember last active tab
   - Store in localStorage or URL
   - Restore on component mount

2. **Loading States**
   - Add loading indicators
   - Skeleton screens for content
   - Progress feedback

3. **Tab Badges**
   - Show counts (e.g., "12 new items")
   - Notification indicators
   - Status markers

4. **Keyboard Navigation**
   - Arrow keys to switch tabs
   - Tab key for focus
   - Enter/Space to activate

---

## Key Learnings

### 1. Slot Architecture

**Decision:** Use named slots instead of dynamic component loading

**Rationale:**
- More flexible for parent components
- Easier to understand data flow
- Better type safety
- Simpler testing

**Benefits:**
- Parent controls what content is rendered
- No prop drilling required
- Easy to swap implementations
- Clear component boundaries

### 2. Conditional Tab Visibility

**Implementation:**
```typescript
$: subTabs = [
  { id: 'modules', label: 'Modules', visible: true },
  { id: 'uploads', label: 'Uploads', visible: true },
  { id: 'custom', label: 'Custom', visible: isGM }
].filter(tab => tab.visible);
```

**Benefits:**
- Clean declarative approach
- Easy to add more conditions
- Reactive to prop changes
- Type-safe filtering

### 3. Active Tab Validation

**Problem:** Active tab might not be visible after permission change

**Solution:** Reactive statement to auto-fallback
```typescript
$: if (!subTabs.find(t => t.id === activeSubTab)) {
  activeSubTab = subTabs[0]?.id || 'modules';
}
```

**Benefits:**
- Never shows invalid tabs
- Graceful degradation
- No error states
- Smooth UX

---

## Design Consistency

### Color Palette
- Background dark: `#111827`
- Background medium: `#1f2937`
- Border color: `#374151`
- Text inactive: `#9ca3af`
- Text hover: `#d1d5db`
- Text active: `#60a5fa`
- Accent blue: `#3b82f6`
- Hint text: `#6b7280`

### Spacing
- Tab padding: `0.75rem 1rem`
- Content padding: `2rem`
- Gap between elements: `1rem`
- Border thickness: `2px`

### Typography
- Tab font size: `0.875rem`
- Tab font weight: `500`
- Content font size: `0.9375rem`
- Hint font size: `0.8125rem`

### Transitions
- Duration: `0.2s`
- Timing: `ease`
- Properties: `all`

---

## References

**Component Patterns:**
- `apps/web/src/lib/components/assets/AssetBrowser.svelte`
- `apps/web/src/lib/components/sidebar/OverlaySidebar.svelte`
- `apps/web/src/lib/components/campaign/TabbedSidebar.svelte`

**Styling Guidelines:**
- Existing VTT component styles
- Tailwind-like utility values
- Dark theme color scheme

**TypeScript Patterns:**
- Svelte component typing
- Event dispatcher system
- Reactive statements

---

## Conclusion

Successfully created a reusable CampaignTab component that:
- ✅ Follows existing design patterns
- ✅ Uses slot-based architecture for flexibility
- ✅ Implements GM-only tab visibility
- ✅ Provides clear placeholder content
- ✅ Maintains consistent styling
- ✅ Supports event forwarding
- ✅ Passes type checking

The component is ready for integration into the campaign management interface and can be easily extended with actual content components for each tab.

**Session Status:** ✅ Complete

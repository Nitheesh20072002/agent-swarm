
# Quick Start - Dark Theme Guide

## 🎨 Color Quick Reference

### Primary Colors
```tsx
// Backgrounds
bg-slate-950        // Main background
bg-slate-900        // Cards & sidebar
bg-slate-800        // Hover states

// Text
text-white          // Headings
text-slate-200      // Body text
text-slate-400      // Muted text
text-slate-500      // Labels

// Actions
bg-indigo-600       // Primary buttons
bg-emerald-500/20   // Success badge
bg-rose-500/10      // Delete buttons

// Borders
border-slate-800    // Default borders
border-slate-700    // Hover borders
```

## 🔧 Common Patterns

### Card with Hover Effect
```tsx
<Card className="border-slate-800/50 bg-slate-900 hover:border-slate-700 hover:shadow-lg transition-all duration-300">
  {/* Content */}
</Card>
```

### Button with Gradient
```tsx
<Button className="bg-indigo-600 hover:bg-indigo-500 text-white">
  Action
</Button>
```

### Status Badge
```tsx
{/* Online */}
<Badge className="bg-emerald-500/20 text-emerald-400">
  <Circle size={8} className="fill-current text-emerald-500" />
  Online
</Badge>

{/* Offline */}
<Badge className="bg-slate-800 text-slate-500">
  <Circle size={8} className="fill-current text-slate-600" />
  Offline
</Badge>
```

### Skill Badge
```tsx
<Badge className="bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 hover:bg-indigo-500/20">
  JavaScript
</Badge>
```

### Delete Button
```tsx
<Button
  variant="outline"
  className="border-rose-500/30 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400"
>
  <Trash2 size={16} className="mr-1" />
  Delete
</Button>
```

## 📐 Spacing Guide

```tsx
// Padding
p-4    // 16px - Small cards
p-6    // 24px - Medium sections
p-8    // 32px - Large containers

// Gaps
gap-2  // 8px  - Tight groups
gap-4  // 16px - Standard spacing
gap-6  // 24px - Section spacing
gap-8  // 32px - Large sections

// Margins
mt-2   // 8px  - Close elements
mt-4   // 16px - Related sections
mt-6   // 24px - Separate sections
```

## 🎭 Animation Utilities

```tsx
// Hover lift
className="hover:-translate-y-1 hover:shadow-lg transition-all duration-300"

// Fade in
className="animate-fade-in"

// Slide up (notifications)
className="animate-slide-up"

// Scale in (cards)
className="animate-scale-in"

// Smooth transition
className="transition-all duration-300 ease-out"
```

## 📱 Responsive Classes

```tsx
// Mobile first
<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
  {/* 1 col mobile, 2 tablet, 4 desktop */}
</div>

// Hide on mobile
<div className="hidden md:flex">Desktop only</div>

// Show on mobile only
<div className="md:hidden">Mobile only</div>
```

## 🎯 Typography

```tsx
// Headings
<h1 className="text-4xl font-bold text-white">Title</h1>
<h2 className="text-2xl font-bold text-white">Section</h2>
<h3 className="text-lg font-semibold text-slate-200">Subsection</h3>

// Body
<p className="text-slate-200">Regular text</p>
<p className="text-sm text-slate-400">Secondary text</p>
<p className="text-xs text-slate-500">Muted text</p>
```

## 🔗 Navigation Links

```tsx
<Link
  href="/path"
  className="rounded-lg px-4 py-2.5 text-sm font-medium text-slate-400 transition-all duration-200 hover:bg-slate-800 hover:text-white"
>
  Nav Item
</Link>

// Active state
<Link
  href="/path"
  className="bg-slate-800 text-white"
>
  Active Item
</Link>
```

## 📋 Forms

```tsx
// Input
<Input
  className="bg-slate-800 border-slate-700 text-slate-200 focus:border-indigo-500"
  placeholder="Enter text..."
/>

// Label
<label className="text-sm font-medium text-slate-200">
  Field Name
</label>

// Error message
<p className="text-sm text-rose-400">Error message</p>
```

## 💡 Pro Tips

1. **Always use transitions**: Add `transition-all duration-300` for smooth interactions
2. **Consistent hover states**: Use `-translate-y-1` + `shadow-lg` for lift effect
3. **Proper contrast**: White for headings, slate-200 for body, slate-400 for muted
4. **Group hover**: Use `group` class on parent for coordinated hover effects
5. **Gradient overlays**: Add subtle gradients for depth and visual interest

## 🚀 Ready-to-Use Components

### Stat Card
```tsx
<Card className="group border-slate-800/50 bg-slate-900 hover:border-slate-700 hover:shadow-lg transition-all duration-300">
  <div className="absolute inset-0 bg-gradient-to-br from-indigo-600/5 via-transparent to-blue-600/5 opacity-0 group-hover:opacity-100 transition-opacity" />
  <CardHeader className="relative flex flex-row items-center justify-between pb-2">
    <CardTitle className="text-sm font-semibold text-slate-200">Title</CardTitle>
    <div className="rounded-lg bg-indigo-600/10 p-2.5 text-indigo-400">
      <Icon size={18} />
    </div>
  </CardHeader>
  <CardContent className="relative">
    <div className="text-3xl font-bold text-indigo-400">0</div>
    <p className="text-xs text-slate-500">Description</p>
  </CardContent>
</Card>
```

### Action Button
```tsx
<Button className="bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/20 transition-all duration-300">
  <Icon size={16} className="mr-2" />
  Action
</Button>
```

### Feature Card
```tsx
<div className="group rounded-lg border border-slate-800/50 bg-slate-800/30 p-4 transition-all duration-300 hover:border-slate-700 hover:bg-slate-800/50 hover:shadow-md">
  <h3 className="font-semibold text-slate-200 group-hover:text-indigo-400">Feature Title</h3>
  <p className="mt-1 text-sm text-slate-500">Feature description</p>
</div>
```

---

**Need help?** Check [`DARK_THEME_APPLIED.md`](./DARK_THEME_APPLIED.md) for complete documentation.

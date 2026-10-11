# Technical Design — F-01: Collapsible Executive Sidebar & Sub-Tab Navigation Layout

## 1. Component Topology
```
src/components/layout/
├── Sidebar.tsx                # Collapsible sidebar desktop (260px ↔ 72px) dengan tooltip hover
├── TopHeader.tsx              # Top status bar dengan toggle button, tanggal real-time, user profile & bank sync
└── MobileDrawerNav.tsx        # Vaul-based bottom/slide-up navigation drawer untuk mobile
```

## 2. State & Keyboard Shortcut
```typescript
const [isCollapsed, setIsCollapsed] = useState(false);

useEffect(() => {
  const handleKeyDown = (e: KeyboardEvent) => {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'b') {
      e.preventDefault();
      setIsCollapsed((prev) => !prev);
    }
  };
  window.addEventListener('keydown', handleKeyDown);
  return () => window.removeEventListener('keydown', handleKeyDown);
}, []);
```

## 3. Emil Kowalski Floating Pill Physics & Tooltips
- Lebar Sidebar: `w-64` ($256\text{px}$) saat expanded &rarr; `w-[72px]` saat collapsed dengan transisi `transition-all duration-200 ease-out`.
- Menu Icon tetap di tengah dengan padding presisi saat collapsed.
- Tooltip muncul menggunakan pseudo-element atau popover saat `isCollapsed === true`.

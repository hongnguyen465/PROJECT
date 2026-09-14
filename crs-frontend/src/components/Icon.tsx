type IconName = 'search' | 'bag' | 'user' | 'arrow' | 'plus' | 'minus' | 'trash' | 'menu' | 'close' | 'grid' | 'box' | 'orders' | 'tag' | 'chart' | 'logout' | 'chevron'

const paths: Record<IconName, string> = {
  search: 'M21 21l-4.3-4.3m2.3-5.2a7.5 7.5 0 11-15 0 7.5 7.5 0 0115 0z', bag: 'M6 8h12l1 13H5L6 8zm3 0a3 3 0 016 0', user: 'M20 21a8 8 0 00-16 0M12 13a4 4 0 100-8 4 4 0 000 8z', arrow: 'M5 12h14m-6-6 6 6-6 6', plus: 'M12 5v14m-7-7h14', minus: 'M5 12h14', trash: 'M5 7h14m-9 4v6m4-6v6M9 7V4h6v3m-9 0 1 14h10l1-14', menu: 'M4 6h16M4 12h16M4 18h16', close: 'M6 6l12 12M18 6L6 18', grid: 'M4 4h6v6H4zm10 0h6v6h-6zM4 14h6v6H4zm10 0h6v6h-6z', box: 'M4 7l8-4 8 4v10l-8 4-8-4V7zm0 0 8 4 8-4M12 11v10', orders: 'M6 3h12v18H6zM9 7h6M9 11h6M9 15h4', tag: 'M20 13l-7 7-10-10V4h6l11 9zM7 8h.01', chart: 'M4 19V5m0 14h16M8 16v-4m4 4V8m4 8v-7', logout: 'M10 17l5-5-5-5m5 5H3m9-9V3h8v18h-8v-1', chevron: 'M6 9l6 6 6-6',
}

export function Icon({ name, size = 20, strokeWidth = 1.8 }: { name: IconName; size?: number; strokeWidth?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={paths[name]} /></svg>
}

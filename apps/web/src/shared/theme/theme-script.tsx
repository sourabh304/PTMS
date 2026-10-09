import { ACCENT_PRESETS, DEFAULT_APPEARANCE, NAV_STORAGE_KEY, THEME_STORAGE_KEY } from './theme.config';

/**
 * Inline script executed before first paint so the stored appearance is applied
 * without a flash of the default theme. Kept dependency-free on purpose.
 */
export function ThemeScript() {
  const accents = Object.fromEntries(ACCENT_PRESETS.filter((a) => a.color).map((a) => [a.value, a.color]));
  const script = `(function(){try{
var d=${JSON.stringify(DEFAULT_APPEARANCE)},a=${JSON.stringify(accents)},s={};
try{s=JSON.parse(localStorage.getItem(${JSON.stringify(THEME_STORAGE_KEY)})||'{}')||{};}catch(e){}
var t=Object.assign({},d,s),r=document.documentElement;
var m=t.mode==='system'?(matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light'):t.mode;
r.dataset.style=t.style;r.dataset.mode=m;r.dataset.font=t.font;r.dataset.density=t.density;r.dataset.radius=t.radius;r.dataset.sidebar=t.sidebar;
var c=a[t.accent];if(c){var h=c.slice(1),n=parseInt(h,16),l=((n>>16)*299+((n>>8)&255)*587+(n&255)*114)/1000;
r.style.setProperty('--accent',c);r.style.setProperty('--accent-foreground',l>150?'#101828':'#ffffff');}
try{r.dataset.nav=localStorage.getItem(${JSON.stringify(NAV_STORAGE_KEY)})==='collapsed'?'collapsed':'expanded';}catch(e){}
}catch(e){}})();`;
  return <script dangerouslySetInnerHTML={{ __html: script }} />;
}

// Applies the saved colour theme before React renders (external file so a strict CSP allows it).
try {
  var t = localStorage.getItem('vs_theme');
  if (t === 'dark' || (!t && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
    document.documentElement.classList.add('dark');
  }
} catch (e) { /* storage blocked */ }

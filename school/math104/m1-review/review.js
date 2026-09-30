// Navigation touches only the study UI; all source definitions and solutions stay intact.
const storageKey = 'school:math104:m1-review';
const sectionIds = ['map', 'defs', 'tools', 'play', 'fixes', 'night'];
const sections = sectionIds.map((id) => document.getElementById(id));
const families = Array.from(document.querySelectorAll('#play > .fam'));
const familyIds = families.map((family) => family.id);
const controls = document.querySelector('.study-controls');
const sectionSelect = document.getElementById('studySection');
const familySelect = document.getElementById('studyFamily');
const familyRow = document.getElementById('studyFamilyRow');
const focusButton = document.getElementById('studyFocus');
const allButton = document.getElementById('studyAll');
const prevButton = document.getElementById('studyPrev');
const nextButton = document.getElementById('studyNext');
const position = document.getElementById('studyPosition');
const themeButton = document.getElementById('studyTheme');
const validTargets = ['map', 'defs', 'tools', ...familyIds, 'fixes', 'night'];
const headings = new Map(validTargets.map((id) => {
  const element = document.getElementById(id);
  const heading = element.querySelector(id.startsWith('f-') ? 'h3' : 'h2');
  heading.tabIndex = -1;
  return [id, heading];
}));

families.forEach((family, index) => {
  const option = document.createElement('option');
  option.value = family.id;
  option.textContent = `${index + 1}. ${family.querySelector('h3').textContent}`;
  familySelect.append(option);
});

let saved = {};
try { saved = JSON.parse(localStorage.getItem(storageKey) || '{}') || {}; } catch { /* Browsing without storage still works. */ }
let mode = saved.mode === 'all' ? 'all' : 'focus';
let currentFamily = familyIds.includes(saved.family) ? saved.family : familyIds[0];
let currentSection = sectionIds.includes(saved.section) ? saved.section : 'map';
const initialHash = location.hash.slice(1);
if (familyIds.includes(initialHash)) { currentFamily = initialHash; currentSection = 'play'; }
else if (sectionIds.includes(initialHash)) currentSection = initialHash;

const bottom = document.createElement('div');
bottom.className = 'study-bottom';
bottom.setAttribute('aria-label', 'Continue studying');
const bottomPrevious = document.createElement('button');
const bottomNext = document.createElement('button');
for (const button of [bottomPrevious, bottomNext]) {
  button.type = 'button';
  const label = document.createElement('small');
  const title = document.createElement('span');
  button.append(label, title);
  bottom.append(button);
}
document.querySelector('.wrap > footer').before(bottom);

function save() {
  try { localStorage.setItem(storageKey, JSON.stringify({ mode, section: currentSection, family: currentFamily, theme: document.documentElement.dataset.theme || '' })); } catch { /* No account or storage permission is required. */ }
}
function targetId() { return currentSection === 'play' ? currentFamily : currentSection; }
function currentIndex() { return validTargets.indexOf(targetId()); }
function labelFor(id) { return headings.get(id)?.textContent || ''; }
function updateOffset() {
  document.documentElement.style.setProperty('--study-offset', `${Math.ceil(controls.getBoundingClientRect().height) + 28}px`);
}
function render() {
  document.body.classList.toggle('study-focus', mode === 'focus');
  sections.forEach((section) => { section.hidden = mode === 'focus' && section.id !== currentSection; });
  families.forEach((family) => { family.hidden = mode === 'focus' && family.id !== currentFamily; });
  sectionSelect.value = currentSection;
  familySelect.value = currentFamily;
  familyRow.hidden = currentSection !== 'play';
  focusButton.setAttribute('aria-pressed', String(mode === 'focus'));
  allButton.setAttribute('aria-pressed', String(mode === 'all'));
  const index = currentIndex();
  position.textContent = `${index + 1} / ${validTargets.length}`;
  prevButton.disabled = bottomPrevious.disabled = index === 0;
  nextButton.disabled = bottomNext.disabled = index === validTargets.length - 1;
  bottomPrevious.querySelector('small').textContent = '← Previous';
  bottomNext.querySelector('small').textContent = 'Next →';
  bottomPrevious.querySelector('span').textContent = labelFor(validTargets[index - 1]) || 'Start of review';
  bottomNext.querySelector('span').textContent = labelFor(validTargets[index + 1]) || 'End of review';
  save();
  requestAnimationFrame(() => { updateOffset(); updateMathOverflow(); });
}
function scrollToCurrent({ focus = true } = {}) {
  const heading = headings.get(targetId());
  if (focus) heading.focus({ preventScroll: true });
  const offset = controls.getBoundingClientRect().height + 24;
  const top = heading.getBoundingClientRect().top + window.scrollY - offset;
  window.scrollTo({ top: Math.max(0, top), behavior: 'instant' });
}
function go(id, { updateHash = true, scroll = true } = {}) {
  if (id === 'play') id = currentFamily;
  if (!validTargets.includes(id)) return;
  if (familyIds.includes(id)) { currentSection = 'play'; currentFamily = id; }
  else currentSection = id;
  render();
  if (updateHash) history.replaceState(null, '', `#${id}`);
  if (scroll) requestAnimationFrame(() => scrollToCurrent());
}
function step(direction) { go(validTargets[currentIndex() + direction]); }
sectionSelect.addEventListener('change', () => go(sectionSelect.value));
familySelect.addEventListener('change', () => go(familySelect.value));
prevButton.addEventListener('click', () => step(-1));
nextButton.addEventListener('click', () => step(1));
bottomPrevious.addEventListener('click', () => step(-1));
bottomNext.addEventListener('click', () => step(1));
focusButton.addEventListener('click', () => { mode = 'focus'; render(); requestAnimationFrame(() => scrollToCurrent()); });
allButton.addEventListener('click', () => { mode = 'all'; render(); requestAnimationFrame(() => scrollToCurrent()); });
document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
  const id = anchor.getAttribute('href').slice(1);
  if (validTargets.includes(id) || id === 'play') anchor.addEventListener('click', (event) => { event.preventDefault(); go(id); });
});
window.addEventListener('hashchange', () => go(location.hash.slice(1), { updateHash: false }));

const prefersDark = window.matchMedia('(prefers-color-scheme: dark)');
function activeTheme() { return document.documentElement.dataset.theme || (prefersDark.matches ? 'dark' : 'light'); }
function updateThemeLabel() {
  const dark = activeTheme() === 'dark';
  themeButton.setAttribute('aria-label', dark ? 'Use light theme' : 'Use dark theme');
  themeButton.setAttribute('aria-pressed', String(dark));
  document.getElementById('studyThemeLabel').textContent = dark ? 'Light' : 'Dark';
}
if (saved.theme === 'light' || saved.theme === 'dark') document.documentElement.dataset.theme = saved.theme;
updateThemeLabel();
prefersDark.addEventListener('change', updateThemeLabel);
themeButton.addEventListener('click', () => {
  document.documentElement.dataset.theme = activeTheme() === 'dark' ? 'light' : 'dark';
  updateThemeLabel();
  save();
});

// The SVG retains its readable font size. Wide math gets its own scroll area;
// it never changes the document width or asks the reader to drag the whole page.
function updateMathOverflow() {
  document.querySelectorAll('mjx-container[jax="SVG"]').forEach((math) => {
    if (!math.getBoundingClientRect().width) return;
    const overflowing = math.scrollWidth > math.clientWidth + 2;
    math.classList.toggle('math-overflow', overflowing);
    if (overflowing) {
      math.tabIndex = 0;
      math.setAttribute('role', 'group');
      math.setAttribute('aria-label', 'Scrollable equation. Swipe within this equation, or use left and right arrow keys.');
    } else {
      math.removeAttribute('tabindex');
      math.removeAttribute('role');
      math.removeAttribute('aria-label');
    }
    if (math.getAttribute('display') === 'true') {
      let hint = math.nextElementSibling;
      if (!hint?.classList.contains('math-scroll-hint')) {
        hint = document.createElement('span');
        hint.className = 'math-scroll-hint';
        hint.textContent = '↔ Swipe this equation to see the rest';
        hint.setAttribute('aria-hidden', 'true');
        math.after(hint);
      }
      hint.hidden = !overflowing;
    }
  });
}
function mathReady() {
  const startup = window.MathJax?.startup?.promise;
  if (startup) startup.then(() => requestAnimationFrame(updateMathOverflow)).catch(() => {});
}
document.querySelector('script[src*="mathjax"]')?.addEventListener('load', mathReady);
mathReady();
window.addEventListener('resize', () => { updateOffset(); updateMathOverflow(); }, { passive: true });
window.addEventListener('pageshow', () => { updateOffset(); updateMathOverflow(); });
document.fonts?.ready.then(() => { updateOffset(); updateMathOverflow(); });
document.addEventListener('toggle', () => requestAnimationFrame(updateMathOverflow), true);
new ResizeObserver(updateOffset).observe(controls);
render();
if (initialHash && (validTargets.includes(initialHash) || initialHash === 'play')) {
  requestAnimationFrame(() => scrollToCurrent({ focus: false }));
}

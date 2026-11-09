const root = document.documentElement;
const brand = document.querySelector('.hero-composition');
const story = document.querySelector('.echo-story');
const stage = document.querySelector('.echo-stage');
const stack = document.querySelector('.remember-stack');
const editor = document.querySelector('.echo-editor');
const typedWords = document.querySelector('.typed-words');
const targetWords = document.querySelector('.native-word-anchor');
const saveButton = document.querySelector('.example-save');
const saveLabel = document.querySelector('.save-label');
const result = document.querySelector('.echo-result');
const status = document.querySelector('.save-status');
const example = Array.from(typedWords.textContent);
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
const localPreview = ['127.0.0.1', 'localhost', '[::1]'].includes(location.hostname)
  || location.protocol === 'file:';
const previewMotion = localPreview && new URLSearchParams(location.search).get('motion') === 'full';
const clamp = value => Math.max(0, Math.min(1, value));
const smooth = value => value * value * (3 - 2 * value);
const settle = value => 1 - Math.pow(1 - value, 4);
const set = (name, value) => root.style.setProperty(name, value);
let entryWidth = window.innerWidth;
let entryHeight = window.innerHeight;
let enabled = false;
let frame = 0;
let lastCharacterCount = -1;
let manual = null;
let wordJourney = { x: 0, y: 0, scale: 1 };

function configureStory() {
  if (frame) cancelAnimationFrame(frame);
  frame = 0;
  manual = null;
  root.classList.remove('scroll-story-ready');
  ['--word-x', '--word-y', '--word-scale', '--bridge-opacity', '--editor-enter',
    '--editor-chrome', '--result-opacity', '--native-copy-opacity', '--reason-opacity'].forEach(name => root.style.removeProperty(name));
  set('--entry-height', `${entryHeight}px`);
  typedWords.textContent = example.join('');
  lastCharacterCount = example.length;
  editor.inert = false;
  result.removeAttribute('aria-hidden');
  status.textContent = '';
  enabled = (!reducedMotion.matches || previewMotion) && entryHeight >= 580;
  if (enabled) {
    root.classList.add('scroll-story-ready');
    if (stack.offsetHeight + 96 > entryHeight) {
      enabled = false;
      root.classList.remove('scroll-story-ready');
    }
  }
  root.dataset.motion = enabled ? 'centered-morph' : 'natural-flow';
  if (!enabled) {
    root.dataset.scene = 'complete';
    if (document.activeElement === saveButton) result.focus({ preventScroll: true });
    return;
  }
  const source = typedWords.getBoundingClientRect();
  const target = targetWords.getBoundingClientRect();
  wordJourney = {
    x: target.left - source.left,
    y: target.top - source.top,
    scale: parseFloat(getComputedStyle(targetWords).fontSize) / parseFloat(getComputedStyle(typedWords).fontSize)
  };
  // Natural-flow separation: the next image reaches the viewport only after
  // the centered composition's last line has cleared. There is no opacity gate.
  set('--scene-clearance', `${Math.ceil(stack.getBoundingClientRect().bottom - stage.getBoundingClientRect().top) + 24}px`);
  updateStory();
}

function updateStory() {
  frame = 0;
  if (!enabled) return;
  const progress = -story.getBoundingClientRect().top / entryHeight;
  const brandGone = brand.getBoundingClientRect().bottom <= 0;
  if (manual && progress < manual.startProgress - .1) {
    manual = null;
    status.textContent = '';
  }
  const manualProgress = manual ? clamp((performance.now() - manual.startedAt) / 850) : 0;
  const phase = progress + (manual ? manual.boost * smooth(manualProgress) : 0);
  const typing = clamp((phase + .65) / .85);
  const characters = Math.floor(typing * example.length);
  if (characters !== lastCharacterCount) {
    typedWords.textContent = example.slice(0, characters).join('');
    lastCharacterCount = characters;
  }
  const morph = brandGone ? clamp((phase - .42) / .63) : 0;
  const travel = smooth(morph);
  const handoff = smooth(clamp((morph - .82) / .18));
  // Resolve the native frame only after the moving words clear the icon/date.
  const material = settle(clamp((morph - .74) / .26));
  const reason = smooth(clamp((phase - 1.25) / .4));
  const ready = progress >= .2 && phase < .32 && brandGone && !manual;
  const saveHadFocus = document.activeElement === saveButton;
  saveButton.disabled = !ready && !saveHadFocus;
  saveButton.setAttribute('aria-disabled', String(!ready));
  set('--editor-enter', String(settle(clamp((progress + .85) / .2))));
  set('--editor-chrome', String(1 - settle(clamp((phase - .4) / .18))));
  set('--caret-opacity', String(phase >= .32 || manual ? 0 : 1));
  set('--save-scale', String(1 - .05 * Math.sin(clamp((phase - .25) / .2) * Math.PI)));
  set('--word-x', `${wordJourney.x * settle(morph)}px`);
  set('--word-y', `${wordJourney.y * travel}px`);
  set('--word-scale', String(1 + (wordJourney.scale - 1) * travel));
  set('--bridge-opacity', String(1 - handoff));
  set('--result-opacity', String(material));
  set('--native-copy-opacity', String(handoff));
  set('--reason-opacity', String(reason));
  saveLabel.textContent = morph === 1 ? 'Saved' : phase >= .32 || manual ? 'Saving…' : 'Save';
  if (morph < 1) editor.inert = false;
  if (morph < 1 && document.activeElement === result) {
    if (ready) saveButton.focus({ preventScroll: true });
    else result.blur();
  }
  result.setAttribute('aria-hidden', String(morph < 1));
  if (morph === 1 && saveHadFocus) result.focus({ preventScroll: true });
  if (morph === 1) editor.inert = true;
  if (morph === 1 && manual && !manual.announced) {
    status.textContent = 'Example saved. The same words are now a notification, with their written date.';
    manual.announced = true;
  }
  root.dataset.scene = reason > .99 ? 'remember' : morph === 1 ? 'notification' : morph > 0 ? 'transforming' : phase >= .32 || manual ? 'saving' : 'writing';
  root.dataset.morph = morph.toFixed(3);
  if (manual && manualProgress < 1) queueStory();
}
function queueStory() {
  if (!frame) frame = requestAnimationFrame(updateStory);
}

saveButton.addEventListener('click', () => {
  if (!enabled || manual || saveButton.getAttribute('aria-disabled') === 'true') return;
  const progress = -story.getBoundingClientRect().top / entryHeight;
  // One cancellable phase owner. No page jump or independent layer animation.
  manual = { startedAt: performance.now(), startProgress: progress, boost: Math.max(0, 1.08 - progress), announced: false };
  updateStory();
});

configureStory();
window.addEventListener('scroll', queueStory, { passive: true });
window.addEventListener('resize', () => {
  const widthChanged = window.innerWidth !== entryWidth;
  const desktopResize = window.innerWidth > 700 && window.innerHeight <= screen.availHeight;
  if (widthChanged || desktopResize) {
    entryWidth = window.innerWidth;
    entryHeight = window.innerHeight;
    configureStory();
  }
  queueStory();
});
window.addEventListener('pageshow', queueStory);
reducedMotion.addEventListener('change', configureStory);

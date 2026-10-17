const encounter=document.querySelector('.encounter');
const motion=document.querySelector('#motion');
const reduced=matchMedia('(prefers-reduced-motion: reduce)');
const leader=document.querySelector('#leader');
let userPaused=false;
function syncMotion(){
  const paused=userPaused||reduced.matches||document.hidden;
  encounter.dataset.motion=paused?'paused':'playing';
  motion.disabled=reduced.matches;
  motion.textContent=reduced.matches?'Reduced motion':userPaused?'Resume motion':'Pause motion';
  motion.setAttribute('aria-pressed',String(!paused));
  motion.setAttribute('aria-label',reduced.matches?'Motion disabled by your system preference':motion.textContent);
}
motion.addEventListener('click',()=>{userPaused=!userPaused;syncMotion();});
reduced.addEventListener('change',syncMotion);
document.addEventListener('visibilitychange',syncMotion);
window.addEventListener('pagehide',()=>{encounter.dataset.motion='paused';});
window.addEventListener('pageshow',syncMotion);
function portraitState(){
  const missing=!leader.naturalWidth;
  encounter.classList.toggle('portrait-missing',missing);
  const name=leader.dataset.character==='sera'?'Sera':'Orin';
  document.querySelector('#portrait-status').textContent=missing?`${name}’s portrait is unavailable. You can continue the conversation or switch speakers.`:'';
}
leader.addEventListener('load',portraitState);
leader.addEventListener('error',portraitState);
if(leader.complete)portraitState();
syncMotion();

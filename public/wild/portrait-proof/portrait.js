const study=document.querySelector('.study');
const portrait=document.querySelector('#character');
const status=document.querySelector('#asset-status');
const assets={cutout:'/portrait/leader-cutout.png',original:'/portrait/leader-original.jpg'};
const messages={cutout:'Generated cutout · compare fine detail with the original.',original:'Your original JPEG · white background retained.'};
function ready(){
  if(!portrait.naturalWidth)return;
  portrait.classList.add('ready');study.classList.remove('asset-error');
  status.textContent=messages[study.dataset.source];
}
portrait.addEventListener('load',ready);
portrait.addEventListener('error',()=>{portrait.classList.remove('ready');study.classList.add('asset-error');status.textContent='Image failed to load. Try the other artwork or reload after restoring the local files.';});
if(portrait.complete)ready();
document.querySelectorAll('button').forEach(button=>button.addEventListener('click',()=>{
  const kind=Object.keys(button.dataset)[0],value=button.dataset[kind];
  if(study.dataset[kind]===value)return;
  study.dataset[kind]=value;
  document.querySelectorAll(`button[data-${kind}]`).forEach(item=>item.setAttribute('aria-pressed',String(item===button)));
  if(kind==='source'){
    portrait.classList.remove('ready');study.classList.remove('asset-error');status.textContent='Loading portrait…';
    portrait.src=assets[value];
    document.querySelectorAll('button[data-light]').forEach(item=>{item.disabled=value==='original';});
  }
}));

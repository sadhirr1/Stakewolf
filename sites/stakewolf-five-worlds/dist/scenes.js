// SCRUM-36 — five original, procedural art directions. No network assets.
const TAU = Math.PI * 2;
const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const seed = n => { const v = Math.sin(n * 127.1 + 311.7) * 43758.5453; return v - Math.floor(v); };

function polygon(c, points, fill, stroke, width = 1) {
  c.beginPath();
  points.forEach(([x, y], i) => i ? c.lineTo(x, y) : c.moveTo(x, y));
  c.closePath();
  if (fill) { c.fillStyle = fill; c.fill(); }
  if (stroke) { c.strokeStyle = stroke; c.lineWidth = width; c.stroke(); }
}
function line(c, x, y, xx, yy, color, width = 1) {
  c.beginPath(); c.moveTo(x, y); c.lineTo(xx, yy); c.strokeStyle = color; c.lineWidth = width; c.stroke();
}
function ellipse(c, x, y, rx, ry, fill, stroke, width = 1, rotation = 0) {
  c.beginPath(); c.ellipse(x, y, Math.max(.1, rx), Math.max(.1, ry), rotation, 0, TAU);
  if (fill) { c.fillStyle = fill; c.fill(); }
  if (stroke) { c.strokeStyle = stroke; c.lineWidth = width; c.stroke(); }
}
function glow(c, x, y, radius, inner, outer = 'transparent') {
  const g = c.createRadialGradient(x, y, 0, x, y, radius);
  g.addColorStop(0, inner); g.addColorStop(1, outer);
  c.fillStyle = g; c.fillRect(x - radius, y - radius, radius * 2, radius * 2);
}
function backdrop(c, w, h, a, b) {
  const g = c.createLinearGradient(0, 0, w, h); g.addColorStop(0, a); g.addColorStop(1, b);
  c.fillStyle = g; c.fillRect(0, 0, w, h);
}
function tree(c, x, y, h, tint, warm = false) {
  line(c, x, y, x, y - h, warm ? '#b27850' : '#171e32', Math.max(1, h * .024));
  for (let j = 0; j < 5; j++) {
    const yy = y - h + h * j * .14;
    const r = h * (.07 + j * .027);
    polygon(c, [[x, yy], [x - r, yy + h * .35], [x - r * .15, yy + h * .3], [x + r, yy + h * .35]], tint);
  }
}

function afterlight(c, w, h, s) {
  backdrop(c, w, h, '#101222', '#263349');
  const k = Math.min(w / 900, h / 600), x = w * .67, y = h * .5;
  glow(c, x, y - 110 * k, 340 * k, '#55527070');
  // Broad veils of distant mountains, below a sparse fixed sky.
  for (let i = 0; i < 42; i++) {
    const xx = seed(i + 20) * w, yy = seed(i + 100) * h * .63;
    ellipse(c, xx, yy, i % 8 ? .55 : 1, i % 8 ? .55 : 1, '#ddd6cc' + (i % 3 ? '44' : '88'));
  }
  for (let layer = 0; layer < 3; layer++) {
    const points = [[0, h]];
    for (let i = 0; i <= 18; i++) points.push([w * i / 18, h * (.63 + layer * .09) - seed(i + layer * 32) * h * .1]);
    points.push([w, h]); polygon(c, points, ['#2b334850', '#18283a80', '#101e32'][layer]);
  }
  c.save(); c.translate(x, y); c.scale(k, k);
  const breathing = Math.sin(s.time * .35) * 4;
  glow(c, 9, -89, 192, '#ffa65125');
  // An eclipsed copper sun, lit only at its rim.
  ellipse(c, 10, -85, 115, 115, '#202437', '#b6a09220');
  c.save(); c.shadowColor = '#ffbe75'; c.shadowBlur = 24;
  c.beginPath(); c.arc(10, -85, 116, -.7, 2.3); c.strokeStyle = '#eeb16e'; c.lineWidth = 2.2; c.stroke();
  c.shadowBlur = 8; c.beginPath(); c.arc(10, -85, 116, .1, 1.8); c.strokeStyle = '#fff0b1'; c.lineWidth = 3; c.stroke(); c.restore();
  // Reflections define a still plane under the suspended landmass.
  for (let i = 0; i < 30; i++) {
    const yy = 141 + i * 4.4, spread = 15 + i * 2.3;
    line(c, 5 - spread, yy, 5 + spread, yy, `rgba(226,170,120,${.075 * (1 - i / 32)})`);
  }
  ellipse(c, 0, 177, 225, 23, '#0b142265');
  // Chiselled, hanging rock. Large planes make its scale legible.
  polygon(c, [[-222, 70], [-164, 37], [-50, 24], [84, 38], [222, 74], [147, 116], [73, 178], [-64, 159], [-171, 116]], '#141e2a');
  polygon(c, [[-222, 70], [-78, 92], [-64, 159], [-171, 116]], '#28303b');
  polygon(c, [[-78, 92], [23, 97], [-2, 190], [-64, 159]], '#192530');
  polygon(c, [[23, 97], [147, 116], [73, 178], [-2, 190]], '#101b28');
  polygon(c, [[84, 38], [222, 74], [147, 116], [23, 97]], '#1d2933');
  polygon(c, [[-222, 70], [-164, 37], [-50, 24], [84, 38], [222, 74], [23, 97], [-78, 92]], '#35413e');
  for (let i = 0; i < 19; i++) {
    const xx = -167 + seed(i + 180) * 335, yy = 62 + seed(i + 230) * 26;
    line(c, xx, yy, xx + seed(i + 281) * 12 - 6, yy + 30 + seed(i) * 55, '#73817417');
  }
  // A path of warm light, with cool, layered conifers around it.
  polygon(c, [[-10, 49], [9, 49], [31, 65], [0, 83], [11, 98], [-10, 95], [-17, 80], [12, 63]], '#b3935955');
  for (let row = 0; row < 3; row++) {
    for (let i = 0; i < 15; i++) {
      const xx = -173 + i * 25 + (seed(i + row * 25) - .5) * 12;
      if (Math.abs(xx) < 25) continue;
      const yy = 35 + row * 20 + seed(i + 300) * 14;
      const ht = (45 + seed(i + row * 42 + 9) * 77) * (row === 0 ? 1 : .9);
      tree(c, xx, yy, ht, ['#39494a', '#243b3f', '#132e32'][row]);
      if (xx > 0 && xx < 60) tree(c, xx + .8, yy, ht, '#334338');
    }
  }
  glow(c, 1, 42, 64 + breathing, '#ffc57538');
  c.save(); c.shadowColor = '#ffbd72'; c.shadowBlur = 24;
  polygon(c, [[-9, 48], [-9, -7], [6, -14], [6, 49]], '#ffd093'); c.restore();
  polygon(c, [[6, -14], [12, -10], [12, 49], [6, 49]], '#744924');
  line(c, -9, -7, 6, -14, '#fff4c7', 1.5);
  // A tiny observer gives the grove a cinematic scale.
  ellipse(c, 0, 72, 2.1, 2.5, '#111a24'); line(c, 0, 75, 0, 86, '#111a24', 3);
  line(c, 0, 81, -2, 89, '#111a24', 1.2); line(c, 0, 81, 2, 89, '#111a24', 1.2);
  const px = (s.pointer.x * w - x) / k, py = (s.pointer.y * h - y) / k;
  glow(c, s.pointer.active ? px : -53 + s.value * 1.1, s.pointer.active ? py : 62, 75, '#fbb36516');
  for (let i = 0; i < 8; i++) {
    const xx = -100 + seed(i + 61) * 210 + Math.sin(s.time * .3 + i) * 3;
    const yy = -5 + seed(i + 731) * 75 + Math.cos(s.time * .5 + i) * 2;
    ellipse(c, xx, yy, 1, 1, '#ffcd83a0');
  }
  c.restore();
}

const FACE = [[-101,-153], [4,-182], [109,-126], [130,-20], [90,110], [4,174], [-98,103], [-127,-14]];
function verdict(c, w, h, s) {
  backdrop(c, w, h, '#eee8d9', '#dcd6c7');
  const k = Math.min(w / 950, h / 540), x = w * .68, y = h * .48;
  const boundary = x + (s.value - 50) * k * 3.6;
  c.fillStyle = '#d43e2f'; c.fillRect(boundary, 0, w - boundary, h);
  for (let i = 0; i < 8; i++) line(c, w * .44 + i * 67 * k, 0, w * .44 + i * 67 * k, h, '#24211b0b');
  line(c, w * .43, h * .17, w, h * .17, '#20251c1c'); line(c, w * .43, h * .82, w, h * .82, '#20251c1c');
  c.save(); c.translate(x, y); c.scale(k, k);
  // An offset edition shadow, then a visibly constructed faceted mask.
  c.save(); c.translate(18, 19); polygon(c, FACE, '#21232117'); c.restore();
  polygon(c, FACE, '#222521');
  polygon(c, [[-101,-153], [4,-182], [-17,-66], [-127,-14]], '#383b34');
  polygon(c, [[4,-182], [109,-126], [25,-52], [-17,-66]], '#161a18');
  polygon(c, [[109,-126], [130,-20], [70,-5], [25,-52]], '#494a3f');
  polygon(c, [[-127,-14], [-17,-66], [-12,43], [-98,103]], '#1a1e1a');
  polygon(c, [[25,-52], [70,-5], [90,110], [12,69]], '#2e342b');
  polygon(c, [[-98,103], [-12,43], [12,69], [4,174]], '#4a4b3f');
  polygon(c, [[90,110], [4,174], [12,69]], '#151b17');
  // The right-hand reveal is a forensic diagram of the same geometry.
  c.save(); c.beginPath(); c.rect((boundary - x) / k, -h / k, w / k, h * 2 / k); c.clip();
  polygon(c, FACE, '#f0e7d1', '#27281f', 1.1);
  const points = [...FACE, [-17,-66], [25,-52], [70,-5], [-12,43], [12,69]];
  [[0,8],[1,8],[1,9],[2,9],[2,10],[3,10],[4,10],[4,12],[5,12],[6,11],[6,12],[7,8],[8,9],[8,11],[9,10],[9,12],[10,12],[11,12]].forEach(([a,b]) => line(c,...points[a],...points[b],'#4d51438c',.7));
  points.forEach(([xx,yy],i)=> { ellipse(c,xx,yy,2,2,'#24281d'); c.fillStyle='#343729'; c.font='8px monospace'; c.fillText(String(i+1).padStart(2,'0'),xx+7,yy-6); });
  c.restore();
  // Dislocated brows, eyes and mouth cross the divide as independent slabs.
  const shift = (s.value - 50) * .14;
  polygon(c, [[-91,-42],[-32,-53],[-29,-35],[-90,-27]], '#e7deca');
  polygon(c, [[36,-46],[105,-31],[102,-11],[34,-26]], '#d43e2f');
  line(c,-79,-31,-46,-37,'#d43e2f',3); line(c,48,-32,88,-24,'#272b22',3);
  polygon(c, [[7,-35],[-10,37],[18,45]], '#c53c2e');
  polygon(c, [[-39+shift,84],[57+shift,67],[51+shift,88],[-32+shift,101]], '#d43e2f');
  line(c,-25+shift,88,38+shift,77,'#f4e9d2',2);
  // Floating fracture: a sharp black gap through the object's forehead.
  polygon(c, [[-47,-167],[-37,-89],[-9,-58],[-1,-18],[-12,-56],[-48,-83],[-58,-163]], '#e5dfd0');
  c.setLineDash([3,5]); line(c,-172,198,173,198,'#252a2570'); c.setLineDash([]);
  line(c,-145,191,-145,205,'#252a25'); line(c,145,191,145,205,'#252a25');
  c.fillStyle='#282c25'; c.font='9px monospace'; c.fillText('FIG. 02  /  THE DIVIDED SELF',-145,220);
  c.restore();
  line(c,boundary,0,boundary,h,'#f5eed766',1);
}

function chorus(c, w, h, s) {
  backdrop(c,w,h,'#1739df','#143bc7');
  const k=Math.min(w/930,h/570), x=w*.68, y=h*.5;
  glow(c,x,y,340*k,'#5b86ff38');
  c.save(); c.translate(x,y); c.scale(k,k);
  const opened = .73+s.value*.004, growth=7+Math.min(s.actionCount,5)*2;
  // Each arm is a bundled, branching filament, like roots and cut-paper petals.
  for(let arm=0;arm<growth;arm++) {
    const a=arm*TAU/growth+.12, len=(154+seed(arm+31)*83)*opened;
    c.save(); c.rotate(a);
    const sway=Math.sin(s.time*.3+arm)*3;
    for(let ribbon=0;ribbon<13;ribbon++) {
      const spread=(ribbon-6)*3.5;
      c.beginPath(); c.moveTo(14,spread*.17);
      c.bezierCurveTo(len*.32,spread*.7-24,len*.67,spread+sway,len,spread*.08+Math.sin(arm)*12);
      c.strokeStyle=`rgba(238,245,214,${.3+Math.abs(ribbon-6)*.062})`; c.lineWidth=.72; c.stroke();
    }
    for(let side=-1;side<=1;side+=2) {
      for(let leaf=0;leaf<8;leaf++) {
        const start=34+leaf*len*.078, size=(24+Math.sin(leaf/8*Math.PI)*20)*(1-leaf*.045), curl=side*(34-leaf*2.7);
        c.beginPath(); c.moveTo(start,-6);
        c.bezierCurveTo(start+size*.05,curl*.55,start+size*.15,curl*1.4,start+size,curl);
        c.bezierCurveTo(start+size*.65,curl*.45,start+size*.2,side*3,start,-6);
        c.fillStyle=leaf%3===0?'#eff2ccdd':'#dfebcd17'; c.fill();
        c.strokeStyle='#edf5d0b0'; c.lineWidth=.7; c.stroke();
        for(let vein=0;vein<4;vein++) {
          c.beginPath(); c.moveTo(start+vein*size*.12,-3+side*vein);
          c.quadraticCurveTo(start+size*.35,curl*.65,start+size*(.35+vein*.15),curl*(.64+vein*.1));
          c.strokeStyle='#f2f4d450'; c.lineWidth=.55; c.stroke();
        }
      }
    }
    ellipse(c,len,Math.sin(arm)*12,3,3,'#f7f4ce');
    c.restore();
  }
  // An eccentric system of fine orbits is deliberately offset from the plant.
  for(let i=0;i<3;i++) {
    c.save(); c.rotate(-.5+i*.9); ellipse(c,0,0,221+i*12,130+i*18,null,'#dcead723',.7); c.restore();
  }
  for(let i=0;i<22;i++) {
    const a=i*2.39996, r=34+Math.sqrt(i)*4;
    ellipse(c,Math.cos(a)*r,Math.sin(a)*r,6,9,i%3?'#dbe7c2':'#f6f0ca',null,1,a);
  }
  ellipse(c,0,0,23,23,'#eaf0cd');
  for(let i=0;i<36;i++) { const a=i*2.39996,r=Math.sqrt(i)*2.75; ellipse(c,Math.cos(a)*r,Math.sin(a)*r,1.4,1.4,'#234bc1'); }
  for(let i=0;i<8;i++) {
    const a=i*TAU/8+.4, r=260+seed(i)*10,xx=Math.cos(a)*r,yy=Math.sin(a)*r;
    line(c,xx-4,yy,xx+4,yy,'#dce5d95b',.6);line(c,xx,yy-4,xx,yy+4,'#dce5d95b',.6);
  }
  c.restore();
}

function cabinet(c,w,h,s) {
  backdrop(c,w,h,'#e4d7be','#baa789');
  const k=Math.min(w/930,h/600),x=w*.68,y=h*.48;
  // The cabinet's ruled paper and engraved registration marks remain quiet.
  for(let i=0;i<24;i++) line(c,w*.43+i*23*k,0,w*.43+i*23*k,h,'#6f5b3710',.5);
  glow(c,x,y,330*k,'#fff1dba0');
  c.save(); c.translate(x,y); c.scale(k,k);
  ellipse(c,0,232,174,19,'#55402724');
  polygon(c,[[-104,197],[105,197],[131,220],[-131,220]],'#8b7352');
  polygon(c,[[-131,220],[131,220],[131,228],[-131,228]],'#57462e');
  polygon(c,[[-31,109],[30,109],[43,201],[-45,201]],'#695331');
  polygon(c,[[-20,116],[3,116],[6,199],[-32,199]],'#b89a62');
  ellipse(c,0,0,208,208,null,'#77634340',.75);
  for(let i=0;i<120;i++) {
    const a=i*TAU/120,rr=i%10===0?187:i%5===0?192:197;
    line(c,Math.cos(a)*rr,Math.sin(a)*rr,Math.cos(a)*202,Math.sin(a)*202,'#77634380',i%5===0?1:.55);
  }
  for(let i=0;i<12;i++) {
    const a=i*TAU/12-Math.PI/2;
    c.fillStyle='#695835';c.font='8px Georgia';c.textAlign='center';c.fillText(['XII','I','II','III','IV','V','VI','VII','VIII','IX','X','XI'][i],Math.cos(a)*178,Math.sin(a)*178+3);
  }
  const rotation=(s.value-50)*.008+(s.pointer.active?(s.pointer.x-.68)*.35:0);
  // Multiple projected brass hoops, each with a distinct plane and engraved ticks.
  const ring=(rx,ry,angle,width) => {
    c.save();c.rotate(angle);c.shadowColor='#49321225';c.shadowBlur=4;c.shadowOffsetY=5;
    ellipse(c,0,0,rx,ry,null,'#594525',width+2);c.shadowBlur=0;c.shadowOffsetY=0;
    ellipse(c,0,-1,rx,ry,null,'#c5a76d',width);
    ellipse(c,0,-2,rx-2,Math.max(1,ry-2),null,'#ebd294',.7);
    for(let j=0;j<72;j++) {const a=j*TAU/72;line(c,Math.cos(a)*(rx-width*.55),Math.sin(a)*(ry-width*.55),Math.cos(a)*(rx+width*.35),Math.sin(a)*(ry+width*.35),'#5b492875',.55);}
    c.restore();
  };
  ring(158,157,.12,9);ring(173,72,-.6+rotation,7);ring(168,61,.78-rotation,7);ring(167,44,1.42+rotation*.5,7);
  line(c,-73,-178,73,178,'#584428',5);line(c,-75,-178,71,178,'#d6b574',1);
  ellipse(c,-75,-184,7,10,'#7f6134','#d2b070',1,-.39);
  const orb=c.createRadialGradient(-24,-30,3,4,6,77);
  orb.addColorStop(0,'#ffefb6');orb.addColorStop(.16,'#ecc681');orb.addColorStop(.53,'#b57a34');orb.addColorStop(.86,'#674420');orb.addColorStop(1,'#382e1e');
  c.save();c.shadowColor='#6d411b50';c.shadowBlur=20;ellipse(c,0,0,74,74,orb);c.restore();
  c.save();c.beginPath();c.arc(0,0,74,0,TAU);c.clip();
  for(let i=-4;i<=4;i++) ellipse(c,0,i*15,74,Math.max(4,20-Math.abs(i)*3),null,'#ffe0a124',.8);
  for(let i=0;i<4;i++) ellipse(c,0,0,16+i*16,74,null,'#ffe0a129',.8);
  for(let i=0;i<23;i++) {const xx=seed(i+51)*130-65,yy=seed(i+101)*125-62;ellipse(c,xx,yy,.8,.8,'#fff2bf66');}
  glow(c,-27,-32,23,'#fff7d14d');c.restore();
  // A hoop in front completes the real, nested apparatus.
  c.save();c.rotate(-.6+rotation);c.beginPath();c.ellipse(0,0,173,72,0,0,Math.PI);c.strokeStyle='#574322';c.lineWidth=9;c.stroke();c.strokeStyle='#c5a46a';c.lineWidth=6;c.stroke();c.restore();
  line(c,161,-118,209,-145,'#80694180',.7);line(c,209,-145,236,-145,'#80694180',.7);
  c.fillStyle='#806941';c.font='8px monospace';c.textAlign='left';c.fillText('I / MMXXVI',199,-153);
  c.restore();
}

function deadAir(c,w,h,s) {
  backdrop(c,w,h,'#051712','#071e19');
  const k=Math.min(w/900,h/550),x=w*.67,y=h*.46;
  glow(c,x,y,320*k,'#26684535');
  c.save();c.translate(x,y);c.scale(k,k);
  const coherent=1-Math.abs(s.value-67)/67,phase=s.time*.4;
  // A spatial wire field resolves into a mountain when the receiver is tuned.
  for(let row=0;row<40;row++) {
    const z=row/39,yy=-115+z*305,extent=74+z*199;
    c.beginPath();
    for(let col=0;col<=95;col++) {
      const xx=(col/95*2-1)*extent,center=Math.exp(-Math.pow(xx/(54+z*22),2));
      const envelope=Math.exp(-Math.pow((z-.48)/.24,2));
      const signal=center*envelope*(98+coherent*53);
      const noise=Math.sin(xx*.07+row*.65+phase)*Math.sin(row*.9+phase)*11*(1-coherent);
      const ridge=Math.cos(xx*.035+row*.4)*center*envelope*18;
      const py=yy-signal+noise+ridge;
      col?c.lineTo(xx,py):c.moveTo(xx,py);
    }
    c.strokeStyle=`rgba(152,229,151,${.11+z*.47})`;c.lineWidth=.7;c.stroke();
  }
  for(let col=0;col<25;col++) {
    c.beginPath();
    for(let row=0;row<40;row++) {
      const z=row/39,xx=(col/24*2-1)*(74+z*199),yy=-115+z*305;
      const center=Math.exp(-Math.pow(xx/(54+z*22),2)),envelope=Math.exp(-Math.pow((z-.48)/.24,2));
      const py=yy-center*envelope*(98+coherent*53)+Math.sin(xx*.07+row*.65+phase)*Math.sin(row*.9+phase)*11*(1-coherent)+Math.cos(xx*.035+row*.4)*center*envelope*18;
      row?c.lineTo(xx,py):c.moveTo(xx,py);
    }
    c.strokeStyle='#8adb8522';c.lineWidth=.6;c.stroke();
  }
  // Instrument marks and elliptical scan rings establish a separate radar plane.
  for(let i=0;i<3;i++) ellipse(c,0,50,93+i*63,35+i*22,null,'#9fe99220',.7);
  line(c,-280,50,280,50,'#9be38825',.6);line(c,0,-185,0,194,'#9be38825',.6);
  const scan = (s.time*.12)%1;
  const pulse = s.reducedMotion ? .65 : clamp((s.time-s.lastAction)/2.5);
  if(s.actionCount>0 && (pulse<1||s.reducedMotion)) ellipse(c,0,42,45+pulse*230,18+pulse*82,null,`rgba(191,255,166,${(1-pulse)*.75})`,1.5);
  line(c,-235,-156+scan*319,235,-156+scan*319,'#b3f49d20',1);
  // A suspended signal marker is tied to coherence, not chance.
  const sx=(s.value-67)*1.2,sy=-104-coherent*20;
  c.save();c.shadowColor='#b9ffaa';c.shadowBlur=12;
  polygon(c,[[sx,sy-8],[sx+7,sy],[sx,sy+8],[sx-7,sy]],null,'#c1ffad',1.2);c.restore();
  c.setLineDash([2,5]);line(c,sx,sy+8,sx,55,'#b4f4a15a');c.setLineDash([]);
  c.fillStyle='#ade49b';c.font='9px monospace';c.fillText(coherent>.95?'SIGNAL LOCK':'SEEKING SOURCE',sx+16,sy+3);
  for(let i=0;i<9;i++) {
    const xx=-240+i*60;
    line(c,xx,211,xx,216,'#96cf8577',.8); c.fillStyle='#91be7d77';c.font='7px monospace';c.fillText(String(i*20).padStart(3,'0'),xx-6,229);
  }
  line(c,-252,-184,-252,-164,'#a3cf8c',1);line(c,-252,-184,-232,-184,'#a3cf8c',1);
  line(c,252,-184,252,-164,'#a3cf8c',1);line(c,252,-184,232,-184,'#a3cf8c',1);
  c.restore();
  // Static phosphor texture: no flashing noise, scan-line flicker or random frames.
  c.fillStyle='#00000015';for(let yy=0;yy<h;yy+=4)c.fillRect(0,yy,w,1);
  const vignette=c.createRadialGradient(x,y,h*.15,x,y,Math.max(w,h)*.85);
  vignette.addColorStop(0,'transparent');vignette.addColorStop(1,'#000a');c.fillStyle=vignette;c.fillRect(0,0,w,h);
}

const renderers=[afterlight,verdict,chorus,cabinet,deadAir];

/** Mount a decorative scene. Values are 0–100; actions cycle a scene-specific change. */
export function mountScene(canvas,id,{reducedMotion=false,onChange=()=>{}}={}) {
  const c=canvas.getContext('2d',{alpha:false});
  if(!c) return {setValue(){},setReducedMotion(){},action(){},destroy(){}};
  const scene=Number.isInteger(id)&&renderers[id]?id:0;
  let w=1,h=1,raf=0,last=0,disposed=false;
  const state={value:50,actionCount:0,time:0,lastAction:-10,reducedMotion:Boolean(reducedMotion),pointer:{x:.67,y:.5,active:false}};
  const draw=()=>{
    if(disposed)return;
    c.setTransform(canvas.width/w,0,0,canvas.height/h,0,0);
    c.globalAlpha=1;c.globalCompositeOperation='source-over';c.setLineDash([]);
    renderers[scene](c,w,h,state);
  };
  const frame=now=>{
    raf=0;if(disposed||document.hidden||state.reducedMotion)return;
    if(!last||now-last>=1000/30){state.time+=last?Math.min((now-last)/1000,.1):0;last=now;draw();}
    raf=requestAnimationFrame(frame);
  };
  const start=()=>{if(!disposed&&!document.hidden&&!state.reducedMotion&&!raf){last=0;raf=requestAnimationFrame(frame);}};
  const setReducedMotion=paused=>{
    if(disposed)return;
    state.reducedMotion=Boolean(paused);
    if(state.reducedMotion){cancelAnimationFrame(raf);raf=0;last=0;}
    draw();start();
  };
  const notify=()=>onChange({value:state.value,actionCount:state.actionCount,scene});
  const setValue=value=>{
    if(disposed||!Number.isFinite(Number(value)))return;
    state.value=clamp(Number(value),0,100);draw();notify();
  };
  const action=()=>{
    if(disposed)return;
    state.actionCount++;state.lastAction=state.time;
    if(scene===0)state.value=(state.value+23)%101;
    if(scene===1)state.value=state.value>50?22:78;
    if(scene===2&&state.actionCount>5)state.actionCount=0;
    if(scene===3)state.value=(state.value+25)%101;
    if(scene===4)state.value=67;
    draw();notify();
  };
  const move=event=>{
    const rect=canvas.getBoundingClientRect();
    state.pointer.x=clamp((event.clientX-rect.left)/Math.max(1,rect.width));
    state.pointer.y=clamp((event.clientY-rect.top)/Math.max(1,rect.height));
    state.pointer.active=true;
    if((scene===1||scene===3)&&event.buttons===1)setValue(clamp((state.pointer.x-.43)/.49)*100);
    else if(state.reducedMotion)draw();
  };
  const down=event=>{move(event);if(scene===2||scene===4)action();};
  const leave=()=>{state.pointer.active=false;if(state.reducedMotion)draw();};
  const visibility=()=>{if(document.hidden){cancelAnimationFrame(raf);raf=0;last=0;}else{draw();start();}};
  const resize=()=>{
    // The canvas can intentionally overflow its parent on narrow layouts.
    const rect=canvas.getBoundingClientRect();
    w=Math.max(1,rect.width);h=Math.max(1,rect.height);
    const dpr=Math.min(window.devicePixelRatio||1,1.5);
    const width=Math.round(w*dpr),height=Math.round(h*dpr);
    // Avoid resetting the bitmap when ResizeObserver reports an unchanged box.
    if(canvas.width!==width)canvas.width=width;
    if(canvas.height!==height)canvas.height=height;
    draw();
  };
  canvas.addEventListener('pointermove',move,{passive:true});canvas.addEventListener('pointerdown',down,{passive:true});canvas.addEventListener('pointerleave',leave,{passive:true});
  document.addEventListener('visibilitychange',visibility);
  const observer=new ResizeObserver(resize);observer.observe(canvas);resize();start();
  return {setValue,setReducedMotion,action,destroy(){
    if(disposed)return;disposed=true;cancelAnimationFrame(raf);observer.disconnect();
    canvas.removeEventListener('pointermove',move);canvas.removeEventListener('pointerdown',down);canvas.removeEventListener('pointerleave',leave);document.removeEventListener('visibilitychange',visibility);
  }};
}

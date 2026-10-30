const projects=[{"id":"drama-title","title":"참교육","video":"w1jaPouVebc","category":"Motion / Title Sequence","sub":"드라마타이틀","style":"drama","art":"TITLE","small":"A STORY BEGINS","description":"「참교육」 드라마타이틀 제작 실습 영상입니다\n에프터이펙트로 제작하였습니다.","overviewTitle":"드라마 &lt;참교육&gt; 타이틀"},{"id":"ai-film","title":"지진안전 AI공모전","video":"Ae-iBxDwNfI","vertical":true,"category":"AI / Promotional Film","sub":"AI 홍보영상 · Shorts","style":"ai","art":"IMAGINE.","small":"IDEA INTO MOTION","description":"지진안전을 주제로 한 AI 영상입니다.\n행정안전부에서 주최한 지진안전 AI공모전에\n팀작업으로 출품한 작품으로, 장려상을 수상했습니다.","overviewTitle":"행정안전부 지진안전 AI공모전"},{"id":"music-video","title":"기쁨, 슬픔, 아름다운 마음","video":"BQVcTFw7k4Q","category":"Film / Music Video","sub":"AKMU × 이터널 선샤인 · 뮤직비디오 편집","style":"music","art":"MUSIC<br>VIDEO","small":"RHYTHM · VISUAL · STORY","description":"악동뮤지션의 「기쁨, 슬픔, 아름다운 마음」과 영화 「이터널 선샤인」을 연결한 가사 영상입니다.\n프리미어프로로 편집했습니다.","overviewTitle":"기쁨, 슬픔, 아름다운 마음 MV"}];
let selected=0;const main=document.querySelector('main'),markers=document.querySelector('.markers');
function art(p){if(p.video)return `<div class="art video-cover"><img src="thumb-${p.video}.jpg" alt="${p.title} 영상 썸네일" draggable="false"><span class="play-badge" aria-hidden="true">▶</span></div>`;return `<div class="art ${p.style}"><div class="art-type"><strong>${p.art}</strong><small>${p.small}</small></div><span class="demo">EJ / CONCEPT COVER · 미리보기</span></div>`}
projects.forEach((p,i)=>{const b=document.createElement('button');b.setAttribute('aria-label',p.sub+' 선택');b.onclick=()=>{selected=i;if(!isGallery())location.hash='work';else update()};markers.append(b)});
const isGallery=()=>!location.hash||['#hero','#work'].includes(location.hash);
function galleryMetrics(){const mobile=window.innerWidth<=700;return {width:window.innerWidth*(mobile?.68:.46),strip:window.innerWidth*(mobile?.07:.065),gap:window.innerWidth*(mobile?.025:.018)}}
    function galleryCardFrame(position, gap, frameWidth) {
        const strength = Math.max(0, 1 - Math.abs(position / gap));
        const extra = Math.max(0, frameWidth * .72 - (gap - 20));
        return {
            x: position + Math.max(-1, Math.min(1, position / gap)) * extra / 2,
            width: gap - 20 + extra * strength,
            inset: .18 * (1 - strength),
            strength,
        };
    }

    function initGallerySurface(gallery, cards, redraw) {
        const canvas = document.createElement('canvas');
        const gl = canvas.getContext('webgl', { alpha: true, antialias: true, premultipliedAlpha: true });
        if (!gl) return null;
        function shader(type, source) {
            const item = gl.createShader(type);
            gl.shaderSource(item, source);
            gl.compileShader(item);
            if (!gl.getShaderParameter(item, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(item));
            return item;
        }
        let program;
        try {
            program = gl.createProgram();
            gl.attachShader(program, shader(gl.VERTEX_SHADER, `
                attribute vec2 point;
                uniform vec2 viewport;
                uniform vec4 frame;
                uniform float angle;
                uniform float energy;
                varying vec2 uv;
                void main() {
                    float localX = (point.x - .5) * frame.z;
                    float x = frame.x + localX * cos(angle);
                    float range = viewport.x * .3125;
                    float across = min(abs(x) / range, 1.);
                    float ease = across < .5 ? 2. * across * across : -1. + (4. - 2. * across) * across;
                    float swell = (1. - ease) * energy * range;
                    float z = -localX * sin(angle) + swell;
                    float projection = 1000. / (1000. - z);
                    vec2 position = vec2(x, (point.y - .5) * frame.w) * projection;
                    gl_Position = vec4(position.x * 2. / viewport.x, -position.y * 2. / viewport.y, 0., 1.);
                    uv = point;
                }`));
            gl.attachShader(program, shader(gl.FRAGMENT_SHADER, `
                precision mediump float;
                uniform sampler2D picture;
                uniform float crop;
                uniform float focus;
                uniform float insetY;
                uniform vec2 imageScale;
                varying vec2 uv;
                void main() {
                    vec2 sampleUV = vec2(.5 + (uv.x - .5) * crop, insetY + uv.y * (1. - 2. * insetY));
                    vec4 pixel = texture2D(picture, .5 + (sampleUV - .5) * imageScale);
                    float gray = (pixel.r + pixel.g + pixel.b) / 3.;
                    gl_FragColor = vec4(mix(vec3(gray * .7), pixel.rgb, focus), 1.);
                }`));
            gl.linkProgram(program);
            if (!gl.getProgramParameter(program, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(program));
        } catch (error) {
            console.warn('Gallery depth unavailable; keeping image cards.', error);
            return null;
        }
        canvas.className = 'gallery-surface';
        canvas.setAttribute('aria-hidden', 'true');
        gallery.appendChild(canvas);
        const points = [];
        for (let i = 0; i < 20; i++) {
            const left = i / 20, right = (i + 1) / 20;
            points.push(left, 0, right, 0, left, 1, left, 1, right, 0, right, 1);
        }
        gl.useProgram(program);
        gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(points), gl.STATIC_DRAW);
        const point = gl.getAttribLocation(program, 'point');
        gl.enableVertexAttribArray(point);
        gl.vertexAttribPointer(point, 2, gl.FLOAT, false, 0, 0);
        const uniforms = Object.fromEntries(['viewport', 'frame', 'angle', 'energy', 'crop', 'focus', 'insetY', 'imageScale'].map(name => [name, gl.getUniformLocation(program, name)]));
        let lost = false;
        const textures = cards.map(card => {
            const image = card.querySelector('img'), texture = gl.createTexture();
            const entry = { texture, ready: false };
            function upload() {
                if (lost || !image.naturalWidth) return;
                gl.bindTexture(gl.TEXTURE_2D, texture);
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
                try {
                    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
                } catch (error) {
                    lost = true;
                    gallery.classList.remove('surface-ready');
                    console.warn('Gallery images unavailable for WebGL; keeping image cards.', error);
                    return;
                }
                entry.aspect = image.naturalWidth / image.naturalHeight;
                entry.ready = true;
                requestAnimationFrame(redraw);
            }
            image.addEventListener('load', upload);
            image.loading = 'eager';
            if (image.complete) upload();
            return entry;
        });
        canvas.addEventListener('webglcontextlost', event => {
            event.preventDefault();
            lost = true;
            gallery.classList.remove('surface-ready');
        });
        return {
            render({ width, height, frameWidth, gap, offset, angle, energy, visible }) {
                const ready = !lost && visible && textures.every(item => item.ready);
                gallery.classList.toggle('surface-ready', ready);
                if (!ready) return;
                const ratio = Math.min(window.devicePixelRatio || 1, 1.5);
                if (canvas.width !== Math.round(width * ratio) || canvas.height !== Math.round(height * ratio)) {
                    canvas.width = Math.round(width * ratio);
                    canvas.height = Math.round(height * ratio);
                    gl.viewport(0, 0, canvas.width, canvas.height);
                }
                gl.clear(gl.COLOR_BUFFER_BIT);
                gl.uniform2f(uniforms.viewport, width, height);
                gl.uniform1f(uniforms.angle, angle * Math.PI / 180);
                gl.uniform1f(uniforms.energy, energy);
                textures.forEach((item, i) => {
                    const frame = galleryCardFrame(i * gap - offset, gap, frameWidth);
                    gl.bindTexture(gl.TEXTURE_2D, item.texture);
                    gl.uniform2f(uniforms.imageScale, Math.min(1, (16 / 9) / item.aspect), Math.min(1, item.aspect / (16 / 9)));
                    gl.uniform1f(uniforms.crop, frame.width / frameWidth);
                    gl.uniform1f(uniforms.insetY, frame.inset);
                    gl.uniform4f(uniforms.frame, frame.x, 0, frame.width, frameWidth * .5625 * (1 - 2 * frame.inset));
                    gl.uniform1f(uniforms.focus, i === Math.round(offset / gap) ? 1 : 0);
                    gl.drawArrays(gl.TRIANGLES, 0, points.length / 2);
                });
            },
        };
    }


let curveSurface=null,curveRail=null,curveFrame=0,curveTarget=0,curvePosition=0,curveImpulse=0,curveTime=0;
function paintGallery(position){
 const rail=document.querySelector('.rail');if(!rail)return;
 if(curveRail!==rail){cancelAnimationFrame(curveFrame);curveRail=rail;curveTarget=curvePosition=position;curveImpulse=curveTime=0;curveFrame=0;curveSurface=initGallerySurface(rail,[...rail.querySelectorAll('.piece')],()=>drawCurve());}
 curveTarget=position;
 if(window.matchMedia('(prefers-reduced-motion: reduce)').matches){curvePosition=position;curveImpulse=0;drawCurve();return}
 if(!curveFrame)curveFrame=requestAnimationFrame(stepCurve);
}
function stepCurve(time){if(!curveRail?.isConnected){curveFrame=0;return}const step=curveTime?Math.min((time-curveTime)/16.67,3):1;curveTime=time;const gap=galleryMetrics().strip+20;curvePosition+=(curveTarget-curvePosition)*(1-Math.pow(.92,step));curveImpulse+=((curveTarget-curvePosition)*gap-curveImpulse)*(1-Math.pow(.92,step));drawCurve();if(Math.abs(curveTarget-curvePosition)*gap<.05&&Math.abs(curveImpulse)<.05){curvePosition=curveTarget;curveImpulse=0;curveTime=0;curveFrame=0;drawCurve();return}curveFrame=requestAnimationFrame(stepCurve)}
function drawCurve(){if(!curveRail?.isConnected)return;const {width,strip}=galleryMetrics(),gap=strip+20,frameWidth=Math.min(width/.72,curveRail.clientHeight/.5625);const angle=-.4*Math.max(-1.7,Math.min(1.7,curveImpulse/(500/1.7)))*180/Math.PI;curveRail.style.setProperty('--card-width',frameWidth+'px');curveRail.querySelectorAll('.piece').forEach((el,i)=>{const f=galleryCardFrame((i-curvePosition)*gap,gap,frameWidth);el.style.transform='translate3d('+f.x+'px,0,0)';el.style.clipPath='inset('+(f.inset*100)+'% '+((frameWidth-f.width)/2)+'px)';el.style.rotate='y '+angle+'deg';el.style.filter='grayscale('+(1-f.strength)+')';el.style.zIndex=String(10-Math.round(Math.abs(i-curvePosition)*2))});curveSurface?.render({width:curveRail.clientWidth,height:curveRail.clientHeight+160,frameWidth,gap,offset:curvePosition*gap,angle,energy:Math.min(Math.abs(curveImpulse)/500,1),visible:true})}
function update(){
 document.querySelectorAll('.markers button').forEach((b,i)=>{b.classList.toggle('active',i===selected);b.setAttribute('aria-pressed',i===selected)});
 if(!isGallery())return;
 const p=projects[selected];document.getElementById('counter').textContent='SELECTED WORK — 0'+(selected+1)+' / '+String(projects.length).padStart(2,'0');
 document.getElementById('category').textContent=p.category;const title=document.getElementById('project-title');title.textContent=p.title;title.href='#'+p.id;document.getElementById('subtitle').textContent=p.sub;
 document.querySelectorAll('.piece').forEach((el,i)=>{el.classList.toggle('selected',i===selected);el.setAttribute('aria-label',projects[i].sub+(i===selected?' 상세 보기':' 선택'));el.tabIndex=0});
 paintGallery(selected);
}

function bindGalleryHover(rail){
 let timer=0,pending=-1,lockedUntil=0,lastX=null,lastY=null;
 const cancel=()=>{clearTimeout(timer);pending=-1};
 rail.addEventListener('pointermove',e=>{
  if(e.pointerType!=='mouse'||!window.matchMedia('(hover: hover) and (pointer: fine)').matches)return;
  if(e.clientX===lastX&&e.clientY===lastY)return;lastX=e.clientX;lastY=e.clientY;
  if(e.buttons||rail.classList.contains('is-dragging')||Date.now()<lockedUntil){cancel();return}
  const card=e.target.closest('.piece'),index=card?[...rail.querySelectorAll('.piece')].indexOf(card):-1;
  if(index<0||index===selected){cancel();return}if(pending===index)return;
  cancel();pending=index;timer=setTimeout(()=>{pending=-1;if(!rail.isConnected||!isGallery()||rail.classList.contains('is-dragging'))return;selected=index;lockedUntil=Date.now()+900;update()},140);
 });
 rail.addEventListener('pointerleave',cancel);rail.addEventListener('pointerdown',cancel);rail.addEventListener('click',cancel);
 const wheel=()=>{cancel();lockedUntil=Date.now()+1100};
 window.addEventListener('wheel',wheel,{passive:true});
 const cleanup=()=>{if(!rail.isConnected){cancel();window.removeEventListener('wheel',wheel);window.removeEventListener('hashchange',cleanup)}};window.addEventListener('hashchange',cleanup);
}

function bindGalleryDrag(rail){
 let startX=0,startPosition=0,position=0,pointer=null,dragged=false,suppressClick=false;
 rail.addEventListener('click',e=>{if(suppressClick){e.preventDefault();e.stopImmediatePropagation();suppressClick=false}},true);
 rail.onpointerdown=e=>{if(e.button!==0||!e.isPrimary)return;startX=e.clientX;startPosition=selected;position=selected;pointer=e.pointerId;dragged=false};
 rail.onpointermove=e=>{
  if(pointer!==e.pointerId)return;const delta=e.clientX-startX;if(!dragged&&Math.abs(delta)<7)return;
  if(!dragged){dragged=true;rail.setPointerCapture(e.pointerId);rail.classList.add('is-dragging')}
  position=Math.max(-.15,Math.min(projects.length-1+.15,startPosition-delta/(galleryMetrics().width*.72)));
  paintGallery(position);e.preventDefault();
 };
 const release=e=>{if(pointer!==e.pointerId)return;pointer=null;if(!dragged)return;rail.classList.remove('is-dragging');
  if(e.type!=='pointercancel'){const delta=e.clientX-startX;let next=Math.round(position);if(next===startPosition&&Math.abs(delta)>45)next=startPosition+(delta<0?1:-1);selected=Math.max(0,Math.min(projects.length-1,next))}
  suppressClick=true;setTimeout(()=>suppressClick=false,0);dragged=false;
  if(rail.hasPointerCapture(e.pointerId))rail.releasePointerCapture(e.pointerId);update();
 };
 rail.onpointerup=release;rail.onpointercancel=release;rail.ondragstart=e=>e.preventDefault();
 requestAnimationFrame(()=>requestAnimationFrame(()=>rail.classList.add('is-ready')));
}

function toolbar(label){return `<div class="toolbar"><a href="#work">↖ All work</a><span>${label}</span></div>`}

let introTimer, introCleanup;
function introMarkup(p){
 const lines=p.id==='drama-title'?['참교육']:p.id==='ai-film'?['지진안전','AI 공모전']:['기쁨, 슬픔,','아름다운 마음'];
 let index=0;
 return '<div class="project-intro intro-'+p.id+'"><div class="intro-top"><span>EJ / SELECTED WORK</span><button type="button" class="intro-skip">영상 바로 보기 ↘</button></div><div class="intro-title" aria-label="'+p.title+'">'+lines.map(line=>'<div class="intro-line" aria-hidden="true">'+[...line].map(char=>'<span class="intro-mask"><span class="intro-letter" style="--i:'+index+++'">'+(char===' '?'&nbsp;':char)+'</span></span>').join('')+'</div>').join('')+'</div><div class="intro-bottom"><span>'+p.category+'</span><span>0'+(projects.indexOf(p)+1)+' / 0'+projects.length+'</span></div></div>';
}
function startProjectIntro(p){
 const intro=document.querySelector('.project-intro'),stage=document.querySelector('.cinema-stage');
 if(!intro||!stage)return;
 if(p.id==='ai-film')stage.closest('article').querySelector('.detail-note span').textContent='자동 재생은 음소거로 시작합니다. 소리는 플레이어에서 켜 주세요.';
 const reduced=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
 let finished=false;
 const finish=()=>{if(finished)return;finished=true;clearTimeout(introTimer);intro.classList.add('leaving');
  const frame=stage.querySelector('iframe[data-src]');if(frame){frame.src=frame.dataset.src+(reduced?'?playsinline=1':'?autoplay=1&mute=1&playsinline=1');frame.removeAttribute('data-src')}
  introCleanup=setTimeout(()=>intro.remove(),reduced?0:(p.id==="drama-title"?220:325));
 };
 intro.querySelector('.intro-skip').onclick=finish;
 introTimer=setTimeout(finish,reduced?0:(p.id==="drama-title"?650:1050));
}


function initProfileVideo(){const video=document.querySelector('.profile-video'),button=document.querySelector('.profile-video-control');if(!video||!button)return;video.muted=true;const sync=()=>{button.textContent=video.paused?'▶':'Ⅱ';button.setAttribute('aria-label',video.paused?'프로필 영상 재생':'프로필 영상 일시정지');button.setAttribute('aria-pressed',String(video.paused))};video.addEventListener('play',sync);video.addEventListener('pause',sync);if(window.matchMedia('(prefers-reduced-motion: reduce)').matches){video.autoplay=false;video.pause()}else video.play().catch(sync);button.onclick=()=>{if(video.paused)video.play().catch(sync);else video.pause()};sync()}

function render(){clearTimeout(introTimer);clearTimeout(introCleanup);const route=location.hash.slice(1)||'hero';document.body.classList.toggle('inner',!isGallery());document.querySelectorAll('[data-nav]').forEach(a=>a.classList.toggle('active',a.dataset.nav===(isGallery()?'work':route)));if(isGallery()){main.replaceChildren(document.querySelector('#gallery').content.cloneNode(true));const rail=document.querySelector('.rail');projects.forEach((p,i)=>{const b=document.createElement('button');b.className='piece';b.innerHTML=art(p);b.onclick=()=>{if(selected===i)location.hash=p.id;else{selected=i;update()}};rail.append(b)});bindGalleryDrag(rail);bindGalleryHover(rail);update()}else if(route==='about'){main.innerHTML=toolbar('About')+`<section class="page"><h1>About</h1><div class="about-grid"><div class="portrait profile-portrait"><video class="profile-video" src="ej-profile.mp4" autoplay muted loop playsinline preload="metadata" aria-label="EJ 프로필 영상"></video><button type="button" class="profile-video-control" aria-label="프로필 영상 일시정지" aria-pressed="false">Ⅱ</button><a href="#work">Selected work <span>↗</span></a></div><div class="about-copy"><h2>EJ</h2><span class="eyebrow profile-fields">Video · Motion Graphics · AI Visuals · AI-assisted Development</span><p>아이디어를 영상과 도구로 구체화하는 EJ입니다.<br>모션 그래픽과 영상 편집, AI 비주얼 제작을 함께 다룹니다.</p></div></div><div class="capabilities"><h2>Creative Fields</h2><div class="capability"><h3>Music Video</h3><p>음악의 리듬과 감정을 담는 뮤직비디오</p></div><div class="capability"><h3>Drama Title</h3><p>이야기의 시작을 만드는 드라마 타이틀</p></div><div class="capability"><h3>AI Promotional Film</h3><p>AI 비주얼로 표현하는 브랜드와 메시지</p></div></div></section>`}else if(route==='contact'){main.innerHTML=toolbar('Contact')+`<section class="page contact-page"><span class="eyebrow">CONTACT / EJ</span><h1 class="contact-head">Let’s create<br>something new.</h1><p class="contact-note">뮤직비디오 · 드라마 타이틀 · AI 홍보영상<br>함께 만들 다음 이야기를 기다립니다.</p><div class="contact-status"><strong>프로젝트 문의</strong><a href="mailto:yuyuyui@naver.com">yuyuyui@naver.com ↗</a></div></section>`}else{const p=projects.find(p=>p.id===route);if(!p){location.hash='work';return}main.innerHTML=toolbar(p.title)+`<article class="page cinema-page"><div class="cinema-stage">${introMarkup(p)}<div class="video-player ${p.vertical?'vertical':''}"><iframe data-src="https://www.youtube-nocookie.com/embed/${p.video}" title="${p.title} 영상 재생" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen referrerpolicy="strict-origin-when-cross-origin"></iframe></div></div><div class="cinema-controls"><a href="#work">↖ All work</a><button type="button" id="show-project-info">작품 소개 ↓</button><span>EJ / ${p.sub}</span></div><div class="detail-note"><a href="https://www.youtube.com/watch?v=${p.video}" target="_blank" rel="noopener noreferrer">YouTube에서 보기 ↗</a><span>자동 재생은 음소거로 시작합니다. 소리는 플레이어에서 켜 주세요.</span></div><div class="overview" id="project-info" tabindex="-1"><h2>${p.overviewTitle?'<strong>'+p.overviewTitle+'</strong>':p.title}</h2><div><p class="project-description">${p.description}</p></div></div></article>`;selected=projects.indexOf(p);document.querySelector('#show-project-info').onclick=()=>{const info=document.querySelector('#project-info');info.scrollIntoView({behavior:window.matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth',block:'center'});info.focus({preventScroll:true})};}window.scrollTo(0,0);update();const activeProject=projects.find(p=>p.id===route);if(activeProject)startProjectIntro(activeProject);initProfileVideo()}
const theme=document.querySelector('#theme');function setTheme(dark){document.body.classList.toggle('dark',dark);theme.innerHTML=dark?'☼ <span>Light</span>':'☾ <span>Dark</span>';theme.setAttribute('aria-label',dark?'라이트 테마로 전환':'다크 테마로 전환');try{localStorage.setItem('ej-theme',dark?'dark':'light')}catch{}}theme.onclick=()=>setTheme(!document.body.classList.contains('dark'));try{setTheme(localStorage.getItem('ej-theme')==='dark')}catch{}window.onhashchange=render;window.onresize=update;window.addEventListener('keydown',e=>{if(isGallery()&&['ArrowLeft','ArrowRight'].includes(e.key)){e.preventDefault();selected=(selected+(e.key==='ArrowRight'?1:projects.length-1))%projects.length;update()}});let lastWheel=0;window.addEventListener('wheel',e=>{if(isGallery()&&Math.abs(e.deltaY)+Math.abs(e.deltaX)>15){e.preventDefault();if(Date.now()-lastWheel>650){selected=(selected+(e.deltaY+e.deltaX>0?1:projects.length-1))%projects.length;lastWheel=Date.now();update()}}},{passive:false});render();

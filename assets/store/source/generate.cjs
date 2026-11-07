// 从矢量标志与当前扩展界面生成商店物料；仅制作时需要 playwright、sharp。
const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const sharp = require('sharp');
const {chromium} = require('playwright');
const root = path.resolve(__dirname, '../../..');
const out = path.join(root, 'assets/store');
const blue = '#2A59FF';
const cursor = '<path d="M35 27 Q32 25 32 30V94Q32 99 36 96L53 79L66 103Q67 105 70 104L80 98Q82 97 80 94L67 71L94 69Q99 69 95 65Z" fill="white"/>';
const curve = '<path d="M53 24H94V54M53 24C78 24 94 35 94 54" fill="none" stroke="white" stroke-opacity=".6" stroke-width="2"/><g fill="white"><rect x="50" y="21" width="6" height="6" rx="1"/><rect x="91" y="21" width="6" height="6" rx="1"/><rect x="91" y="51" width="6" height="6" rx="1"/></g>';
const mark = (simple=false) => `<rect x="4" y="4" width="120" height="120" rx="28" fill="${blue}"/>${simple?'':curve}${cursor}`;
const svg = (w,h,body) => `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}"><defs><pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse"><path d="M40 0H0V40" fill="none" stroke="#DDE4F2" stroke-width=".7"/></pattern><filter id="shadow" x="-30%" y="-30%" width="160%" height="180%"><feDropShadow dx="0" dy="12" stdDeviation="18" flood-color="#182A60" flood-opacity=".12"/></filter></defs>${body}</svg>`;
const text=(x,y,size,value,fill='#121A2C',weight=600)=>`<text x="${x}" y="${y}" font-family="Arial, PingFang SC, sans-serif" font-size="${size}" font-weight="${weight}" fill="${fill}">${value}</text>`;
const brand=(x,y,size=26)=>`<g transform="translate(${x},${y}) scale(.28)">${mark()}</g>${text(x+46,y+27,size,'Design Cursor')}`;
const bg=(w,h)=>`<rect width="${w}" height="${h}" fill="#F4F7FC"/><rect width="${w}" height="${h}" fill="url(#grid)"/>`;
async function save(name,w,h,body){const data=svg(w,h,body);fs.writeFileSync(path.join(out,'source',name+'.svg'),data);await sharp(Buffer.from(data)).flatten({background:'#FFFFFF'}).removeAlpha().png().toFile(path.join(out,name+'.png'));}
const fixture=`<!doctype html><html lang="zh-CN"><meta charset="utf-8"><title>Forma — 工作空间</title><style>*{box-sizing:border-box}body{margin:0;background:#fafbfe;color:#182137;font:14px -apple-system,BlinkMacSystemFont,sans-serif}nav{height:60px;display:flex;align-items:center;padding:0 42px;border-bottom:1px solid #e7eaf2;background:white;gap:38px}nav b{font-size:22px;margin-right:auto}nav span{color:#788298}main{padding:24px 48px;width:750px}small{color:#75819a;font-size:12px}h1{font-size:30px;letter-spacing:-1px;margin:12px 0}p{color:#75819a;line-height:1.8}.cards{display:flex;gap:20px;margin-top:20px}.card{width:300px;background:white;border:1px solid #e7eaf2;border-radius:16px;padding:24px}.art{height:100px;background:#edf2ff;border-radius:10px;display:grid;place-items:center;overflow:hidden}.orb{height:76px;width:76px;border:18px solid #2a59ff;border-radius:28px;transform:rotate(-20deg);box-shadow:22px 22px 0 #c5d2ff}.card h2{font-size:18px;margin:16px 0 6px}.card p{font-size:13px;margin:0 0 16px}.card button{background:#2a59ff;color:white;border:0;border-radius:8px;padding:11px 22px;font:inherit}.secondary .art{background:#f3effb}.secondary .orb{border-color:#ab95da;box-shadow:22px 22px 0 #ded1f7;border-radius:50%}.secondary button{background:#f1f3f9;color:#57627a}</style><nav><b>forma.</b><span>工作空间</span><span>项目</span><span>素材</span><span>NY</span></nav><main><small>你的设计空间</small><h1 id="title">让每一个想法，成为作品。</h1><p>从一个灵感开始，创造下一个值得分享的界面。</p><div class="cards"><article class="card" id="target"><div class="art"><div class="orb"></div></div><h2>品牌设计系统</h2><p>把色彩、组件和灵感，整理成一致的设计语言。</p><button id="action">查看项目</button></article><article class="card secondary"><div class="art"><div class="orb"></div></div><h2>新的可能</h2><p>收集灵感，探索更清晰的产品表达。</p><button>查看项目</button></article></div></main></html>`;
fs.writeFileSync(path.join(__dirname,'workspace.html'),fixture);
(async()=>{
 fs.writeFileSync(path.join(out,'source/logo.svg'),svg(128,128,mark()));
 for(const size of [16,48,128]) await sharp(Buffer.from(svg(128,128,mark(size===16)))).resize(size,size).png().toFile(path.join(root,`logo_${size}.png`));
 await save('store-icon-128',128,128,mark());
 await save('logo-1024',1024,1024,`<g transform="scale(8)">${mark()}</g>`);
 const server=http.createServer((req,res)=>{res.setHeader('Content-Type','text/html; charset=utf-8');res.end(fixture)});
 await new Promise(r=>server.listen(0,'127.0.0.1',r));
 let browser;
 try{
  browser=await chromium.launch({executablePath:process.env.CHROME_EXECUTABLE_PATH||'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:true});
  const captures=[];
  for(const mode of ['adjust','input','layout']){
   const page=await browser.newPage({viewport:{width:1104,height:610},deviceScaleFactor:2,colorScheme:'light'});
   await page.goto(`http://127.0.0.1:${server.address().port}`);
   await page.addScriptTag({content:'window.chrome={runtime:{onMessage:{addListener(){}}}};'});
   await page.addStyleTag({path:path.join(root,'content.css')});
   for(const file of fs.readdirSync(path.join(root,'content')).filter(f=>f.endsWith('.js')).sort())await page.addScriptTag({path:path.join(root,'content',file)});
   await page.evaluate(mode=>{
    activatePicker();setSelectionMode(mode==='input'?'select':mode,false);
    const el=document.querySelector(mode==='input'?'#title':'#target');
    const target=createElementTarget(el);state.selectedTargets=[target];state.highlightsVisible=true;renderSelection();
    if(mode==='adjust')openAdjustPopover(target);
    if(mode==='input'){openPromptPopover(target);state.promptTextarea.value='标题字号改为 36px，字重 600，保留左对齐。';}
    refreshHighlights();
   },mode);
   await page.waitForTimeout(2400);
   const buffer=await page.screenshot();captures.push(buffer);
   fs.writeFileSync(path.join(out,'source',`capture-${mode}.png`),buffer);
   await page.close();
  }
  const titles=['选中网页，直接调整。','说清修改，让 AI 接着做。','重新排版，保留每一步。'];
  const subtitles=['尺寸、间距、颜色，在页面上精确表达。','选中元素，补充要求，复制结构化上下文。','选择、移动、撤销，把布局意图交给 AI。'];
  for(let i=0;i<3;i++){
   const data=captures[i].toString('base64');
   await save(`screenshot-0${i+1}-1280x800`,1280,800,bg(1280,800)+brand(52,36)+text(52,137,42,titles[i])+text(52,176,19,subtitles[i],'#68758C',400)+`<rect x="52" y="214" width="1176" height="562" rx="18" fill="white" stroke="#DDE4F0" filter="url(#shadow)"/><clipPath id="clip"><rect x="53" y="215" width="1174" height="560" rx="16"/></clipPath><image x="53" y="215" width="1174" height="560" preserveAspectRatio="xMidYMid meet" clip-path="url(#clip)" href="data:image/png;base64,${data}"/>`);
  }
  await save('small-promo-440x280',440,280,bg(440,280)+`<g transform="translate(32,34) scale(.52)">${mark()}</g>`+text(32,159,43,'Design Cursor')+text(34,204,21,'选中网页，设计随行。','#63718B',400));
  await save('marquee-promo-1400x560',1400,560,bg(1400,560)+brand(64,55,28)+text(64,233,52,'指向哪里，')+text(64,303,52,'就从哪里开始设计。')+text(66,365,22,'选中 · 调整 · 排版 · 复制给 AI','#68758C',400)+`<rect x="632" y="110" width="720" height="364" rx="20" fill="white" filter="url(#shadow)"/><clipPath id="shot"><rect x="640" y="118" width="704" height="348" rx="18"/></clipPath><image x="640" y="118" width="704" height="348" clip-path="url(#shot)" href="data:image/png;base64,${captures[0].toString('base64')}"/>`);
 }finally{await browser?.close();await new Promise(r=>server.close(r));}
 const names=fs.readdirSync(out).filter(n=>n.endsWith('.png')&&n!=='preview.png');
 const thumbs=await Promise.all(names.map(async(n,i)=>({input:await sharp(path.join(out,n)).resize({width:560,height:340,fit:'contain',background:'#e8edf5'}).png().toBuffer(),left:(i%2)*584+16,top:Math.floor(i/2)*364+16})));
 await sharp({create:{width:1184,height:Math.ceil(names.length/2)*364+16,channels:3,background:'#e8edf5'}}).composite(thumbs).png().toFile(path.join(out,'preview.png'));
 for(const name of names){const m=await sharp(path.join(out,name)).metadata();console.log(name,m.width,m.height,m.channels);}
})().catch(e=>{console.error(e);process.exitCode=1});

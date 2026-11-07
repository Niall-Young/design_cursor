const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const http = require('node:http');
(async () => {
  const server = http.createServer((req, res) => res.end(`<!doctype html><meta charset="utf-8"><title>布局测试</title><style>article,section{padding:24px}h3,p{min-height:30px}</style><section id="thinking"><article><h3>把方法变成系统</h3><p>用资产与标注承载规则，让方法不再只存在于记忆中</p></article></section><section id="works"><div>PLG 组件 UI Vibe Design 将页面转化为产品</div></section>`));
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  let browser;
  try {
    const executablePath = process.env.CHROME_EXECUTABLE_PATH || (process.platform === 'darwin' ? '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome' : undefined);
    browser = await chromium.launch({ executablePath, headless: true });
    const page = await browser.newPage();
    await page.goto(`http://127.0.0.1:${server.address().port}`);
    await page.addScriptTag({ content: 'window.chrome = {runtime: {onMessage: {addListener() {}}}};' });
    await page.addStyleTag({ path: 'content.css' });
    for (const file of fs.readdirSync('content').filter(f => f.endsWith('.js')).sort()) await page.addScriptTag({ path: `content/${file}` });
    const result = await page.evaluate(() => {
      activatePicker();
      setSelectionMode('layout');
      const title = document.querySelector('article h3'), text = document.querySelector('article p');
      state.selectedTargets = [createElementTarget(text), createElementTarget(title)];
      renderSelection();
      const drag = (index, plan) => {
        const rect = getTargetElement(state.selectedTargets[index]).getBoundingClientRect();
        startLayoutDrag(index, {clientX:rect.x+5,clientY:rect.y+5,pointerId:1}, plan.operation === 'insert' ? 'free' : 'selected-only');
        if (state.dragSession.placeholder) plan.parent.insertBefore(state.dragSession.placeholder, plan.referenceNode);
        state.dragSession.dropPlan = plan;
        finishLayoutDrag({type:'pointerup'});
      };
      drag(0, {operation:'swap',targetElement:title});
      duplicateLayoutTarget(state.selectedTargets[1], 'bottom');
      const copy = getTargetElement(state.selectedTargets[2]);
      const works = document.querySelector('#works');
      drag(2, {operation:'insert',parent:works,referenceNode:works.firstChild});
      const payload = buildClipboardPayload();
      const single = buildClipboardPayloadForTargets([state.selectedTargets[2]]);
      const finalOrder = [...document.querySelector('article').children].map(e => e.tagName);
      undoSelectionHistory();
      const undoMove = copy.parentElement.tagName;
      undoSelectionHistory();
      const undoCopy = !copy.isConnected && state.selectedTargets.length === 2;
      const afterUndo = buildClipboardPayload();
      redoSelectionHistory();
      redoSelectionHistory();
      return {payload,single,finalOrder,undoMove,undoCopy,afterUndo,redoSame:payload === buildClipboardPayload(), copyFirst:works.firstElementChild === copy};
    });
    assert.deepEqual(result.finalOrder, ['P','H3']);
    for (const content of [result.payload, result.single]) {
      assert.match(content, /操作 1[\s\S]*操作 2[\s\S]*操作 3/);
      assert.match(content, /副本 2（由操作 2 创建）/);
      assert.match(content, /PLG 组件 UI Vibe Design 将页面转化为产品/);
      assert.match(content, /#works/);
    }
    assert.equal(result.undoMove, 'ARTICLE');
    assert.equal(result.undoCopy, true);
    assert.doesNotMatch(result.afterUndo, /操作 2（/);
    assert.equal(result.redoSame, true);
    assert.equal(result.copyFirst, true);
    console.log('PASS: 浏览器真实 DOM 交换→复制→跨容器移动，单条/全部输出，撤销/重做');
  } finally { await browser?.close(); server.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });

const { test } = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const fs = require('node:fs');
function setup() {
  class Element {
    constructor(name) { this.name = name; this.outerHTML = `<div>${name}</div>`; }
  }
  const a = new Element('A'), b = new Element('B'), parent = new Element('container');
  const targets = [a, b].map(element => ({ element }));
  const context = vm.createContext({ Element, state: { selectedTargets: targets, layoutOperationSequence: 0, layoutCopies: new WeakMap() },
    cssPath: e => `#${e.name}`, truncate: s => s,
    getTargetElement: t => t.element, createElementTarget: element => ({ element }),
    getTargetPreviewText: t => t.element.name,
    findSelectedTarget: t => targets.find(x => x.element === t.element) });
  const code = fs.readFileSync('content/20-core.js', 'utf8');
  vm.runInContext(code.slice(code.indexOf('function describeElementForLayoutPrompt'), code.indexOf('function captureHistoryInverseEntry')), context);
  return { context, a, b, parent, targets };
}
test('swap records both identities once per operation and preserves successive operations', () => {
  const { context: c, a, b, targets } = setup();
  const plan = { operation: 'swap', targetElement: b };
  const instruction = c.captureLayoutInstruction(targets[0], plan);
  a.name = 'moved-A';
  c.applyLayoutInteractionPrompts(targets[0], plan, instruction);
  assert.match(targets[0].layoutPromptText, /#A/);
  assert.match(targets[0].layoutPromptText, /#B/);
  assert.equal(targets[0].layoutPromptText, targets[1].layoutPromptText);
  c.applyLayoutInteractionPrompts(targets[0], plan, instruction);
  assert.match(targets[0].layoutPromptText, /操作 1[\s\S]*操作 2/);
});
test('insertion uses the actual reference node, including a text-node boundary or container end', () => {
  const { context: c, b, parent, targets } = setup();
  const plan = { operation: 'insert', parent, referenceNode: { nextElementSibling: b } };
  assert.match(c.captureLayoutInstruction(targets[0], plan), /锚点元素之前.*#B/);
  assert.match(c.captureLayoutInstruction(targets[0], plan), /#container/);
  plan.referenceNode = null;
  assert.match(c.captureLayoutInstruction(targets[0], plan), /容器末尾/);
});

import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
import {repositoryModule} from './evaluation/render.mjs';
const previousWindow=globalThis.window, previousEnv=process.env.NODE_ENV;
process.env.NODE_ENV='development';globalThis.window={};
const code=ts.transpileModule(fs.readFileSync('lib/whiteboard/store.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
function reload(){const mod={exports:{}};vm.runInThisContext(`(function(require,module,exports){${code}\n})`)(name=>repositoryModule(`lib/whiteboard/${name.slice(2)}`),mod,mod.exports);return mod.exports;}
try{
 const before=reload();before.resetBoard();before.applyDrawCommands([{op:'circle',id:'body',center:{x:.3,y:.4},r:.1}]);
 before.addStudentStroke({id:'ink',tool:'pen',color:'blue',points:[{x:.2,y:.7},{x:.5,y:.7}]});
 let notifications=0;const unsubscribe=before.subscribeBoard(()=>notifications++);
 const snapshot=structuredClone(before.getBoardState());const after=reload();
 assert.deepEqual(after.getBoardState(),snapshot,'Module replacement preserves drawings and student ink');
 after.applyDrawCommands([{op:'text',id:'label',at:{x:.6,y:.4},text:'Object'}]);
 assert.equal(notifications,1,'Existing subscribers still receive changes');
 assert.deepEqual(before.getBoardState(),after.getBoardState(),'Old callbacks read the same current store');
 unsubscribe();
 globalThis.window={};assert.equal(reload().getBoardState().groups.length,0,'Another browser tab starts independently');
 console.log('PASS: development refresh preserves board/ink, subscriptions, old callbacks, and tab isolation.');
}finally{if(previousWindow===undefined)delete globalThis.window;else globalThis.window=previousWindow;if(previousEnv===undefined)delete process.env.NODE_ENV;else process.env.NODE_ENV=previousEnv;}

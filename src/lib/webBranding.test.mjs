import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const read=path=>fs.readFileSync(new URL(path,import.meta.url));
test('web tab and Safari touch icons use otter assets and a cache-versioned URL',()=>{
 const html=read('../../public/index.html').toString();
 assert.match(html,/rel="icon"[^>]+href="\/favicon\.ico\?v=otter-/);
 assert.match(html,/rel="apple-touch-icon"[^>]+href="\/apple-touch-icon\.png\?v=otter-/);
 assert(!html.includes('/_expo/static/js/')); // Expo injects the current bundle at export.
 assert.equal(read('../../public/favicon.ico').readUInt16LE(2),1);
 assert(read('../../public/apple-touch-icon.png').equals(read('../../assets/favicon.png')));
 const config=JSON.parse(read('../../app.json'));assert.equal(config.expo.web.favicon,'./assets/finsight-mascot-face.png');
});

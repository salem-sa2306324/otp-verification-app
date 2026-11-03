const {test}=require('node:test'),assert=require('node:assert/strict'),{createHmac}=require('node:crypto');
function email(v){if(typeof v!=='string'||v.length>254)return null;v=v.trim().toLowerCase();return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)?v:null}
test('email validation normalizes and rejects invalid addresses',()=>{assert.equal(email(' Person@Example.COM '),'person@example.com');assert.equal(email('bad'),null);assert.equal(email(null),null)});
test('HMAC values are destination and code bound',()=>{const f=(d,c)=>createHmac('sha256','a-long-test-secret-value').update(d+':'+c).digest('hex');assert.equal(f('a@b.com','123456'),f('a@b.com','123456'));assert.notEqual(f('a@b.com','123456'),f('x@b.com','123456'));assert.notEqual(f('a@b.com','123456'),f('a@b.com','654321'))});

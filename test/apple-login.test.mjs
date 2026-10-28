import {test} from 'node:test';
import assert from 'node:assert/strict';
import {beginAppleLogin,readAppleResult,clearAppleFlow} from '../src/lib/apple-login.ts';
const config={clientID:'test.web',redirectURI:'https://japanese-learning.makoto.lol/shadowing/auth/apple/callback'};
function setup(){const map=new Map();return {getItem:k=>map.get(k)??null,setItem:(k,v)=>map.set(k,v),removeItem:k=>map.delete(k)};}
function begin(storage){const url=new URL(beginAppleLogin(config,'http://localhost:5173',storage));return {url,...JSON.parse(decodeURIComponent(url.hash.slice(1)))};}
const resultHash=data=>'#apple_result='+encodeURIComponent(JSON.stringify(data));
test('starts a same-tab flow with state and nonce preserved for the return',()=>{
 const storage=setup(),flow=begin(storage);
 assert.equal(flow.url.origin,new URL(config.redirectURI).origin);
 const decoded=JSON.parse(atob(flow.state.replace(/-/g,'+').replace(/_/g,'/')));
 assert.equal(decoded.mode,'redirect');assert.equal(decoded.origin,'http://localhost:5173');
 assert.deepEqual(readAppleResult(resultHash({state:flow.state,code:'one-use-code'}),storage),{body:{authorizationCode:'one-use-code',hashedNonce:flow.nonce}});
});
test('cancellation returns a retryable message and a new attempt uses fresh state',()=>{
 const storage=setup(),flow=begin(storage);
 assert.match(readAppleResult(resultHash({state:flow.state,error:'user_cancelled_authorize'}),storage).error,/キャンセル/);
 clearAppleFlow(storage);assert.notEqual(begin(storage).state,flow.state);
});
test('does not accept another login state',()=>{const storage=setup();begin(storage);assert.match(readAppleResult(resultHash({state:'wrong',code:'code'}),storage).error,/一致しません/);});
test('does not accept a callback after the browser flow was cleared',()=>{const storage=setup(),flow=begin(storage);clearAppleFlow(storage);assert.ok(readAppleResult(resultHash({state:flow.state,code:'code'}),storage).error);});
test('handles malformed callbacks without throwing',()=>{assert.ok(readAppleResult('#apple_result=invalid',setup()).error);});
test('normal login navigation has no callback',()=>{assert.equal(readAppleResult('',setup()),null);});

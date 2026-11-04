const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const html=fs.readFileSync(require('node:path').join(__dirname,'../index.html'),'utf8');
const appSource=fs.readFileSync(require('node:path').join(__dirname,'../workspace-app.js'),'utf8');
function interfaceForTest(){
 const nodes=new Map();
 const get=id=>{
  if(!nodes.has(id))nodes.set(id,{value:'',textContent:'',disabled:false,events:{},classes:new Set(['hidden']),
   addEventListener(event,handler){this.events[event]=handler;},reportValidity(){return true;},focus(){this.focused=true;},
   classList:{add(name){get(id).classes.add(name);},remove(name){get(id).classes.delete(name);}}});
  return nodes.get(id);
 };
 const context={document:{getElementById:get},State:{},cloudClient:{},SafarAuth:{async submit(){throw new Error('Email belum ditambahkan oleh administrator.');}}};
 vm.createContext(context);
 const start=appSource.indexOf('const App = {');
 const end=appSource.indexOf('// Staff initialization',start);
 vm.runInContext(appSource.slice(start,end)+'\nglobalThis.testApp=App;',context);
 return {app:context.testApp,get,context};
}
test('single-password activation submits and dismisses a server error without losing input',async()=>{
 const {app,get,context}=interfaceForTest();
 app.bindAuthEvents();app.setAuthMode(true);
 get('auth-email').value='new@example.com';get('auth-password').value='abc123';
 await get('login-form').events.submit({preventDefault(){}});
 assert.equal(context.State.isRegisterMode,true);
 assert.equal(get('auth-alert-message').textContent,'Email belum ditambahkan oleh administrator.');
 assert.equal(get('auth-alert').classes.has('hidden'),false);
 assert.equal(get('btn-login').disabled,false);
 get('dismiss-auth-alert').events.click();
 assert.equal(get('auth-alert').classes.has('hidden'),true);
 assert.equal(get('auth-password').value,'abc123');
 assert.equal(get('auth-password').focused,true);
});
test('activation renders one password input and no save-password checkbox',()=>{
 const form=html.slice(html.indexOf('<form id="login-form"'),html.indexOf('</form>',html.indexOf('<form id="login-form"')));
 assert.equal((form.match(/type="password"/g)||[]).length,1);
 assert.ok(!form.includes('type="checkbox"'));
});

document.addEventListener('DOMContentLoaded',()=>{
 const select=document.getElementById('finance-range');if(!select)return;
 const trigger=document.createElement('button');trigger.type='button';trigger.className='select-trigger';trigger.setAttribute('role','combobox');trigger.setAttribute('aria-label','Periode grafik');trigger.setAttribute('aria-haspopup','listbox');trigger.setAttribute('aria-expanded','false');
 const list=document.createElement('div');list.id='finance-range-options';list.className='select-popup';list.role='listbox';list.setAttribute('aria-label','Periode grafik');list.hidden=true;document.body.append(list);trigger.setAttribute('aria-controls',list.id);
 select.after(trigger);select.classList.add('enhanced-select');document.querySelector('label[for="finance-range"]').htmlFor='finance-range-trigger';trigger.id='finance-range-trigger';let active=select.selectedIndex;
 const options=Array.from(select.options).map((o,i)=>{const el=document.createElement('div');el.id='finance-option-'+i;el.role='option';el.textContent=o.text;el.onclick=()=>choose(i);list.append(el);return el;});
 function sync(){trigger.textContent=select.selectedOptions[0].text+'  ▾';options.forEach((o,i)=>{o.setAttribute('aria-selected',i===select.selectedIndex);o.classList.toggle('active',i===active);});trigger.setAttribute('aria-activedescendant',list.hidden?'':options[active].id);}
 function position(){const r=trigger.getBoundingClientRect();list.style.width=Math.max(220,r.width)+'px';list.style.left=Math.max(8,Math.min(innerWidth-228,r.right-220))+'px';list.style.top=(r.bottom+190>innerHeight?Math.max(8,r.top-184):r.bottom+8)+'px';}
 function close(){list.hidden=true;trigger.setAttribute('aria-expanded','false');sync();}
 function open(){active=select.selectedIndex;list.hidden=false;trigger.setAttribute('aria-expanded','true');position();sync();}
 function choose(i){select.selectedIndex=i;select.dispatchEvent(new Event('change',{bubbles:true}));close();trigger.focus();}
 trigger.onclick=()=>list.hidden?open():close();
 trigger.onkeydown=e=>{if(e.key==='Tab'){close();return;}if(e.key==='Escape'){close();return;}if(['ArrowDown','ArrowUp','Home','End','Enter',' '].includes(e.key)){e.preventDefault();if(list.hidden){open();return;}if(e.key==='Enter'||e.key===' '){choose(active);return;}active=e.key==='Home'?0:e.key==='End'?options.length-1:Math.max(0,Math.min(options.length-1,active+(e.key==='ArrowDown'?1:-1)));sync();}else if(e.key.length===1){const i=Array.from(select.options).findIndex(o=>o.text.toLowerCase().startsWith(e.key.toLowerCase()));if(i>=0){if(list.hidden)open();active=i;sync();}}};
 document.addEventListener('pointerdown',e=>{if(!trigger.contains(e.target)&&!list.contains(e.target))close();});window.addEventListener('resize',close);window.addEventListener('scroll',close,true);select.addEventListener('change',sync);sync();
});

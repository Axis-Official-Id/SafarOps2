(() => {
  'use strict';
  // Indonesian summaries of meaning; references link to the complete texts.
  const quotes = [
    ['Bersama kesulitan ada kemudahan.', 'Al-Qur’an · Ash-Sharh 94:5', 'https://quran.com/94/5'],
    ['Mengingat Allah membawa ketenteraman hati.', 'Al-Qur’an · Ar-Ra’d 13:28 (penggalan)', 'https://quran.com/13/28'],
    ['Nilai amal bergantung pada niatnya.', 'Hadis sahih · Al-Bukhari 1 (penggalan)', 'https://sunnah.com/bukhari:1'],
    ['Allah menolong hamba yang menolong saudaranya.', 'Hadis sahih · Muslim 2699a (penggalan)', 'https://sunnah.com/muslim:2699a']
  ];
  const read = key => { try { return localStorage.getItem(key); } catch { return null; } };
  const save = (key,value) => { try { localStorage.setItem(key,String(value)); } catch {} };
  document.addEventListener('DOMContentLoaded', () => {
    const app = document.getElementById('app-view');
    const sidebar = app.querySelector('aside');
    sidebar.id = 'workspace-sidebar';
    const previous = Number(read('safarops-last-quote') ?? -1);
    const choices = quotes.map((_,i)=>i).filter(i=>i!==previous);
    const index = choices[Math.floor(Math.random()*choices.length)];
    save('safarops-last-quote',index);
    const arabic = ['فَإِنَّ مَعَ الْعُسْرِ يُسْرًا', 'أَلَا بِذِكْرِ اللَّهِ تَطْمَئِنُّ الْقُلُوبُ', 'إِنَّمَا الْأَعْمَالُ بِالنِّيَّاتِ', 'وَاللَّهُ فِي عَوْنِ الْعَبْدِ مَا كَانَ الْعَبْدُ فِي عَوْنِ أَخِيهِ'];
    const card = sidebar.querySelector('p.font-serif').parentElement;
    card.replaceChildren();
    card.className = 'workspace-quote';
    const label = document.createElement('p'); label.textContent = arabic[index]; label.lang='ar'; label.dir='rtl'; label.className='quote-arabic';
    const text = document.createElement('blockquote'); text.textContent = quotes[index][0];
    const source = document.createElement('a'); source.textContent = quotes[index][1]; source.href = quotes[index][2]; source.target='_blank'; source.rel='noopener noreferrer';
    card.append(label,text,source);
    const button = (label, action) => { const b=document.createElement('button'); b.type='button'; b.textContent=label; b.addEventListener('click',action); return b; };
    const mobile = matchMedia('(max-width:1023px)');
    let closed = !mobile.matches && read('safarops-sidebar-closed')==='true';
    let width = Math.min(440,Math.max(240,Number(read('safarops-sidebar-width'))||288));
    const opener=button('',()=>{setClosed(false);closer.focus();});
    opener.className='sidebar-open no-print'; opener.setAttribute('aria-label','Buka menu'); opener.setAttribute('aria-controls',sidebar.id); opener.innerHTML='<i data-lucide="panel-left" aria-hidden="true"></i>';
    app.querySelector('main>header').prepend(opener);
    document.getElementById('dashboard-search-toggle').addEventListener('click',()=>document.getElementById('global-search').focus());
    const tools=document.createElement('div'); tools.className='sidebar-tools';
    const closer=button('',()=>{setClosed(true);opener.focus();});
    closer.setAttribute('aria-label','Tutup menu'); closer.innerHTML='<i data-lucide="panel-left-close" aria-hidden="true"></i>';
    closer.className='desktop-menu-button';
    sidebar.querySelector('h2').after(closer);
    // Replace the previous mobile-only toggle with the shared drawer controls.
    const handle=document.createElement('div'); handle.className='sidebar-resizer'; handle.tabIndex=0;
    handle.setAttribute('role','separator'); handle.setAttribute('aria-label','Ubah lebar menu dengan tombol panah atau seret'); handle.setAttribute('aria-orientation','vertical');
    handle.setAttribute('aria-valuemin','240'); handle.setAttribute('aria-valuemax','440'); sidebar.append(handle);
    function updateWidth(){width=Math.min(440,Math.max(240,width)); app.style.setProperty('--sidebar-width',width+'px');handle.setAttribute('aria-valuenow',String(width));save('safarops-sidebar-width',width);}
    function setClosed(value){closed=value; app.classList.toggle('sidebar-closed',closed);sidebar.inert=closed;sidebar.setAttribute('aria-hidden',String(closed));opener.setAttribute('aria-expanded',String(!closed));save('safarops-sidebar-closed',closed);if(!closed&&mobile.matches)closer.focus();}
    handle.addEventListener('pointerdown',e=>{if(e.button!==0)return;handle.setPointerCapture(e.pointerId);e.preventDefault();});
    handle.addEventListener('pointermove',e=>{if(handle.hasPointerCapture(e.pointerId)){width=Math.round(e.clientX);updateWidth();}});
    handle.addEventListener('pointerup',e=>{if(handle.hasPointerCapture(e.pointerId))handle.releasePointerCapture(e.pointerId);});
    handle.addEventListener('keydown',e=>{if(!['ArrowLeft','ArrowRight','Home','End'].includes(e.key))return;e.preventDefault();width=e.key==='Home'?240:e.key==='End'?440:width+(e.key==='ArrowRight'?16:-16);updateWidth();});
    sidebar.addEventListener('keydown',e=>{if(e.key==='Escape'){setClosed(true);opener.focus();}});
    mobile.addEventListener('change',()=>setClosed(false));
    updateWidth();setClosed(closed);
    if(window.lucide) window.lucide.createIcons();
  },{once:true});
})();

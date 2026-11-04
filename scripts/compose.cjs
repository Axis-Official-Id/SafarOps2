const fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..');
const pages=['overview','packages','crm','manifest','finance','settings','superadmin'];
function compose(page='overview'){
 if(!pages.includes(page))throw Error('Unknown page');
 let html=fs.readFileSync(path.join(root,'index.html'),'utf8');
 html=html.replace(/<!-- page:([a-z]+) -->/g,(_,name)=>fs.readFileSync(path.join(root,'pages',name+'.html'),'utf8'));
 html=html.replace('<!-- page-styles -->',pages.map(name=>`<link rel="stylesheet" href="styles/pages/${name}.css">`).join('\n'));
 return html.replace('<body','<body data-page="'+page+'"');
}
module.exports={compose,pages};

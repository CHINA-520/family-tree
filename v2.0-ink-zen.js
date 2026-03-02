export default {
  async fetch(request, env) {
    const DB_KEY = "MO_FAMILY_DATA";
    const VIEW_PASSWORD = "666";  
    const EDIT_PASSWORD = "888";  

    if (request.method === 'POST') {
      try {
        const body = await request.json();
        if (body.auth !== EDIT_PASSWORD) return new Response('错误', { status: 403 });
        await env.MY_NOTES.put(DB_KEY, JSON.stringify(body.data));
        return new Response('OK');
      } catch (e) { return new Response('出错', { status: 500 }); }
    }

    let rawData = await env.MY_NOTES.get(DB_KEY) || "[]";

    const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
      <title>莫氏族谱-墨韵云笺版</title>
      <script src="https://d3js.org/d3.v7.min.js"></script>
      <style>
        :root { --m-red: #9d2933; --m-bg: #f4f0e6; --m-ink: #1a1a1a; --m-gold: #b39355; --m-paper: #fffdf9; }
        
        body { 
          background: var(--m-bg);
          background-image: url("https://www.transparenttextures.com/patterns/aged-paper.png");
          font-family: "PingFang SC", "Noto Serif SC", serif; 
          margin: 0; padding-bottom: 60px; color: var(--m-ink);
          overflow-x: hidden;
        }

        .header { 
          text-align: center; padding: 40px 20px; 
          background: rgba(244, 240, 230, 0.98); 
          border-bottom: 1px solid rgba(179, 147, 85, 0.2);
          position: sticky; top:0; z-index:100;
          box-shadow: 0 10px 30px rgba(0,0,0,0.02);
        }
        .nav { display: inline-flex; background: rgba(0,0,0,0.03); padding: 5px; border-radius: 50px; gap: 5px; }
        .nav button { border: none; padding: 12px 25px; border-radius: 50px; cursor: pointer; background: transparent; font-weight: bold; color: #776; font-size: 13px; transition: 0.4s; }
        .nav button.active { background: var(--m-red); color: #fff; box-shadow: 0 5px 15px rgba(157,41,51,0.3); }

        .container { max-width: 1200px; margin: 0 auto; padding: 25px; }

        .card { 
          background: var(--m-paper); border: 1px solid #e0d9c5; padding: 30px; margin-bottom: 30px;
          position: relative; transition: all 0.5s cubic-bezier(0.23, 1, 0.32, 1);
          box-shadow: 2px 2px 0px #e0d9c5;
        }
        .card::before { content: ""; position: absolute; inset: -1px; border: 1px solid rgba(179, 147, 85, 0.1); pointer-events: none; }
        .card:hover { transform: translateY(-5px) rotate(0.5deg); box-shadow: 15px 15px 40px rgba(0,0,0,0.05); border-color: var(--m-gold); }
        
        .gen-badge { 
          writing-mode: vertical-lr; position: absolute; left: -40px; top: 0;
          background: var(--m-gold); color: #fff; padding: 15px 5px; font-size: 12px;
          letter-spacing: 2px; box-shadow: 3px 3px 0 rgba(0,0,0,0.1);
        }
        .gen-group { position: relative; margin-left: 50px; border-left: 1px dashed #d1cbb7; padding-left: 30px; margin-bottom: 60px; }

        .name-area { font-size: 30px; font-weight: 900; margin-bottom: 20px; border-bottom: 1px solid #f0eee5; display: flex; align-items: flex-end; gap: 15px; }
        .name-area small { font-size: 14px; color: var(--m-gold); font-weight: normal; margin-bottom: 5px; }
        
        .stats-bar { background: #fff; margin: 50px 20px; padding: 40px; border: 1px solid #e2ddd2; border-radius: 2px; display: flex; justify-content: space-around; flex-wrap: wrap; gap: 20px; }
        .stat-item { text-align: center; min-width: 100px; }
        .stat-num { font-size: 32px; font-weight: 900; color: var(--m-red); display: block; border-bottom: 2px solid var(--m-red); padding-bottom: 5px; margin-bottom: 10px; }

        .float-btn { 
          position:fixed; bottom:50px; right:45px; width:75px; height:75px; 
          background: var(--m-red); color:#fff; border:none; 
          font-size:45px; cursor:pointer; z-index:99; 
          box-shadow: 5px 5px 15px rgba(157,41,51,0.4); transition: 0.2s;
          clip-path: polygon(8% 0%, 95% 5%, 100% 90%, 5% 98%, 0% 10%);
        }
        .float-btn:active { transform: scale(0.9) rotate(-5deg); }

        .link-pulse { stroke-dasharray: 10; animation: dash 20s linear infinite; }
        @keyframes dash { from { stroke-dashoffset: 1000; } to { stroke-dashoffset: 0; } }

        #panel { position: fixed; right: -100%; top: 0; width: 100%; max-width: 460px; height: 100%; background: var(--m-paper); z-index: 1000; padding: 50px; transition: 0.7s cubic-bezier(0.19, 1, 0.22, 1); box-shadow: -30px 0 80px rgba(0,0,0,0.15); border-left: 5px solid var(--m-red); }
        #panel.active { transform: translateX(-100%); right: -460px; }
        
        .form-group { margin-bottom: 25px; }
        .form-group label { display: block; font-size: 12px; color: var(--m-gold); margin-bottom: 8px; letter-spacing: 2px; }
        input, textarea { width: 100%; padding: 18px; border: 1px solid #eee; background: #fafafa; border-radius: 0; font-size: 15px; box-sizing: border-box; }
        input:focus { border-color: var(--m-red); background: #fff; outline: none; }
      </style>
    </head>
    <body>
      <div id="lock-screen" style="position:fixed; inset:0; background:var(--m-bg); z-index:9999; display:flex; align-items:center; justify-content:center;">
        <div style="text-align:center;">
          <h1 style="color:var(--m-red); font-size:56px; font-weight:900; letter-spacing:15px; margin:0;">莫氏族谱</h1>
          <p style="color:var(--m-gold); letter-spacing:8px; margin:20px 0 50px;">Digital Genealogy Archives</p>
          <input type="password" id="pw" placeholder="输入口令" onkeydown="if(event.keyCode==13) unlock()" style="width:220px; border:none; border-bottom:2px solid var(--m-red); background:transparent; text-align:center; font-size:24px; letter-spacing:10px; outline:none; padding:10px;">
          <br>
          <button onclick="unlock()" style="margin-top:50px; background:var(--m-ink); color:#fff; border:none; padding:15px 60px; font-size:16px; letter-spacing:4px; cursor:pointer;">开启档案</button>
        </div>
      </div>

      <div id="main-app" style="display:none;">
        <header class="header">
          <h1 style="color:var(--m-red); margin:0 0 25px 0; font-size:36px; letter-spacing:12px; font-weight:900;">莫氏族谱</h1>
          <div class="nav">
            <button id="btn-list" onclick="tab('list')">世系详录</button>
            <button id="btn-tree" onclick="tab('tree')">脉络树</button>
            <button id="btn-table" onclick="tab('table')">族名册</button>
            <button id="btn-map" onclick="tab('map')">血脉图</button>
            <button id="btn-export" onclick="tab('export')">备份</button>
          </div>
        </header>

        <div id="view-list" class="container"></div>
        <div id="view-tree" class="container" style="display:none;"><div id="tree-box" style="background:#fff; padding:60px; border:1px solid #e2ddd2;"></div></div>
        <div id="view-table" class="container" style="display:none;">
           <div style="background:#fff; border:1px solid #e2ddd2; overflow-x:auto;"><table style="width:100%; border-collapse:collapse; min-width:850px;"><thead><tr style="background:#fcfaf2; border-bottom:2px solid var(--m-red);"><th style="padding:25px;">世代</th><th>名讳</th><th>生卒载</th><th>排行</th><th>配偶</th><th>居住地</th></tr></thead><tbody id="table-body" style="text-align:center;"></tbody></table></div>
        </div>
        <div id="view-map" class="container" style="display:none;"><div id="map-box" style="width:100%; height:80vh; border:1px solid #e2ddd2; background:#fff;"><svg id="svg" style="width:100%; height:100%;"></svg></div></div>
        <div id="view-export" class="container" style="display:none;"><div style="text-align:center; padding:150px 20px; background:#fff; border:1px solid #e2ddd2;"><h3>数字化档案归档</h3><div style="display:flex; gap:25px; justify-content:center; margin-top:60px;"><button style="background:var(--m-ink); color:#fff; border:none; padding:15px 35px; cursor:pointer;" onclick="exportToExcel()">CSV 名册</button><button style="background:var(--m-gold); color:#fff; border:none; padding:15px 35px; cursor:pointer;" onclick="exportToJSON()">JSON 备份</button></div></div></div>

        <div class="stats-bar"><div id="stats-content" style="display:contents;"></div></div>
        <footer style="text-align:center; padding:100px 20px; color:#aaa; font-size:12px; letter-spacing:8px;">莫氏宗亲联合会 · 数字化续修于丙午年</footer>
        
        <button class="float-btn" onclick="addNew()">+</button>

        <div id="panel">
          <h2 style="color:var(--m-red); letter-spacing:5px; margin-bottom:40px;">修缮族牒</h2>
          <div class="form-group"><label>名讳 (NAME)</label><input id="in-name"></div>
          <div style="display:flex; gap:20px;">
            <div class="form-group" style="flex:1;"><label>出生载 (BIRTH)</label><input id="in-birth"></div>
            <div class="form-group" style="flex:1;"><label>卒于 (DEATH)</label><input id="in-death"></div>
          </div>
          <div style="display:grid; grid-template-columns:1fr 1fr; gap:20px;">
            <div class="form-group"><label>排行 (ORDER)</label><input id="in-order"></div>
            <div class="form-group"><label>世系 (GEN)</label><input id="in-gen"></div>
          </div>
          <div class="form-group"><label>配偶名讳 (SPOUSE)</label><input id="in-spouse"></div>
          <div class="form-group"><label>现居地 (LOC)</label><input id="in-loc"></div>
          <div class="form-group"><label>生平纪略 (BIO)</label><textarea id="in-bio" rows="6"></textarea></div>
          <button style="width:100%; padding:20px; background:var(--m-red); color:#fff; border:none; font-weight:bold; letter-spacing:5px; cursor:pointer;" onclick="doSave()">📥 存入卷轴</button>
          <button style="width:100%; margin-top:15px; padding:15px; border:1px solid var(--m-gold); background:transparent; color:var(--m-gold); font-weight:bold; cursor:pointer;" onclick="addSon()">➕ 录入下代脉络</button>
          <div style="margin-top:40px; text-align:right;"><button style="color:#ccc; background:none; border:none; cursor:pointer;" onclick="doDel()">删除档案</button> | <button style="color:#ccc; background:none; border:none; cursor:pointer;" onclick="closePanel()">返回列表</button></div>
        </div>
      </div>

      <script>
        const VIEW_PW = "${VIEW_PASSWORD}";
        let data = ${rawData};

        function unlock() { 
          const pwInput = document.getElementById('pw').value.trim();
          if(pwInput === VIEW_PW) { 
            document.getElementById('lock-screen').style.opacity='0'; 
            setTimeout(()=> { 
              document.getElementById('lock-screen').style.display='none'; 
              document.getElementById('main-app').style.display='block'; 
              renderStats(); tab('list'); 
            }, 500); 
          } else alert('口令有误'); 
        }

        function tab(t) {
          ['list', 'tree', 'table', 'map', 'export'].forEach(v => {
            document.getElementById('view-' + v).style.display = (v === t ? 'block' : 'none');
            document.getElementById('btn-' + v).classList.toggle('active', v === t);
          });
          if(t === 'list') renderList();
          if(t === 'table') renderTable();
          if(t === 'tree') renderTree();
          if(t === 'map') setTimeout(renderMap, 100);
        }

        function renderList() {
          const list = document.getElementById('view-list'); list.innerHTML = '';
          const groups = {}; data.forEach(m => { const g = m.gen || '待定'; if(!groups[g]) groups[g] = []; groups[g].push(m); });
          Object.keys(groups).sort((a,b)=>parseInt(a.match(/\\d+/))-parseInt(b.match(/\\d+/))).forEach(g => {
            let h = \`<div class="gen-group"><div class="gen-badge">\${g}</div><div style="display:grid; grid-template-columns:repeat(auto-fill, minmax(350px, 1fr)); gap:30px;">\`;
            groups[g].forEach(m => {
              const span = (m.birth || m.death) ? \`\${m.birth || '?'} - \${m.death || '今'}\` : '';
              h += \`<div class="card" onclick="openPanel('\${m.id}')">
                <div class="name-area">莫 · \${m.name} <small>\${span}</small></div>
                <div style="font-size:14px; color:#887; display:flex; justify-content:space-between;">
                   <span>排行：<b>\${m.order || '-'}</b></span>
                   <span>配偶：<b style="color:var(--m-red);">\${m.spouse || '无'}</b></span>
                </div>
              </div>\`;
            });
            list.innerHTML += h + '</div></div>';
          });
        }

        function renderTable() {
          const b = document.getElementById('table-body'); b.innerHTML = '';
          [...data].sort((a,b)=>parseInt(a.gen?.match(/\\d+/))-parseInt(b.gen?.match(/\\d+/))).forEach(m => {
            b.innerHTML += \`<tr style="border-bottom:1px solid #f2ede0;">
              <td style="padding:22px; color:var(--m-gold); font-weight:bold;">\${m.gen}</td><td><b style="color:#000; font-size:18px;">\${m.name}</b></td>
              <td style="font-size:13px; color:#bbb; font-family:Georgia;">\${m.birth||'?'}-\${m.death||'今'}</td>
              <td>\${m.order || '-'}</td><td style="color:var(--m-red); font-weight:bold;">\${m.spouse || '无'}</td><td style="font-size:13px;">\${m.loc || '-'}</td>
            </tr>\`;
          });
        }

        function renderTree() {
          const box = document.getElementById('tree-box'); box.innerHTML = '';
          const roots = data.filter(m => !m.pid || !data.find(f => f.id === m.pid));
          function build(n) {
            const d = document.createElement('div'); d.style.marginLeft='50px'; d.style.borderLeft='2px solid #f0ede0'; d.style.paddingLeft='40px'; d.style.marginTop='25px';
            d.innerHTML = \`<div onclick="openPanel('\${n.id}')" style="cursor:pointer; padding:12px 0; border-bottom:1px solid #fcfaf2;">
                <strong style="font-size:22px; letter-spacing:1px;">\${n.name}</strong> 
                <span style="color:var(--m-gold); font-size:12px; margin-left:25px;">（配偶：\${n.spouse || '无'}）</span>
              </div>\`;
            data.filter(f => f.pid === n.id).forEach(c => d.appendChild(build(c)));
            return d;
          }
          roots.forEach(r => box.appendChild(build(r)));
        }

        function renderMap() {
          const svg = d3.select("#svg"); svg.selectAll("*").remove(); const g = svg.append("g");
          svg.call(d3.zoom().scaleExtent([0.1, 5]).on("zoom", (e) => g.attr("transform", e.transform)));
          const dict = {}; data.forEach(d => dict[d.id] = {...d, children:[]});
          const roots = []; data.forEach(d => { if(dict[d.pid]) dict[d.pid].children.push(dict[d.id]); else roots.push(dict[d.id]); });
          const root = d3.hierarchy({name:"莫氏", children: roots});
          d3.tree().nodeSize([280, 320])(root);
          
          g.selectAll("path").data(root.links().filter(d=>d.source.depth>0)).enter().append("path")
            .attr("fill","none").attr("stroke","#e0d9c5").attr("stroke-width", 2.5).attr("class","link-pulse")
            .attr("d", d3.linkVertical().x(d=>d.x).y(d=>d.y));

          const n = g.selectAll("g.node").data(root.descendants().filter(d=>d.depth>0)).enter().append("g").attr("transform", d => \`translate(\${d.x-100},\${d.y-70})\`).on("click",(e,d)=>openPanel(d.data.id));
          n.append("foreignObject").attr("width",200).attr("height",140).html(d => \`
            <div style="background:#fff; border:1px solid #e2ddd2; border-top:8px solid var(--m-red); padding:20px; text-align:center; box-shadow:0 15px 50px rgba(0,0,0,0.06); cursor:pointer;">
              <b style="font-size:22px; display:block; margin-bottom:12px; color:#000;">\${d.data.name}</b>
              <div style="color:var(--m-gold); font-weight:bold; border-top:1px solid #fcfaf2; padding-top:12px; font-size:14px;">配偶：\${d.data.spouse || '无'}</div>
            </div>\`);
        }

        function openPanel(id) {
          window.cur = id; const m = data.find(f => f.id === id);
          document.getElementById('panel').classList.add('active');
          ['name','gen','loc','bio','spouse','order','birth','death'].forEach(k => { document.getElementById('in-' + k).value = m[k] || ''; });
        }
        function closePanel() { document.getElementById('panel').classList.remove('active'); }

        async function apiPost(newData) {
          const auth = prompt("族牒管理员校验："); if(!auth) return;
          const res = await fetch('', { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({ auth: auth, data: newData }) });
          if(res.ok) location.reload(); else alert('权限不足');
        }

        function doSave() {
          const m = data.find(f => f.id === window.cur);
          if(!m) return;
          ['name','gen','loc','bio','spouse','order','birth','death'].forEach(k => { m[k] = document.getElementById('in-' + k).value; });
          apiPost(data);
        }
        function addNew() { const n = prompt("始祖名讳："); if(n){ data.push({id:"id"+Date.now(), name:n, gen:"第1代"}); apiPost(data); } }
        function addSon() {
          const n = prompt("后辈名讳："); if(n){
            const p = data.find(f => f.id === window.cur);
            data.push({id:"id"+Date.now(), name:n, gen:"第"+((parseInt(p.gen.match(/\\d+/))||0)+1)+"代", pid:p.id});
            apiPost(data);
          }
        }
        function doDel() { if(confirm("确定永久移除此成员档案？")){ data=data.filter(f=>f.id!==window.cur); apiPost(data); } }
        function renderStats() {
          const box = document.getElementById('stats-content');
          const genMap = {}; data.forEach(m => { const g = m.gen || '待定'; genMap[g] = (genMap[g] || 0) + 1; });
          let html = \`<div class="stat-item"><span class="stat-num">\${data.length}</span><span style="font-size:11px; color:var(--m-gold); letter-spacing:3px;">全族总人数</span></div>\`;
          Object.keys(genMap).sort((a,b)=>parseInt(a.match(/\\d+/))-parseInt(b.match(/\\d+/))).forEach(g => {
            html += \`<div class="stat-item"><span class="stat-num">\${genMap[g]}</span><span style="font-size:11px; color:var(--m-gold); letter-spacing:3px;">\${g}丁数</span></div>\`;
          });
          box.innerHTML = html;
        }
        function exportToExcel() {
          let csv = "\\ufeff世代,名讳,出生,卒年,配偶,排行\\n";
          data.forEach(m => { csv += \`"\${m.gen}","\${m.name}","\${m.birth||''}","\${m.death||''}","\${m.spouse||''}","\${m.order||''}"\\n\`; });
          downloadFile(csv, '莫氏族牒名录.csv', 'text/csv;charset=utf-8;');
        }
        function exportToJSON() { downloadFile(JSON.stringify(data, null, 2), '莫氏族牒备份.json', 'application/json'); }
        function downloadFile(content, fileName, mimeType) {
          const blob = new Blob([content], { type: mimeType });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a'); a.href = url; a.download = fileName; a.click();
        }
      </script>
    </body>
    </html>
    `;
    return new Response(html, { headers: { 'Content-Type': 'text/html;charset=UTF-8' } });
  }
};
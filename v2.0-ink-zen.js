export default {
  async fetch(request, env) {
    // ==========================================
    // 【系统配置中控台】 - 修改这里即可全局适配
    // ==========================================
    const SYS_CONF = {
      familyName: "莫",             // 姓氏
      versionName: "生卒纪年版",      // 支系或版本名
      orgName: "莫氏宗亲会",         // 页脚署名机构
      themeColor: "#9d2933",       // 主题色（故宫红）
      viewPw: "666",               // 查看密码
      editPw: "888",               // 编辑校验码
      dbKey: "MO_FAMILY_DATA"      // 数据库Key
    };

    if (request.method === 'POST') {
      try {
        const body = await request.json();
        if (body.auth !== SYS_CONF.editPw) return new Response('错误', { status: 403 });
        await env.MY_NOTES.put(SYS_CONF.dbKey, JSON.stringify(body.data));
        return new Response('OK');
      } catch (e) { return new Response('出错', { status: 500 }); }
    }

    let rawData = await env.MY_NOTES.get(SYS_CONF.dbKey) || "[]";

    const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
      <title>${SYS_CONF.familyName}氏族谱-${SYS_CONF.versionName}</title>
      <script src="https://d3js.org/d3.v7.min.js"></script>
      <style>
        :root { --m-red: ${SYS_CONF.themeColor}; --m-bg: #f5f2e9; --m-orange: #e67e22; }
        body { background: var(--m-bg); font-family: "Microsoft YaHei", sans-serif; margin: 0; padding-bottom: 20px; }
        .header { text-align: center; padding: 20px 20px 10px 20px; background: var(--m-bg); border-bottom: 3px solid var(--m-red); position: sticky; top:0; z-index:100; }
        .nav { display: flex; flex-wrap: wrap; justify-content: center; background: #e0e0e0; padding: 5px; border-radius: 10px; margin: 10px 0; gap: 4px; }
        .nav button { border: none; padding: 10px 12px; border-radius: 8px; cursor: pointer; background: transparent; font-weight: bold; color: #666; font-size: 13px; flex: 1; min-width: 80px; }
        .nav button.active { background: #fff; color: var(--m-red); box-shadow: 0 2px 5px rgba(0,0,0,0.1); }
        .search-bar { width: 100%; max-width: 500px; margin: 0 auto 10px auto; }
        .search-bar input { width: 100%; padding: 10px 15px; border: 1px solid #ddd; border-radius: 20px; outline: none; box-sizing: border-box; }
        .search-bar input:focus { border-color: var(--m-red); }
        .container { max-width: 1200px; margin: 0 auto; padding: 15px; min-height: 60vh; }
        .row { display: flex; margin-bottom: 8px; font-size: 15px; align-items: flex-start; }
        .lbl { color: #999; width: 95px !important; min-width: 95px !important; flex-shrink: 0; font-weight: bold; } 
        .val { color: #333; font-weight: 500; }
        .card { background: #fff; border-radius: 12px; padding: 20px; border: 1px solid #eee; cursor: pointer; margin-bottom: 15px; box-shadow: 0 2px 8px rgba(0,0,0,0.03); }
        .name-area { font-size: 22px; font-weight: bold; border-bottom: 2px solid #f8f8f8; padding-bottom: 8px; margin-bottom: 12px; color: #000; display: flex; justify-content: space-between; align-items: baseline; }
        .life-span { font-size: 13px; color: #888; font-weight: normal; }
        .stats-bar { background: #fff; margin: 20px 15px; padding: 20px; border-radius: 12px; border: 1px solid #e0dcd0; }
        .stats-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(80px, 1fr)); gap: 10px; text-align: center; margin-top: 15px; }
        .stat-item { padding: 10px; background: var(--m-bg); border-radius: 8px; }
        .stat-num { display: block; font-size: 18px; font-weight: bold; color: var(--m-red); }
        .footer { text-align: center; padding: 40px 20px; color: #999; font-size: 13px; border-top: 1px solid #e0dcd0; }
        #panel { position: fixed; right: -100%; top: 0; width: 100%; max-width: 400px; height: 100%; background: #fff; z-index: 1000; padding: 25px; box-sizing: border-box; transition: 0.3s; overflow-y: auto; box-shadow: -5px 0 15px rgba(0,0,0,0.1); }
        #panel.active { right: 0; }
        input, textarea { width: 100%; padding: 12px; border: 1px solid #ddd; border-radius: 8px; margin-top: 5px; box-sizing: border-box; }
        .btn-save { width: 100%; padding: 15px; background: var(--m-red); color: #fff; border: none; border-radius: 10px; font-weight: bold; cursor: pointer; }
        @media print { .header, .nav, button, .stats-bar, .footer, #panel, .search-bar { display: none !important; } body { background: white; } }
      </style>
    </head>
    <body>
      <div id="lock-screen" style="position:fixed; inset:0; background:var(--m-bg); z-index:9999; display:flex; align-items:center; justify-content:center;">
        <div style="background:#fff; padding:35px; border-radius:15px; text-align:center; width:280px;">
          <h2 style="color:var(--m-red);">${SYS_CONF.familyName}氏族谱</h2>
          <input type="password" id="pw" placeholder="查看密码">
          <button onclick="unlock()" class="btn-save" style="margin-top:20px;">开启档案</button>
        </div>
      </div>

      <div id="main-app" style="display:none;">
        <header class="header">
          <h1 style="color:var(--m-red); margin:0 0 10px 0;">${SYS_CONF.familyName}氏族谱</h1>
          <div class="search-bar">
            <input type="text" id="search-input" placeholder="🔍 搜索姓名..." oninput="doSearch()">
          </div>
          <div class="nav">
            <button id="btn-list" onclick="tab('list')">卡片视图</button>
            <button id="btn-tree" onclick="tab('tree')">树状视图</button>
            <button id="btn-table" onclick="tab('table')">成员列表</button>
            <button id="btn-map" onclick="tab('map')">关系图表</button>
            <button id="btn-export" onclick="tab('export')" style="color:var(--m-orange)">数据管理</button>
          </div>
        </header>

        <div id="view-list" class="container"></div>
        <div id="view-tree" class="container" style="display:none;"><div id="tree-box" style="background:#fff; padding:25px; border-radius:12px; overflow-x:auto;"></div></div>
        <div id="view-table" class="container" style="display:none;">
           <div style="background:#fff; border-radius:12px; overflow-x:auto;"><table style="width:100%; border-collapse:collapse; min-width:800px;"><thead><tr style="background:#f8f8f8;"><th style="padding:12px;">代别</th><th>姓名</th><th>生卒年</th><th>排行</th><th>配偶</th><th>居住地</th></tr></thead><tbody id="table-body" style="text-align:center;"></tbody></table></div>
        </div>
        <div id="view-map" class="container" style="display:none;"><div id="map-box" style="width:100%; height:75vh; background:#fff; border-radius:12px;"><svg id="svg" style="width:100%; height:100%;"></svg></div></div>
        <div id="view-export" class="container" style="display:none;"><div class="export-box" style="text-align:center; padding:50px; background:#fff; border-radius:15px;"><h3>📂 数据备份</h3><button class="btn-save" onclick="exportToExcel()" style="width:auto; padding:10px 20px; margin:5px;">导出 Excel (.csv)</button><button class="btn-save" onclick="exportToJSON()" style="width:auto; padding:10px 20px; margin:5px; background:#666;">导出备份 (.json)</button></div></div>

        <div class="stats-bar"><div style="font-weight:bold; color:var(--m-red); border-left:4px solid var(--m-red); padding-left:10px;">家族统计</div><div id="stats-content" class="stats-grid"></div></div>
        <footer class="footer"><div>万代昌盛 · ${SYS_CONF.orgName}</div></footer>
        <button style="position:fixed; bottom:30px; right:30px; width:60px; height:60px; background:var(--m-red); color:#fff; border-radius:50%; border:none; font-size:32px; box-shadow:0 4px 15px rgba(0,0,0,0.2); cursor:pointer;" onclick="addNew()">+</button>

        <div id="panel">
          <h3 style="border-left:4px solid var(--m-red); padding-left:10px;">编辑成员</h3>
          <div style="margin-bottom:12px;"><label>姓名</label><input id="in-name"></div>
          <div style="display:flex; gap:10px; margin-bottom:12px;">
            <div style="flex:1;"><label>出生年份</label><input id="in-birth" placeholder="如1900"></div>
            <div style="flex:1;"><label>卒年/享年</label><input id="in-death" placeholder="如1980或至今"></div>
          </div>
          <div style="margin-bottom:12px;"><label>排行</label><input id="in-order"></div>
          <div style="margin-bottom:12px;"><label>代别</label><input id="in-gen"></div>
          <div style="margin-bottom:12px;"><label>配偶</label><input id="in-spouse"></div>
          <div style="margin-bottom:12px;"><label>居住地</label><input id="in-loc"></div>
          <div style="margin-bottom:12px;"><label>个人简介</label><textarea id="in-bio" rows="3"></textarea></div>
          <button class="btn-save" onclick="doSave()">💾 保存更新</button>
          <button style="width:100%; margin-top:10px; padding:12px; border:1px solid #ddd; background:#f9f9f9; border-radius:8px; cursor:pointer;" onclick="addSon()">➕ 录入后代</button>
          <div style="margin-top:20px; text-align:center;">
            <button style="color:red; background:none; border:none; cursor:pointer;" onclick="doDel()">❌ 删除档案</button>
            <span style="color:#eee; margin:0 10px;">|</span>
            <button style="color:#999; background:none; border:none; cursor:pointer;" onclick="closePanel()">取消返回</button>
          </div>
        </div>
      </div>

      <script>
        const CONF = { familyName: "${SYS_CONF.familyName}", viewPw: "${SYS_CONF.viewPw}" };
        let data = ${rawData};

        function unlock() { if(document.getElementById('pw').value === CONF.viewPw) { document.getElementById('lock-screen').style.display = 'none'; document.getElementById('main-app').style.display = 'block'; renderStats(); tab('list'); } else alert('密码错误'); }

        function doSearch() {
          const kw = document.getElementById('search-input').value.trim().toLowerCase();
          const filtered = data.filter(m => m.name.toLowerCase().includes(kw));
          renderList(filtered);
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

        function renderList(targetData = data) {
          const list = document.getElementById('view-list'); list.innerHTML = '';
          const groups = {}; targetData.forEach(m => { const g = m.gen || '待补充'; if(!groups[g]) groups[g] = []; groups[g].push(m); });
          Object.keys(groups).sort((a,b)=>parseInt(a.match(/\\d+/))-parseInt(b.match(/\\d+/))).forEach(g => {
            let h = '<div style="background:var(--m-red); color:#fff; display:inline-block; padding:3px 15px; border-radius:20px; margin:15px 0; font-size:13px;">'+g+'</div><div style="display:grid; grid-template-columns:repeat(auto-fill, minmax(300px, 1fr)); gap:15px;">';
            groups[g].forEach(m => {
              const span = (m.birth || m.death) ? \`\${m.birth || '?'} - \${m.death || '今'}\` : '';
              h += \`<div class="card" onclick="openPanel('\${m.id}')">
                <div class="name-area">\${CONF.familyName} · \${m.name} <span class="life-span">\${span}</span></div>
                <div class="row"><div class="lbl">排行顺序</div><div class="val">\${m.order || '-'}</div></div>
                <div class="row"><div class="lbl">配偶情况</div><div style="color:var(--m-orange); font-weight:bold;">\${m.spouse || '无'}</div></div>
                <div class="row"><div class="lbl">居住地址</div><div class="val">\${m.loc || '-'}</div></div>
              </div>\`;
            });
            list.innerHTML += h + '</div>';
          });
        }

        function renderTable() {
          const b = document.getElementById('table-body'); b.innerHTML = '';
          [...data].sort((a,b)=>parseInt(a.gen?.match(/\\d+/))-parseInt(b.gen?.match(/\\d+/))).forEach(m => {
            b.innerHTML += \`<tr style="border-bottom:1px solid #eee;">
              <td style="padding:12px;">\${m.gen}</td><td><b>\${m.name}</b></td>
              <td style="font-size:12px; color:#666;">\${m.birth||'?'}-\${m.death||'今'}</td>
              <td>\${m.order || '-'}</td><td style="color:var(--m-orange);">\${m.spouse || '无'}</td><td>\${m.loc || '-'}</td>
            </tr>\`;
          });
        }

        function renderTree() {
          const box = document.getElementById('tree-box'); box.innerHTML = '';
          const roots = data.filter(m => !m.pid || !data.find(f => f.id === m.pid));
          function build(n) {
            const d = document.createElement('div'); d.style.marginLeft='30px'; d.style.borderLeft='1px dashed #ccc'; d.style.paddingLeft='15px';
            d.innerHTML = \`<div onclick="openPanel('\${n.id}')" style="cursor:pointer; padding:8px 0;">
                <strong style="font-size:16px;">\${n.name}</strong> <small style="color:#999; margin-left:5px;">(\${n.birth||''}-\${n.death||''})</small> 
                <span style="color:var(--m-orange); margin-left:15px; font-size:13px;">[配偶：\${n.spouse || '无'}]</span>
              </div>\`;
            data.filter(f => f.pid === n.id).forEach(c => d.appendChild(build(c)));
            return d;
          }
          roots.forEach(r => box.appendChild(build(r)));
        }

        function renderMap() {
          const svg = d3.select("#svg"); svg.selectAll("*").remove(); const g = svg.append("g");
          svg.call(d3.zoom().on("zoom", (e) => g.attr("transform", e.transform)));
          const dict = {}; data.forEach(d => dict[d.id] = {...d, children:[]});
          const roots = []; data.forEach(d => { if(dict[d.pid]) dict[d.pid].children.push(dict[d.id]); else roots.push(dict[d.id]); });
          const root = d3.hierarchy({name: CONF.familyName + "氏家族", children: roots});
          d3.tree().nodeSize([220, 240])(root);
          g.selectAll("path").data(root.links().filter(d=>d.source.depth>0)).enter().append("path")
            .attr("fill","none").attr("stroke","#ccc").attr("d", d3.linkVertical().x(d=>d.x).y(d=>d.y));
          const n = g.selectAll("g.node").data(root.descendants().filter(d=>d.depth>0)).enter().append("g")
            .attr("transform", d => \`translate(\${d.x-90},\${d.y-55})\`).on("click",(e,d)=>openPanel(d.data.id));
          n.append("foreignObject").attr("width",180).attr("height",110).html(d => \`
            <div style="background:#fff; border:1px solid #ddd; border-top:4px solid var(--m-red); padding:10px; font-size:12px; border-radius:8px; text-align:center; box-shadow:0 2px 6px rgba(0,0,0,0.05); cursor:pointer;">
              <b style="font-size:15px; display:block; margin-bottom:3px;">\${d.data.name}</b>
              <div style="color:#999; font-size:10px; margin-bottom:5px;">\${d.data.birth||''}-\${d.data.death||''}</div>
              <div style="color:var(--m-orange); font-weight:bold; border-top:1px solid #f0f0f0; padding-top:4px;">配偶：\${d.data.spouse || '无'}</div>
            </div>\`);
        }

        function openPanel(id) {
          window.cur = id; const m = data.find(f => f.id === id); if(!m) return;
          document.getElementById('panel').classList.add('active');
          ['name','gen','loc','bio','spouse','order','birth','death'].forEach(k => { document.getElementById('in-' + k).value = m[k] || ''; });
        }
        function closePanel() { document.getElementById('panel').classList.remove('active'); }

        async function apiPost(newData) {
          const auth = prompt("请输入管理校验码："); if(!auth) return;
          const res = await fetch('', { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({ auth: auth, data: newData }) });
          if(res.ok) location.reload(); else alert('保存失败');
        }

        function doSave() {
          const m = data.find(f => f.id === window.cur); if(!m) return;
          ['name','gen','loc','bio','spouse','order','birth','death'].forEach(k => { m[k] = document.getElementById('in-' + k).value; });
          apiPost(data);
        }
        function addNew() { const n = prompt("请输入始祖姓名："); if(n){ data.push({id:"id"+Date.now(), name:n, gen:"第1代"}); apiPost(data); } }
        function addSon() {
          const n = prompt("请输入后代姓名："); if(n){
            const p = data.find(f => f.id === window.cur);
            data.push({id:"id"+Date.now(), name:n, gen:"第"+((parseInt(p.gen.match(/\\d+/))||0)+1)+"代", pid:p.id});
            apiPost(data);
          }
        }
        function doDel() { if(confirm("确定要移除档案吗？")){ data=data.filter(f=>f.id!==window.cur); apiPost(data); } }
        function renderStats() {
          const box = document.getElementById('stats-content');
          const genMap = {}; data.forEach(m => { const g = m.gen || '待定'; genMap[g] = (genMap[g] || 0) + 1; });
          let html = \`<div class="stat-item"><span class="stat-num">\${data.length}</span><span style="font-size:11px; color:#999;">总人数</span></div>\`;
          Object.keys(genMap).sort((a,b)=>parseInt(a.match(/\\d+/))-parseInt(b.match(/\\d+/))).forEach(g => {
            html += \`<div class="stat-item"><span class="stat-num">\${genMap[g]}</span><span style="font-size:11px; color:#999;">\${g}</span></div>\`;
          });
          box.innerHTML = html;
        }
        function exportToExcel() {
          let csv = "\\ufeff代别,姓名,出生年份,卒年,配偶,排行\\n";
          data.forEach(m => { csv += \`"\${m.gen}","\${m.name}","\${m.birth||''}","\${m.death||''}","\${m.spouse||''}","\${m.order||''}"\\n\`; });
          downloadFile(csv, CONF.familyName + '氏族谱档案.csv', 'text/csv;charset=utf-8;');
        }
        function exportToJSON() { downloadFile(JSON.stringify(data, null, 2), CONF.familyName + '氏族谱数据备份.json', 'application/json'); }
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

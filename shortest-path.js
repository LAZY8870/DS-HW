const svgNS = "http://www.w3.org/2000/svg";
const positions = { A:[210,100], B:[390,100], C:[300,230], S:[75,310], E:[685,310], G:[685,310], D:[570,230] };
const graphNodes = ["S","A","B","C","D","G"];
const graphEdges = [
  ["S","A",2],["A","B",3],["B","G",1],["S","C",5],
  ["A","C",1],["B","C",2],["C","G",9],["C","D",1],["D","G",6]
];
let start = "S", end = "G", steps = [], cursor = 0;

function svg(name, attrs={}) {
  const el = document.createElementNS(svgNS, name);
  Object.entries(attrs).forEach(([key,value]) => el.setAttribute(key,value));
  return el;
}

function edgeKey(a,b){ return [a,b].sort().join("-"); }

function buildSteps(source,target) {
  const inf = Infinity;
  const dist = Object.fromEntries(graphNodes.map(n => [n, inf]));
  const parent = {};
  dist[source] = 0;
  const unvisited = new Set(graphNodes);
  const result = [{dist:{...dist}, current:null, visited:[], note:`將起點 ${source} 的距離設為 0，其他頂點設為∞。`}];
  while (unvisited.size) {
    const current = [...unvisited].sort((a,b) => dist[a]-dist[b])[0];
    if (dist[current] === inf) break;
    unvisited.delete(current);
    const neighbors = graphEdges.filter(e => e.includes(current)).map(e => [e[0] === current ? e[1] : e[0], e[2]]);
    neighbors.forEach(([next,weight]) => {
      if (dist[next] > dist[current] + weight) {
        dist[next] = dist[current] + weight;
        parent[next] = current;
        result.push({dist:{...dist}, current, visited:[...graphNodes.filter(n => !unvisited.has(n))], next, weight, note:`鬆弛 ${current}→${next}：${dist[current]} + ${weight} = ${dist[next]}，更新 ${next}。`});
      }
    });
    result.push({dist:{...dist}, current, visited:[...graphNodes.filter(n => !unvisited.has(n))], note:`確定頂點 ${current} 的最短距離為 ${dist[current]}。`});
    if (current === target) break;
  }
  let path = [];
  for (let n=target; n; n=parent[n]) { path.unshift(n); if (n === source) break; }
  result[result.length] = {...result[result.length-1], path, note:`完成：${source} 到 ${target} 的最短路徑為 ${path.join(" → ")}，總長為 ${dist[target] === inf ? "∞" : dist[target]}。`};
  return result;
}

function renderMain() {
  const stage = document.getElementById("graph");
  stage.replaceChildren();
  graphEdges.forEach(([a,b,w]) => {
    const pa=positions[a], pb=positions[b], key=edgeKey(a,b);
    const selected = cursor > 0 && steps[cursor].path ? steps[cursor].path.some((n,i,p) => i && edgeKey(p[i-1],n) === key) : false;
    stage.append(svg("line",{x1:pa[0],y1:pa[1],x2:pb[0],y2:pb[1],class:`edge${selected?" selected":""}`}));
    stage.append(Object.assign(svg("text",{x:(pa[0]+pb[0])/2,y:(pa[1]+pb[1])/2-12,class:"weight"}),{textContent:w}));
  });
  graphNodes.forEach(n => {
    const [x,y]=positions[n], current=steps[cursor]?.current===n, visited=steps[cursor]?.visited?.includes(n);
    stage.append(svg("circle",{cx:x,cy:y,r:30,class:`node${current?" current":visited?" current":""}`}));
    stage.append(Object.assign(svg("text",{x,y,class:"node-label"}),{textContent:n}));
  });
}

function update() {
  const frame = steps[cursor];
  renderMain();
  document.getElementById("stateMeta").textContent = cursor ? `${cursor}/${steps.length-1}` : "準備";
  document.getElementById("currentNode").textContent = frame.current || "—";
  document.getElementById("visitedCount").textContent = `${frame.visited?.length || 0} / 6`;
  document.getElementById("distanceList").textContent = Object.entries(frame.dist).map(([n,d])=>`${n}:${d===Infinity?"∞":d}`).join("  ");
  document.getElementById("pathList").textContent = frame.path ? frame.path.join(" → ") : (frame.next ? `${frame.current} → ${frame.next}` : "尚未產生完整路徑");
  document.getElementById("stepNote").textContent = frame.note;
}

function reset(){ steps=buildSteps(start,end); cursor=0; update(); }
document.getElementById("startNode").addEventListener("change",e=>{start=e.target.value;reset();});
document.getElementById("endNode").addEventListener("change",e=>{end=e.target.value;reset();});
document.getElementById("resetButton").addEventListener("click",reset);
document.getElementById("stepButton").addEventListener("click",()=>{cursor=Math.min(cursor+1,steps.length-1);update();});

function drawMini(id, kind, title, edges, nodes, note, good) {
  const svgEl=svg("svg",{viewBox:"0 0 360 220"});
  edges.forEach(([a,b,w,state])=>{
    const pa=nodes[a],pb=nodes[b];svgEl.append(svg("line",{x1:pa[0],y1:pa[1],x2:pb[0],y2:pb[1],class:`edge ${state||""}`}));
    svgEl.append(Object.assign(svg("text",{x:(pa[0]+pb[0])/2,y:(pa[1]+pb[1])/2-8,class:"weight"}),{textContent:w}));
  });
  Object.entries(nodes).forEach(([n,[x,y]])=>{svgEl.append(svg("circle",{cx:x,cy:y,r:25,class:`node ${n==="B"&&good?" current":""}`}),Object.assign(svg("text",{x,y,class:"node-label"}),{textContent:n}))});
  const card=document.createElement("article");card.className=`card ${kind}`;
  const text=document.createElement("div");text.className="card-note";text.innerHTML=`<strong class="${good?"good-text":"bad-text"}">${good?"✔":"✘"} ${title}</strong> · ${note}`;
  card.append(svgEl,text);id.append(card);
}

const mini=document.getElementById("conceptExamples");
drawMini(mini,"bad","錯誤：只看一條路", [["S","G",9,"problem"]],{S:[70,130],G:[290,130]}, "沒有比較經過 S→A→B→G 的路徑。");
drawMini(mini,"bad","距離未更新", [["S","A",2,""],["A","B",1,""]],{S:[70,130],A:[180,130],B:[290,130]}, "把 A 看成已完成後，仍保留較大的舊距離。");
drawMini(mini,"good","正確：最短路徑", [["S","A",2,"selected"],["A","B",1,"selected"],["B","G",1,"selected"]],{S:[55,130],A:[150,130],B:[245,130],G:[320,130]}, "最短路徑為 S→A→B→G，總長 4。",true);

const relax=document.getElementById("relaxExamples");
drawMini(relax,"bad","鬆弛失敗", [["A","B",5,"problem"]],{A:[70,130],B:[290,130]}, "2 + 5 = 7，比目前 B 的距離 5 長，不更新。");
drawMini(relax,"good","鬆弛成功", [["A","C",1,"selected"],["C","B",1,"selected"]],{A:[55,130],C:[170,130],B:[290,130]}, "0 + 1 + 1 = 2，比目前距離 5 短。",true);
drawMini(relax,"bad","無法更新", [["E","D",5,"problem"]],{E:[70,130],D:[290,130]}, "鬆弛後 5 + 1 = 6 比 6 小嗎？不是，因此不更新。");

reset();

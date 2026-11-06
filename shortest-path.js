const NS = "http://www.w3.org/2000/svg";
const nodes = { A:[150,255], B:[300,110], C:[300,255], D:[470,110], E:[470,255], F:[620,255], S:[70,255], G:[620,255] };
const uniqueNodes = ["A","B","C","D","E","F","S","G"];
const edges = [["A","B",3],["A","C",2],["B","D",5],["C","D",1],["C","E",10],["D","E",1],["D","F",3],["E","F",2]];
const graphNodes = ["A","B","C","D","E","F"];
let start="A", end="F", cursor=0, frames=[], timer=null, game=false;

function el(name, attrs={}, text=""){const e=document.createElementNS(NS,name);Object.entries(attrs).forEach(([k,v])=>e.setAttribute(k,v));if(text)e.textContent=text;return e}
function key(a,b){return [a,b].sort().join("-")}
function buildFrames(source,target){
  const dist=Object.fromEntries(graphNodes.map(n=>[n,n===source?0:Infinity]));
  const parent={}; const unvisited=new Set(graphNodes); const visited=[]; const result=[];
  result.push({dist:{...dist},visited:[],current:null,parent:{},relax:0,updates:0,label:"START",note:`初始化：dist[${source}] = 0；其餘頂點設為∞。每次選擇目前距離最小且尚未完成的頂點。`});
  while(unvisited.size){
    const current=[...unvisited].filter(n=>dist[n]!==Infinity).sort((a,b)=>dist[a]-dist[b])[0];
    if(!current)break;
    unvisited.delete(current); visited.push(current);
    edges.filter(([a,b])=>a===current||b===current).forEach(([a,b,w])=>{
      const next=a===current?b:a; if(!unvisited.has(next)||dist[next]===Infinity)return;
      const candidate=dist[current]+w; const improved=candidate<dist[next];
      if(improved){dist[next]=candidate;parent[next]=current}
      result.push({dist:{...dist},visited:[...visited],current,parent:{...parent},relax:(result.at(-1)?.relax||0)+1,updates:(result.at(-1)?.updates||0)+(improved?1:0),label:"RELAX",next,currentEdge:[current,next],improved,note:`${current} → ${next}：${dist[current]} + ${w} = ${candidate}；${improved?`小於原距離，更新為 ${candidate}`:"不小於目前距離，不更新"}。`});
    });
    result.push({dist:{...dist},visited:[...visited],current,parent:{...parent},relax:result.at(-1)?.relax||0,updates:result.at(-1)?.updates||0,label:"DONE",note:`完成頂點 ${current}：目前 dist[${current}] = ${dist[current]}。`});
    if(current===target)break;
  }
  let path=[],p=target;while(p){path.unshift(p);if(p===source)break;p=parent[p];if(!p){path=[];break}}
  result.push({dist:{...dist},visited:[...visited],current:target,parent:{...parent},relax:result.at(-1)?.relax||0,updates:result.at(-1)?.updates||0,label:"RESULT",path,note:`${source} 到 ${target} 的最短路徑為 ${path.join(" → ")}，總長為 ${dist[target]===Infinity?"∞":dist[target]}。`});
  return result;
}
function paint(){
  const f=frames[cursor]||frames[0], svg=document.getElementById("graph"); svg.replaceChildren();
  edges.forEach(([a,b,w])=>{
    let pa={A:[150,255],B:[300,110],C:[300,255],D:[470,110],E:[470,255],F:[620,255]}[a],pb={A:[150,255],B:[300,110],C:[300,255],D:[470,110],E:[470,255],F:[620,255]}[b];
    const on=f.path&&f.path.some((n,i)=>i&&key(f.path[i-1],n)==key(a,b));
    const candidate=f.currentEdge&&key(f.currentEdge[0],f.currentEdge[1])==key(a,b);
    svg.append(el("line",{x1:pa[0],y1:pa[1],x2:pb[0],y2:pb[1],class:`edge ${on?"selected":candidate?(f.improved?"selected":"problem"):""}`}));
    svg.append(el("text",{x:(pa[0]+pb[0])/2,y:(pa[1]+pb[1])/2-10,class:"weight"},String(w)));
  });
  ["A","B","C","D","E","F"].forEach(n=>{
    const [x,y]={A:[150,255],B:[300,110],C:[300,255],D:[470,110],E:[470,255],F:[620,255]}[n];
    const cls=n===f.current?"node current":f.visited.includes(n)?"node done":"node";
    svg.append(el("circle",{cx:x,cy:y,r:26,class:cls}),el("text",{x,y,class:"node-label"},n));
    if(n===start)svg.append(el("text",{x,y:y+42,class:"node-kind"},n===end?"起點/終點":"起點"));
    if(n===end&&n!==start)svg.append(el("text",{x,y:y+42,class:"node-kind"},"終點"));
  });
  document.getElementById("stepCount").textContent=`${cursor} / ${frames.length-1}`;
  document.getElementById("messageStrip").innerHTML=`<strong>${f.label}</strong><br>${f.note}`;
  document.getElementById("relaxCount").textContent=f.relax||0;
  document.getElementById("updateCount").textContent=f.updates||0;
  document.getElementById("shortestLength").textContent=f.dist[end]===Infinity?"—":f.dist[end];
  document.getElementById("doneCount").textContent=f.visited.length;
  document.getElementById("distTable").innerHTML=graphNodes.map(n=>{
    const d=f.dist[n], cls=n===f.current?"current":"";
    const status=f.visited.includes(n)?"已完成":n===f.current?"處理中":"未探索";
    return `<tr class="${cls}"><td>${n}</td><td>${d===Infinity?"∞":d}</td><td>${f.parent[n]||"—"}</td><td>${status}</td></tr>`;
  }).join("");
  document.getElementById("arrowLabel").textContent=end;
  document.querySelector(".route-picker .target").textContent=start;
}
function reset(){clearInterval(timer);timer=null;document.getElementById("autoButton").textContent="▶ 自動播放";frames=buildFrames(start,end);cursor=0;paint()}
function step(delta){cursor=Math.max(0,Math.min(frames.length-1,cursor+delta));paint()}
document.getElementById("prevButton").onclick=()=>step(-1);
document.getElementById("nextButton").onclick=()=>step(1);
document.getElementById("resetButton").onclick=reset;
document.getElementById("sideNextButton").onclick=()=>step(1);
document.getElementById("startNode").onchange=e=>{start=e.target.value;reset()};
document.getElementById("endNode").onchange=e=>{end=e.target.value;reset()};
document.getElementById("autoButton").onclick=e=>{if(timer){clearInterval(timer);timer=null;e.target.textContent="▶ 自動播放"}else{e.target.textContent="Ⅱ 暫停播放";timer=setInterval(()=>{if(cursor>=frames.length-1){clearInterval(timer);timer=null;e.target.textContent="▶ 自動播放"}else step(1)},650)}};
document.querySelectorAll("[data-mode]").forEach(b=>b.onclick=()=>{document.querySelectorAll("[data-mode]").forEach(x=>x.classList.remove("active"));b.classList.add("active")});
document.getElementById("demoTab").onclick=()=>{game=false;document.getElementById("demoTab").classList.add("active");document.getElementById("gameTab").classList.remove("active")};
document.getElementById("gameTab").onclick=()=>{game=true;document.getElementById("gameTab").classList.add("active");document.getElementById("demoTab").classList.remove("active")};

function miniCard(container,title,kind,nodesPos,lines,note,good=false){
  const svg=el("svg",{viewBox:"0 0 340 220"});
  lines.forEach(([a,b,w,state])=>{const p=nodesPos[a],q=nodesPos[b];svg.append(el("line",{x1:p[0],y1:p[1],x2:q[0],y2:q[1],class:`edge ${state||""}`}),el("text",{x:(p[0]+q[0])/2,y:(p[1]+q[1])/2-7,class:"weight"},w))});
  Object.entries(nodesPos).forEach(([n,[x,y]])=>svg.append(el("circle",{cx:x,cy:y,r:23,class:"node"}),el("text",{x,y,class:"node-label"},n)));
  const card=document.createElement("article");card.className=`example ${kind}`;card.append(svg);const text=document.createElement("div");text.className="example-note";text.innerHTML=`<strong class="${good?"good-text":"bad-text"}">${good?"✔":"✘"} ${title}</strong> · ${note}`;card.append(text);container.append(card);
}
const examples=document.getElementById("exampleGrid");
const p={S:[55,130],A:[145,130],B:[235,130],G:[305,130]};
miniCard(examples,"走 1 條邊","bad",p,[["S","G",9,"problem"]],"只看 S→G，沒有比較經過 A、B 的路徑。");
miniCard(examples,"鬆弛後仍未更新","bad",p,[["S","A",2,"selected"],["A","B",1,""],["B","G",1,"selected"]],"選擇較大的舊 dist，忽略已有的 2＋1＋1＝4。");
miniCard(examples,"正確最短路徑","good",p,[["S","A",2,"selected"],["A","B",1,"selected"],["B","G",1,"selected"]],"經過 S→A→B→G，總長 4，是圖中的最短路徑。",true);
reset();

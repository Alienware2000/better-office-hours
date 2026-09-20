// Authored, ungraded evaluation cases. These are never live tutor scene presets.
import type { BoardDocument, DocumentBlock } from '../../lib/whiteboard/document';
import type { AnimationSpec } from '../../lib/types';
import type { DiagramAnimShape } from '../../lib/whiteboard/animation';
type Figure = Extract<DocumentBlock, {kind:'figure'}>;
type Command = Figure['commands'][number];
type Example = {subject:string; subtitle:string; description:string; document:BoardDocument};
const path = (id:string, points:{x:number;y:number}[], extra:Partial<Command> = {}):Command => ({op:'curve',id,points,diagram:{interpolation:'linear'},...extra} as Command);
const square = [{x:.16,y:.78},{x:.48,y:.78},{x:.48,y:.46},{x:.16,y:.46},{x:.16,y:.78}];
const shear = square.map(p=>({x:p.x+(.78-p.y),y:p.y}));
export const projectilePoint = (u:number) => ({x:.12+.68*u,y:.66-1.8*u*(1-u)});
const projectilePath=Array.from({length:81},(_,i)=>projectilePoint(i/80));

export const stemPhysicalDocuments:Example[]=[
  {subject:'Mathematics',subtitle:'A matrix is a transformation',description:'Compare the original square with its sheared image. The first basis vector stays fixed; the second moves right. The columns record those two destinations.',document:{id:'stem-math',sections:[
    {id:'shear',eyebrow:'01 / LINEAR ALGEBRA',title:'A matrix moves space',blocks:[{kind:'figure',id:'shear-figure',commands:[
      {op:'arrow',id:'x',from:{x:.08,y:.78},to:{x:.94,y:.78},color:'muted',label:'x'},
      {op:'arrow',id:'y',from:{x:.16,y:.90},to:{x:.16,y:.12},color:'muted',label:'y'},
      path('image',shear,{colorRole:'relation',concept:'transform',diagram:{interpolation:'linear',fill:'tint',weight:'light'}}),
      ...square.slice(0,-1).map((from,i):Command=>({op:'line',id:`original-${i}`,from,to:square[i+1],color:'muted',dashed:true,diagram:{weight:'light'}})),
      {op:'arrow',id:'basis-one',from:{x:.16,y:.78},to:{x:.48,y:.78},label:'A\\mathbf{e}_1',concept:'transform'},
      {op:'arrow',id:'basis-two',from:{x:.16,y:.78},to:{x:.48,y:.46},label:'A\\mathbf{e}_2',colorRole:'accent',concept:'transform'},
    ],equation:[{latex:'A=\\begin{pmatrix}1&1\\\\0&1\\end{pmatrix}',concept:'transform'}],caption:'Columns tell us where the basis vectors land.'}]}]}},
  {subject:'Physics',subtitle:'Change one idea at a time',description:'Explore projectile motion, a uniform electric field and magnetic force. Each view states its assumptions. The projectile has a separate time control, so replaying the drawing is distinct from changing the physical state.',document:{id:'stem-physics',sections:[
    {id:'projectile',eyebrow:'02 / MOTION · NO AIR RESISTANCE',title:'One flight, two components',blocks:[{kind:'figure',id:'flight-figure',commands:[
      {op:'line',id:'ground',from:{x:.05,y:.684074074074},to:{x:.98,y:.684074074074},color:'muted',diagram:{surface:'right',weight:'light'}},
      path('flight',projectilePath,{color:'muted',diagram:{weight:'light'}}),
      {op:'arrow',id:'gravity',from:{x:.91,y:.24},to:{x:.91,y:.48},colorRole:'accent',label:'g'},
    ],equation:[{latex:'v_x=v_{0x}'},{latex:'\\quad v_y=v_{0y}-gt',colorRole:'accent'}],caption:'At the top, vertical velocity is zero. Gravity is not.'}]},
    {id:'electric',eyebrow:'03 / ELECTRICITY · AWAY FROM EDGES',title:'A field has a direction',blocks:[{kind:'figure',id:'field-figure',commands:[
      {op:'line',id:'positive',from:{x:.14,y:.17},to:{x:.14,y:.74},label:'Positive plate',colorRole:'accent',diagram:{weight:'strong',labelSide:'left'}},
      {op:'line',id:'negative',from:{x:.86,y:.17},to:{x:.86,y:.74},label:'Negative plate',colorRole:'relation',diagram:{weight:'strong',labelSide:'right'}},
      ...[.25,.45,.65].map((y,i):Command=>({op:'arrow',id:`field-${i}`,from:{x:.21,y},to:{x:.79,y},color:'muted',label:i===0?'E':undefined})),
      {op:'circle',id:'test-charge',center:{x:.39,y:.45},r:.038,diagram:{fill:'paper'},insideLabel:{text:'+',at:{x:.39,y:.469}}},
      {op:'arrow',id:'force',from:{x:.39,y:.45},to:{x:.65,y:.45},label:'F',colorRole:'accent',concept:'force'},
    ],equation:[{latex:'\\vec F=q\\vec E',colorRole:'accent',concept:'force'},{latex:'\\quad q>0'}],caption:'A positive test charge is pushed along the field.'}]},
    {id:'magnetic',eyebrow:'04 / MAGNETISM · POSITIVE CHARGE',title:'The force turns the motion',blocks:[{kind:'figure',id:'magnetic-figure',commands:[
      ...[.2,.5,.8].flatMap((x,col)=>[.18,.47,.76].flatMap((y,row):Command[]=>[
        {op:'line',id:`cross-a-${col}-${row}`,from:{x:x-.022,y:y-.022},to:{x:x+.022,y:y+.022},color:'muted',diagram:{weight:'light'}},
        {op:'line',id:`cross-b-${col}-${row}`,from:{x:x-.022,y:y+.022},to:{x:x+.022,y:y-.022},color:'muted',diagram:{weight:'light'}},
      ])),
      {op:'circle',id:'charge',center:{x:.35,y:.60},r:.043,diagram:{fill:'paper'},insideLabel:{text:'+',at:{x:.35,y:.619}}},
      {op:'arrow',id:'velocity',from:{x:.35,y:.60},to:{x:.73,y:.60},label:'v',colorRole:'relation'},
      {op:'arrow',id:'magnetic-force',from:{x:.35,y:.60},to:{x:.35,y:.28},label:'F_B',colorRole:'accent',concept:'force'},
    ],equation:[{latex:'\\vec F_B=q\\,\\vec v\\times\\vec B',concept:'force',colorRole:'accent'}],caption:'Crosses: field into page. Force turns motion.'}]},
  ]}},
];

// Motion uses physical time samples, not arc-length progression along a curve.
const pointOnBoard=(p:{x:number;y:number})=>({x:.23+.54*p.x,y:.24+.54*p.y});
const samples=Array.from({length:81},(_,i)=>({t:i/20,u:i/80}));
export const projectileAnimation:AnimationSpec & {shapes:DiagramAnimShape[]}={id:'stem-flight',duration:4,shapes:[
  {kind:'dot',id:'ball',keyframes:samples.map(({t,u})=>({t,at:pointOnBoard(projectilePoint(u)),r:.013}))},
  {kind:'arrow',id:'horizontal-velocity',label:'v_x',keyframes:samples.map(({t,u})=>{
    const p=projectilePoint(u);return {t,from:pointOnBoard(p),to:pointOnBoard({x:p.x+.0884,y:p.y}),color:'ink' as const};
  })},
  {kind:'arrow',id:'vertical-velocity',label:'v_y',diagram:{labelSide:'left'},keyframes:samples.map(({t,u})=>{
    const p=projectilePoint(u);return {t,from:pointOnBoard(p),to:pointOnBoard({x:p.x,y:p.y+.234*(2*u-1)}),color:'accent' as const,opacity:Math.abs(u-.5)<.001?0:1};
  })},
]};
export const stemMotions = {'stem-physics/projectile/1':{
  spec:projectileAnimation,
  label:'Flight time',
  note:'Illustrative flight, sampled at equal time intervals. Black: horizontal velocity. Rust: vertical velocity. Gravity stays downward.',
  initial:1,
}};

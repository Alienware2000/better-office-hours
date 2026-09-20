// Synthetic, ungraded visual fixtures. Never selected by the tutor at runtime.
import type { BoardDocument, DocumentBlock } from '../../lib/whiteboard/document';

type Figure = Extract<DocumentBlock, { kind: 'figure' }>;
const ellipse = (x: number, y: number, rx: number, ry: number) => Array.from({length: 33}, (_,i)=>({x:x+rx*Math.cos(i*Math.PI/16),y:y+ry*Math.sin(i*Math.PI/16)}));
const square: Figure['commands'] = [
  {op:'curve',id:'boundary',points:[{x:.13,y:.12},{x:.88,y:.12},{x:.88,y:.87},{x:.13,y:.87},{x:.13,y:.12}],diagram:{interpolation:'linear',fill:'paper'}},
  {op:'curve',id:'small-square',points:[{x:.62,y:.61},{x:.88,y:.61},{x:.88,y:.87},{x:.62,y:.87},{x:.62,y:.61}],color:'accent',diagram:{interpolation:'linear',fill:'tint'}},
  {op:'line',id:'vertical',from:{x:.62,y:.12},to:{x:.62,y:.87},color:'muted'},
  {op:'line',id:'horizontal',from:{x:.13,y:.61},to:{x:.88,y:.61},color:'muted'},
  {op:'line',id:'top-a',from:{x:.13,y:.04},to:{x:.62,y:.04},label:'a',color:'muted',diagram:{weight:'light',labelSide:'left'}},
  {op:'line',id:'top-b',from:{x:.62,y:.04},to:{x:.88,y:.04},label:'b',color:'accent',diagram:{weight:'light',labelSide:'left'}},
  {op:'line',id:'side-a',from:{x:.04,y:.12},to:{x:.04,y:.61},label:'a',color:'muted',diagram:{weight:'light'}},
  {op:'line',id:'side-b',from:{x:.04,y:.61},to:{x:.04,y:.87},label:'b',color:'accent',diagram:{weight:'light'}},
];
const cell: Figure['commands'] = [
  {op:'curve',id:'membrane',points:ellipse(.5,.48,.44,.37),label:'Cell membrane',diagram:{fill:'paper'}},
  {op:'curve',id:'nucleus',points:ellipse(.40,.44,.145,.155),label:'Nucleus',diagram:{fill:'tint'}},
  {op:'curve',id:'nucleolus',points:ellipse(.41,.47,.045,.047),color:'muted',diagram:{fill:'tint',weight:'light'}},
  {op:'curve',id:'mitochondrion',points:ellipse(.70,.62,.115,.060),label:'Mitochondrion',color:'accent',diagram:{fill:'tint'}},
  {op:'curve',id:'folds',points:[{x:.615,y:.62},{x:.636,y:.591},{x:.651,y:.650},{x:.673,y:.591},{x:.692,y:.650},{x:.714,y:.591},{x:.736,y:.650},{x:.772,y:.62}],color:'accent',diagram:{weight:'light'}},
  {op:'curve',id:'organelle',points:ellipse(.29,.68,.097,.047),color:'accent',diagram:{fill:'tint',weight:'light'}},
  {op:'curve',id:'folds-two',points:[{x:.218,y:.68},{x:.235,y:.658},{x:.255,y:.701},{x:.273,y:.658},{x:.298,y:.701},{x:.32,y:.658},{x:.35,y:.68}],color:'accent',diagram:{weight:'light'}},
  {op:'curve',id:'vesicle',points:ellipse(.71,.33,.045,.038),color:'muted',diagram:{weight:'light'}},
  {op:'curve',id:'vesicle-two',points:ellipse(.63,.27,.028,.025),color:'muted',diagram:{weight:'light'}},
];

export const boardDocuments: { subject: string; subtitle: string; description: string; document: BoardDocument }[] = [
  {subject:'Mathematics',subtitle:'An idea, a diagram, a derivation',description:'Equations keep their notation. A geometric view sits on its own page, followed by a short argument.',document:{id:'mathematics',sections:[
    {id:'identity',eyebrow:'01 / MATHEMATICS',title:'One square, four pieces',blocks:[
      {kind:'prose',id:'area-intro',text:'Take a square with side length a + b. Split each side into lengths a and b. The total area stays the same when we describe it as smaller pieces.'},
      {kind:'equation',id:'identity-equation',latex:'(a+b)^2 = a^2 + 2ab + b^2',caption:'One large square equals the sum of its four regions.'},
      {kind:'prose',id:'area-notice',text:'There are two rectangles with area ab. That is where the middle term comes from.'},
    ]},
    {id:'area-view',eyebrow:'02 / SEE THE RELATIONSHIP',title:'Keep the whole in view',blocks:[
      {kind:'figure',id:'area-figure',commands:square,caption:'The small shaded square has side b and area b².'},
    ]},
    {id:'argument',eyebrow:'03 / MAKE THE CONNECTION',title:'Two ways to count area',blocks:[
      {kind:'sequence',id:'area-steps',steps:[
        {id:'whole',label:'Start with the whole',detail:'The large square has side a + b, so its area is (a + b)².'},
        {id:'pieces',label:'Name the pieces',detail:'A square of area a², two rectangles of area ab, and a square of area b².'},
        {id:'compare',label:'Connect the descriptions',detail:'Adding the pieces gives the same area as the original square.'},
      ]},
    ]},
  ]}},
  {subject:'Biology',subtitle:'Detail with room to breathe',description:'Curves, nested structures, restrained emphasis, and attached labels. A schematic stays distinct from the explanatory notes.',document:{id:'biology',sections:[
    {id:'cell-view',eyebrow:'01 / BIOLOGY',title:'Inside an animal cell',blocks:[
      {kind:'figure',id:'cell-figure',commands:cell,caption:'A simplified view of selected structures, not to scale.'},
    ]},
    {id:'cell-notes',eyebrow:'02 / STRUCTURE AND FUNCTION',title:'Different parts, shared work',blocks:[
      {kind:'sequence',id:'cell-functions',steps:[
        {id:'cell-boundary',label:'Cell membrane',detail:'The boundary separates the cell from its surroundings and regulates what enters and leaves.'},
        {id:'cell-information',label:'Nucleus',detail:'The nucleus contains most of the cell’s DNA.'},
        {id:'cell-energy',label:'Mitochondria',detail:'Mitochondria help convert energy from food into ATP, which powers many cellular processes.'},
      ]},
    ]},
  ]}},
  {subject:'Humanities',subtitle:'An idea and its connections',description:'A concept map makes connections visible. Short prose and a reasoning sequence support interpretation.',document:{id:'humanities',sections:[
    {id:'reading-map',eyebrow:'01 / HUMANITIES',title:'Read beyond the plot',blocks:[
      {kind:'mindmap',id:'homecoming-map',root:'A homecoming',branches:[
        {id:'belonging',label:'Belonging',detail:'Who feels at home?'},
        {id:'memory',label:'Memory',detail:'What does the past change?'},
        {id:'change',label:'Change',detail:'What feels unfamiliar?'},
        {id:'perspective',label:'Perspective',detail:'Whose story is missing?'},
      ]},
    ]},
    {id:'reading-argument',eyebrow:'02 / BUILD AN INTERPRETATION',title:'From a detail to an idea',blocks:[
      {kind:'prose',id:'fiction-notice',text:'Imagine a story in which a returning narrator finds the family house unfamiliar. This is an invented example for exploring a reading.'},
      {kind:'sequence',id:'reading-steps',steps:[
        {id:'observe',label:'Observe',detail:'The house is familiar, yet the narrator describes it as strange.'},
        {id:'interpret',label:'Interpret',detail:'Perhaps the narrator has changed as much as the place has.'},
        {id:'test-reading',label:'Test the reading',detail:'Look for details that support this idea, and for details that complicate it.'},
      ]},
    ]},
  ]}},
  {subject:'Study notes',subtitle:'Notes with a natural rhythm',description:'Longer notes continue at the same type size. Page controls let you move through the argument at your own pace.',document:{id:'study-notes',sections:[
    {id:'questions',eyebrow:'01 / STUDY NOTES',title:'Turn noticing into a question',blocks:[
      {kind:'prose',id:'noticing',text:'Start by writing down what you notice. Describe the observation before explaining it. Keeping those two moves separate makes it easier to see where your evidence ends and your interpretation begins.'},
      {kind:'prose',id:'questions-note',text:'Next, choose a question that could help you understand the observation. A useful question points to something you could compare, inspect, calculate, or discuss. You do not need to know the answer before asking it.'},
      {kind:'prose',id:'connections',text:'Bring in an idea from class. Explain the connection in your own words, then check which part of the observation the idea actually explains. If something does not fit, keep it visible as an open question.'},
      {kind:'prose',id:'revisit',text:'When you return to these notes, cover the explanation and try to reconstruct it. Then compare your account with the original. Add the missing relationship or revise an unclear sentence, rather than copying the whole page again.'},
    ]},
  ]}},
];

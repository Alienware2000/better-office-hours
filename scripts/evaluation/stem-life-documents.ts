// Synthetic, ungraded STEM renderer fixtures. Never selected by the live tutor.
import type { BoardDocument, DocumentBlock } from '../../lib/whiteboard/document';

type Figure = Extract<DocumentBlock, { kind: 'figure' }>;
type Command = Figure['commands'][number];
type Point = { x: number; y: number };

const bond = (id: string, from: Point, to: Point): Command => ({
  op: 'line', id, from, to, diagram: { weight: 'light' },
});
const atom = (id: string, element: 'H' | 'O', x: number, y: number): Command => ({
  op: 'circle', id, center: { x, y }, r: element === 'O' ? .057 : .041,
  diagram: { fill: 'paper', weight: 'light' }, colorRole: element === 'O' ? 'accent' : 'relation',
  concept: element === 'O' ? 'oxygen-atoms' : 'hydrogen-atoms',
  insideLabel: { text: element, at: { x, y: y + .020 } },
});
const water = (id: string, x: number, y: number): Command[] => [
  bond(`${id}-left-bond`, { x, y }, { x: x - .10, y: y + .077 }),
  bond(`${id}-right-bond`, { x, y }, { x: x + .10, y: y + .077 }),
  atom(`${id}-oxygen`, 'O', x, y),
  atom(`${id}-hydrogen-left`, 'H', x - .10, y + .077),
  atom(`${id}-hydrogen-right`, 'H', x + .10, y + .077),
];
const reaction: Command[] = [
  bond('hydrogen-one-bond', { x: .10, y: .23 }, { x: .22, y: .23 }),
  atom('hydrogen-one-a', 'H', .10, .23), atom('hydrogen-one-b', 'H', .22, .23),
  bond('hydrogen-two-bond', { x: .39, y: .23 }, { x: .51, y: .23 }),
  atom('hydrogen-two-a', 'H', .39, .23), atom('hydrogen-two-b', 'H', .51, .23),
  bond('oxygen-bond-one', { x: .77, y: .218 }, { x: .92, y: .218 }),
  bond('oxygen-bond-two', { x: .77, y: .242 }, { x: .92, y: .242 }),
  atom('oxygen-one', 'O', .77, .23), atom('oxygen-two', 'O', .92, .23),
  { op: 'arrow', id: 'reaction-direction', from: { x: .50, y: .39 }, to: { x: .50, y: .56 }, label: 'Rearrange atoms', color: 'muted', diagram: { weight: 'light' } },
  ...water('water-one', .27, .72), ...water('water-two', .74, .72),
];

const energy: Command[] = [
  { op: 'arrow', id: 'energy-axis', from: { x: .08, y: .9 }, to: { x: .08, y: .08 }, insideLabel: {text:'Energy',at:{x:.08,y:.02}}, color: 'muted', diagram: { weight: 'light' } },
  { op: 'arrow', id: 'progress-axis', from: { x: .08, y: .9 }, to: { x: .96, y: .9 }, insideLabel: {text:'Reaction progress',at:{x:.52,y:.88}}, color: 'muted', diagram: { weight: 'light' } },
  { op: 'curve', id: 'reaction-path', points: [{ x: .15, y: .54 }, { x: .29, y: .54 }, { x: .40, y: .37 }, { x: .53, y: .15 }, { x: .66, y: .43 }, { x: .79, y: .77 }, { x: .93, y: .77 }], diagram: { interpolation: 'smooth' } },
  { op: 'line', id: 'reactant-level', from: { x: .15, y: .54 }, to: { x: .29, y: .54 }, insideLabel: {text:'Reactants',at:{x:.22,y:.63}} },
  { op: 'line', id: 'product-level', from: { x: .79, y: .77 }, to: { x: .93, y: .77 }, insideLabel: {text:'Products',at:{x:.81,y:.57}} },
  { op: 'line', id: 'reactant-reference', from: { x: .29, y: .54 }, to: { x: .94, y: .54 }, dashed: true, color: 'muted', diagram: { weight: 'light' } },
  { op: 'arrow', id: 'activation-energy', from: { x: .53, y: .54 }, to: { x: .53, y: .15 }, label: 'E_a', colorRole: 'accent', concept: 'activation' },
  { op: 'arrow', id: 'energy-change', from: { x: .94, y: .54 }, to: { x: .94, y: .77 }, label: '\\Delta E', colorRole: 'relation', concept: 'energy-change' },
];

const leftParticles: Point[] = [
  { x: .13, y: .28 }, { x: .28, y: .24 }, { x: .37, y: .34 },
  { x: .18, y: .42 }, { x: .30, y: .48 }, { x: .12, y: .60 },
  { x: .35, y: .64 }, { x: .23, y: .69 }, { x: .39, y: .22 },
];
const rightParticles: Point[] = [{ x: .72, y: .26 }, { x: .86, y: .51 }, { x: .72, y: .67 }];
const diffusion: Command[] = [
  { op: 'line', id: 'left-concentration', from: { x: .10, y: .12 }, to: { x: .37, y: .12 }, label: 'More oxygen', colorRole: 'relation', diagram: { weight: 'light' } },
  { op: 'line', id: 'right-concentration', from: { x: .68, y: .12 }, to: { x: .93, y: .12 }, label: 'Less oxygen', colorRole: 'relation', diagram: { weight: 'light' } },
  { op: 'line', id: 'membrane-left', from: { x: .48, y: .18 }, to: { x: .48, y: .72 }, color: 'muted', diagram: { weight: 'light' } },
  { op: 'line', id: 'membrane-right', from: { x: .53, y: .18 }, to: { x: .53, y: .72 }, label: 'Membrane', color: 'muted', diagram: { weight: 'light' } },
  ...[...leftParticles, ...rightParticles].map((center, index): Command => ({ op: 'circle', id: `oxygen-particle-${index}`, center, r: .018, colorRole: 'relation', diagram: { fill: 'tint', weight: 'light' }, concept: 'oxygen-particles' })),
  { op: 'arrow', id: 'microscopic-right', from: { x: .39, y: .40 }, to: { x: .63, y: .40 }, color: 'muted', diagram: { weight: 'light' }, concept: 'random-crossing' },
  { op: 'arrow', id: 'microscopic-left', from: { x: .62, y: .56 }, to: { x: .39, y: .56 }, color: 'muted', diagram: { weight: 'light' }, concept: 'random-crossing' },
  { op: 'arrow', id: 'net-flux', from: { x: .28, y: .84 }, to: { x: .75, y: .84 }, label: 'Net flow', colorRole: 'accent', diagram: { weight: 'strong' }, concept: 'net-flow' },
];

export const stemLifeDocuments: { subject: string; subtitle: string; description: string; document: BoardDocument }[] = [
  {
    subject: 'Chemistry · atoms', subtitle: 'A reaction keeps its atoms',
    description: 'Count four hydrogen atoms and two oxygen atoms before and after. Element labels reinforce color. This is a stoichiometric picture, not a reaction mechanism; molecular drawings are schematic and not to scale.',
    document: { id: 'stem-water', sections: [{ id: 'conservation', eyebrow: 'CHEMISTRY / STOICHIOMETRY', title: 'Same atoms, new molecules', blocks: [{
      kind: 'figure', id: 'water-reaction', commands: reaction,
      equation: [{ latex: '2\\,\\mathrm{H_2(g)}+\\mathrm{O_2(g)}\\longrightarrow2\\,\\mathrm{H_2O(g)}' }],
      caption: '4 H and 2 O atoms on each side.',
    }] }] },
  },
  {
    subject: 'Chemistry · energy', subtitle: 'The barrier is not the drop',
    description: 'An illustrative one-step reaction profile, not the mechanism for water formation. Rust measures the forward activation barrier; teal measures the overall energy change. Reaction progress is not a time axis.',
    document: { id: 'stem-energy', sections: [{ id: 'barrier', eyebrow: 'CHEMISTRY / REACTION ENERGY', title: 'First a barrier, then a drop', blocks: [{
      kind: 'figure', id: 'energy-profile', commands: energy.map(command=>command.op==='curve'?{...command,points:command.points.map(p=>({...p,y:p.y*.84}))}:command.op==='line'||command.op==='arrow'?{...command,from:{...command.from,y:command.from.y*.84},to:{...command.to,y:command.to.y*.84}}:command),
      equation: [{ latex: '\\Delta E', colorRole: 'relation', concept: 'energy-change' }, { latex: '=E_{\\mathrm{products}}-E_{\\mathrm{reactants}}<0' }],
      caption: 'The barrier is not the energy change.',
    }] }] },
  },
  {
    subject: 'Biology · diffusion', subtitle: 'Random motion, a net direction',
    description: 'Equal-volume regions with different concentrations of oxygen, a small uncharged molecule that can cross a lipid membrane. Dots represent molecules; the membrane is schematic. Small opposing arrows show crossings both ways. The large arrow summarizes net flux, not an individual molecule path.',
    document: { id: 'stem-diffusion', sections: [{ id: 'gradient', eyebrow: 'BIOLOGY / PASSIVE TRANSPORT', title: 'Both ways, with a net flow', blocks: [{
      kind: 'figure', id: 'membrane-diffusion', commands: diffusion,
      caption: 'Molecules cross both ways. More cross from the dense side.',
    }] }] },
  },
];

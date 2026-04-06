export type LabelSlug =
  | 'infrastructure'
  | 'ai-automation'
  | 'product'
  | 'research'
  | 'systems-thinking'
  | 'operator-notes'
  | 'academic-work';

export interface LabelConfig {
  name: string;
  accent: string;
  gradient: [string, string, string];
}

export const labels: Record<LabelSlug, LabelConfig> = {
  'infrastructure': {
    name: 'Infrastructure',
    accent: '#78c8dc',
    gradient: ['#061e2e', '#0d3a4e', '#0a2e3e'],
  },
  'ai-automation': {
    name: 'AI & Automation',
    accent: '#b48cff',
    gradient: ['#120827', '#1e0d45', '#180a38'],
  },
  'product': {
    name: 'Product',
    accent: '#6cc890',
    gradient: ['#0a1f12', '#143826', '#0d2a1a'],
  },
  'research': {
    name: 'Research',
    accent: '#dcb478',
    gradient: ['#1f1208', '#3a2510', '#2b1a0a'],
  },
  'systems-thinking': {
    name: 'Systems Thinking',
    accent: '#e08080',
    gradient: ['#1a0a0a', '#3a1818', '#2a1010'],
  },
  'operator-notes': {
    name: 'Operator Notes',
    accent: '#c8c8c8',
    gradient: ['#0f0f0f', '#1c1c1c', '#141414'],
  },
  'academic-work': {
    name: 'Academic Work',
    accent: '#a0a0d0',
    gradient: ['#0d0a1f', '#1a1440', '#140f30'],
  },
};

export const labelSlugs = Object.keys(labels) as LabelSlug[];

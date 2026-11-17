import { describe, expect, it } from 'vitest';

import { filterExplorerNodes } from './content-explorer.types';
import { ExplorerNode } from '../services/content-explorer.store';

function makeNode(id: string, title: string, children: ExplorerNode[] | null = null): ExplorerNode {
  const node = new ExplorerNode({
    kind: 'course',
    id,
    parentId: null,
    title,
  });
  if (children) {
    node.children.set(children);
  }
  return node;
}

describe('filterExplorerNodes', () => {
  it('returns all nodes when the query is empty or blank', () => {
    const nodes = [makeNode('1', 'Alpha'), makeNode('2', 'Beta')];
    expect(filterExplorerNodes(nodes, '')).toHaveLength(2);
    expect(filterExplorerNodes(nodes, '   ')).toHaveLength(2);
  });

  it('keeps nodes whose title matches the query (case-insensitive)', () => {
    const nodes = [makeNode('1', 'Английский A1'), makeNode('2', 'Perl Interview')];
    const result = filterExplorerNodes(nodes, 'английский');
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('1');
  });

  it('keeps a parent when a loaded descendant matches', () => {
    const child = makeNode('child-1', 'Приветствия');
    const parent = makeNode('parent-1', 'Basics', [child]);
    const other = makeNode('other', 'Другое');

    const result = filterExplorerNodes([parent, other], 'привет');
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('parent-1');
  });

  it('hides a parent without matches and without loaded children', () => {
    const parent = makeNode('parent-1', 'Basics', null);
    expect(filterExplorerNodes([parent], 'несуществующий')).toHaveLength(0);
  });

  it('hides a parent whose loaded children do not match', () => {
    const child = makeNode('child-1', 'Приветствия');
    const parent = makeNode('parent-1', 'Basics', [child]);
    expect(filterExplorerNodes([parent], 'несуществующий')).toHaveLength(0);
  });

  it('preserves node order', () => {
    const nodes = [makeNode('1', 'Alpha'), makeNode('2', 'Alpha beta'), makeNode('3', 'Gamma')];
    const result = filterExplorerNodes(nodes, 'alpha');
    expect(result.map((node) => node.id)).toEqual(['1', '2']);
  });
});

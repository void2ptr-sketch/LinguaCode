import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach } from 'vitest';
import { ExplorerTreeNodeComponent } from './explorer-tree-node.component';
import { ContentExplorerStore, ExplorerNode } from '../../services/content-explorer.store';
import { EXPLORER_KIND_ICONS, EXPLORER_KIND_LABELS } from '../../types/content-explorer.types';

@Component({
  standalone: true,
  imports: [ExplorerTreeNodeComponent],
  template: `<app-explorer-tree-node
    [node]="node()"
    [depth]="depth()"
    [searchSubtree]="searchSubtree()"
  />`,
})
class TestHostComponent {
  node = signal<ExplorerNode>(
    new ExplorerNode({ kind: 'course', id: 'c1', parentId: null, title: 'c1' }),
  );
  depth = signal(0);
  searchSubtree = signal(false);
}

import { Component } from '@angular/core';

describe('ExplorerTreeNodeComponent', () => {
  let store: ContentExplorerStore;
  let component: ExplorerTreeNodeComponent;
  let fixture: import('@angular/core/testing').ComponentFixture<TestHostComponent>;

  function makeNode(
    kind: ExplorerNode['kind'],
    id: string,
    parentId: string | null,
    extra?: {
      meta?: string;
      order?: number;
      editable?: boolean;
      shared?: boolean;
      virtual?: boolean;
      data?: unknown;
    },
  ): ExplorerNode {
    return new ExplorerNode({ kind, id, parentId, title: id, ...extra });
  }

  beforeEach(async () => {
    store = {
      searchVisibleKeys: signal<ReadonlySet<string> | null>(null),
      searchMatchedKeys: signal<ReadonlySet<string>>(new Set()),
      searchExtraChildren: signal<ReadonlyMap<string, readonly ExplorerNode[]>>(new Map()),
      // eslint-disable-next-line @typescript-eslint/no-empty-function
      selectNode: (() => {}),
      // eslint-disable-next-line @typescript-eslint/no-empty-function
      toggleNode: (() => {}),
      selectedId: signal<string | null>(null),
      selectedNode: signal<ExplorerNode | null>(null),
    } as unknown as ContentExplorerStore;

    await TestBed.configureTestingModule({
      imports: [TestHostComponent],
      providers: [{ provide: ContentExplorerStore, useValue: store }],
    }).compileComponents();

    fixture = TestBed.createComponent(TestHostComponent);
    fixture.detectChanges();
    component = fixture.debugElement.children[0].injector.get(ExplorerTreeNodeComponent);
  });

  it('should expose kindIcon and kindLabel', () => {
    expect((component as unknown as Record<string, () => string>)['kindIcon']()).toBe(
      EXPLORER_KIND_ICONS['course'],
    );
    expect((component as unknown as Record<string, () => string>)['kindLabel']()).toBe(
      EXPLORER_KIND_LABELS['course'],
    );
  });

  it('should show searchActive as false when no search', () => {
    expect((component as unknown as Record<string, () => boolean>)['searchActive']()).toBe(false);
  });

  it('should show isSearchMatch as false when node not matched', () => {
    expect((component as unknown as Record<string, () => boolean>)['isSearchMatch']()).toBe(false);
  });

  it('should show filteredSearchMode as false when not in search', () => {
    expect((component as unknown as Record<string, () => boolean>)['filteredSearchMode']()).toBe(
      false,
    );
  });

  it('should return empty searchExtras by default', () => {
    expect(
      (component as unknown as Record<string, () => ExplorerNode[]>)['searchExtras'](),
    ).toEqual([]);
  });

  it('should return visibleChildren from node children', () => {
    const child1 = makeNode('program', 'p1', 'course:c1');
    const child2 = makeNode('program', 'p2', 'course:c1');
    const node = makeNode('course', 'c1', null);
    node.children.set([child1, child2]);
    fixture.componentInstance.node.set(node);
    fixture.detectChanges();

    expect(
      (component as unknown as Record<string, () => ExplorerNode[]>)['visibleChildren'](),
    ).toEqual([child1, child2]);
  });

  it('should return empty visibleChildren when node has no children', () => {
    const node = makeNode('course', 'c1', null);
    node.children.set([]);
    fixture.componentInstance.node.set(node);
    fixture.detectChanges();

    expect(
      (component as unknown as Record<string, () => ExplorerNode[]>)['visibleChildren'](),
    ).toEqual([]);
  });

  it('should show hasChildren as true when node has children', () => {
    const child = makeNode('program', 'p1', 'course:c1');
    const node = makeNode('course', 'c1', null);
    node.children.set([child]);
    fixture.componentInstance.node.set(node);
    fixture.detectChanges();

    expect((component as unknown as Record<string, () => boolean>)['hasChildren']()).toBe(true);
  });

  it('should show hasChildren as true when children are null (not loaded)', () => {
    const node = makeNode('course', 'c1', null);
    fixture.componentInstance.node.set(node);
    fixture.detectChanges();

    expect((component as unknown as Record<string, () => boolean>)['hasChildren']()).toBe(true);
  });

  it('should show hasChildren as false for card when not virtual', () => {
    const node = makeNode('card', 'card-1', 'scenario:s1');
    node.children.set([]);
    fixture.componentInstance.node.set(node);
    fixture.detectChanges();

    expect((component as unknown as Record<string, () => boolean>)['hasChildren']()).toBe(false);
  });

  it('should show hasChildren as true for virtual card with children', () => {
    const child = makeNode('card', 'c1', 'scenario:s1');
    const node = makeNode('card', 'card-1', 'scenario:s1', { virtual: true });
    node.children.set([child]);
    fixture.componentInstance.node.set(node);
    fixture.detectChanges();

    expect((component as unknown as Record<string, () => boolean>)['hasChildren']()).toBe(true);
  });

  it('should show children when expanded and children loaded', () => {
    const child = makeNode('program', 'p1', 'course:c1');
    const node = makeNode('course', 'c1', null);
    node.expanded.set(true);
    node.children.set([child]);
    fixture.componentInstance.node.set(node);
    fixture.detectChanges();

    expect((component as unknown as Record<string, () => boolean>)['showChildren']()).toBe(true);
  });

  it('should not show children when collapsed and no extras', () => {
    const node = makeNode('course', 'c1', null);
    node.expanded.set(false);
    node.children.set([]);
    fixture.componentInstance.node.set(node);
    fixture.detectChanges();

    expect((component as unknown as Record<string, () => boolean>)['showChildren']()).toBe(false);
  });

  it('should show children when searchExtras exist and node is matched', () => {
    const extra = makeNode('card', 'extra-1', 'course:c1');
    const node = makeNode('course', 'c1', null);
    node.expanded.set(false);
    node.children.set([]);
    const extraMap = new Map<string, readonly ExplorerNode[]>([[node.key, [extra]]]);
    const visibleKeys = new Set<string>([node.key]);
    store.searchVisibleKeys.set(visibleKeys);
    store.searchMatchedKeys.set(new Set([node.key]));
    store.searchExtraChildren.set(extraMap);
    fixture.componentInstance.node.set(node);
    fixture.detectChanges();

    expect((component as unknown as Record<string, () => boolean>)['showChildren']()).toBe(true);
  });

  it('should call store.selectNode on onSelect', () => {
    let selectedNode: ExplorerNode | null = null;
    (store as unknown as Record<string, (n: ExplorerNode) => void>)['selectNode'] = (n: ExplorerNode) => {
      selectedNode = n;
    };
    const node = makeNode('course', 'c1', null);
    fixture.componentInstance.node.set(node);
    fixture.detectChanges();

    (component as unknown as Record<string, (e: Event) => void>)['onSelect'](new Event('click'));
    expect(selectedNode).toBe(node);
  });

  it('should call store.toggleNode on onToggle', async () => {
    let selectedNode: ExplorerNode | null = null;
    let toggledNode: ExplorerNode | null = null;
    (store as unknown as Record<string, (n: ExplorerNode) => void>)['selectNode'] = (n: ExplorerNode) => {
      selectedNode = n;
    };
    (store as unknown as Record<string, (n: ExplorerNode) => Promise<void>>)['toggleNode'] = async (n: ExplorerNode) => {
      toggledNode = n;
    };
    const node = makeNode('course', 'c1', null);
    fixture.componentInstance.node.set(node);
    fixture.detectChanges();

    await (component as unknown as Record<string, (e: MouseEvent) => Promise<void>>)['onToggle'](new MouseEvent('click'));
    expect(selectedNode).toBe(node);
    expect(toggledNode).toBe(node);
  });
});

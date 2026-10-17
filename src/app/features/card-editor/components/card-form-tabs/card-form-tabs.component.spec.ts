import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { describe, expect, it, vi } from 'vitest';
import { CardFormTabsComponent, TabDefinition } from './card-form-tabs.component';

@Component({
  selector: 'app-host',
  standalone: true,
  imports: [CardFormTabsComponent],
  template: `
    <app-card-form-tabs
      [tabs]="tabs"
      (activeTabChange)="onActiveTabChange($event)"
      (tabKeydown)="onTabKeydown($event)"
    />
  `,
})
class HostComponent {
  tabs: TabDefinition[] = [];
  activeTab = '';
  keyboardEvents: KeyboardEvent[] = [];

  onActiveTabChange(label: string): void {
    this.activeTab = label;
  }

  onTabKeydown(event: KeyboardEvent): void {
    this.keyboardEvents.push(event);
  }
}

describe('CardFormTabsComponent', () => {
  let hostFixture: import('@angular/core/testing').ComponentFixture<HostComponent>;
  let host: HostComponent;
  let tabComponent: CardFormTabsComponent;

  const createTabs = (count: number): TabDefinition[] =>
    Array.from({ length: count }, (_, i) => ({
      label: `Tab ${i + 1}`,
      visible: true,
    }));

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HostComponent, CardFormTabsComponent],
    });

    hostFixture = TestBed.createComponent(HostComponent);
    host = hostFixture.componentInstance;
    host.tabs = createTabs(5);
    hostFixture.detectChanges();

    tabComponent = hostFixture.debugElement.children[0].componentInstance;
  });

  // ── visibleTabs ──

  it('should show VISIBLE_TABS_COUNT tabs when enough tabs exist', () => {
    expect(tabComponent.visibleTabs().length).toBe(3);
    expect(tabComponent.visibleTabs()[0].label).toBe('Tab 1');
    expect(tabComponent.visibleTabs()[2].label).toBe('Tab 3');
  });

  it('should show all tabs when fewer than VISIBLE_TABS_COUNT', () => {
    host.tabs = createTabs(2);
    hostFixture.detectChanges();
    expect(tabComponent.visibleTabs().length).toBe(2);
  });

  it('should show empty array when no tabs', () => {
    host.tabs = [];
    hostFixture.detectChanges();
    expect(tabComponent.visibleTabs()).toEqual([]);
  });

  // ── MAX_TAB_OFFSET ──

  it('should compute max offset correctly', () => {
    expect(tabComponent.MAX_TAB_OFFSET).toBe(2);
  });

  it('should return 0 when fewer tabs than visible', () => {
    host.tabs = createTabs(2);
    hostFixture.detectChanges();
    expect(tabComponent.MAX_TAB_OFFSET).toBe(0);
  });

  it('should return 0 when exactly VISIBLE_TABS_COUNT tabs', () => {
    host.tabs = createTabs(3);
    hostFixture.detectChanges();
    expect(tabComponent.MAX_TAB_OFFSET).toBe(0);
  });

  // ── activeTabLabel ──

  it('should return first visible tab label by default', () => {
    expect(tabComponent.activeTabLabel()).toBe('Tab 1');
  });

  it('should return empty string when no tabs', () => {
    host.tabs = [];
    hostFixture.detectChanges();
    expect(tabComponent.activeTabLabel()).toBe('');
  });

  // ── canPrevTabs / canNextTabs ──

  it('should not allow prev at offset 0', () => {
    expect(tabComponent.canPrevTabs()).toBe(false);
  });

  it('should allow next when offset < max', () => {
    expect(tabComponent.canNextTabs()).toBe(true);
  });

  it('should not allow next when at max offset', () => {
    // Simulate scrolling to max
    (tabComponent as unknown as { _offset: number })._offset = 2;
    expect(tabComponent.canNextTabs()).toBe(false);
  });

  // ── prevTabs / nextTabs ──

  it('should scroll right', () => {
    (tabComponent as unknown as { _offset: number })._offset = 0;
    tabComponent.nextTabs();
    expect((tabComponent as unknown as { _offset: number })._offset).toBe(1);
  });

  it('should scroll left', () => {
    (tabComponent as unknown as { _offset: number })._offset = 1;
    tabComponent.prevTabs();
    expect((tabComponent as unknown as { _offset: number })._offset).toBe(0);
  });

  it('should not scroll past boundaries', () => {
    (tabComponent as unknown as { _offset: number })._offset = 2;
    tabComponent.nextTabs();
    expect((tabComponent as unknown as { _offset: number })._offset).toBe(2);
  });

  it('should not scroll left at 0', () => {
    (tabComponent as unknown as { _offset: number })._offset = 0;
    tabComponent.prevTabs();
    expect((tabComponent as unknown as { _offset: number })._offset).toBe(0);
  });

  // ── onTabChange ──

  it('should set selected tab label and emit', () => {
    let emitted = '';
    tabComponent.activeTabChange.subscribe((label) => {
      emitted = label;
    });
    tabComponent.onTabChange('Tab 3');
    expect(emitted).toBe('Tab 3');
  });

  // ── handleKeydown ──

  it('should call prevTabs on Ctrl+ArrowLeft', () => {
    (tabComponent as unknown as { _offset: number })._offset = 1;
    const event = Object.assign(
      new KeyboardEvent('keydown', {
        ctrlKey: true,
        key: 'ArrowLeft',
      }),
      { preventDefault: vi.fn() },
    );
    tabComponent.handleKeydown(event);
    expect((tabComponent as unknown as { _offset: number })._offset).toBe(0);
  });

  it('should call nextTabs on Ctrl+ArrowRight', () => {
    (tabComponent as unknown as { _offset: number })._offset = 0;
    const event = Object.assign(
      new KeyboardEvent('keydown', {
        ctrlKey: true,
        key: 'ArrowRight',
      }),
      { preventDefault: vi.fn() },
    );
    tabComponent.handleKeydown(event);
    expect((tabComponent as unknown as { _offset: number })._offset).toBe(1);
  });

  it('should emit tabKeydown event', () => {
    let emitted: KeyboardEvent | undefined;
    tabComponent.tabKeydown.subscribe((event) => {
      emitted = event;
    });
    const event = new KeyboardEvent('keydown', { key: 'a' });
    tabComponent.handleKeydown(event);
    expect(emitted).toBe(event);
  });

  it('should not change offset on non-ctrl keydown', () => {
    (tabComponent as unknown as { _offset: number })._offset = 0;
    const event = new KeyboardEvent('keydown', { key: 'a' });
    tabComponent.handleKeydown(event);
    expect((tabComponent as unknown as { _offset: number })._offset).toBe(0);
  });
});

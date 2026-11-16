import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';
import { CardFormTabsComponent, TabDefinition } from './card-form-tabs.component';

@Component({
  selector: 'app-host',
  standalone: true,
  imports: [CardFormTabsComponent],
  template: `
    <app-card-form-tabs
      [tabs]="tabs"
      (activeTabChange)="onActiveTabChange($event)"
    />
  `,
})
class HostComponent {
  tabs: TabDefinition[] = [];
  activeTabIndex = -1;

  onActiveTabChange(index: number): void {
    this.activeTabIndex = index;
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

  // ── Structure ──

  it('should export TabDefinition type', () => {
    const tab: TabDefinition = { label: 'Test', visible: true };
    expect(tab.label).toBe('Test');
    expect(tab.visible).toBe(true);
  });

  it('should render mat-tab-group', () => {
    const groups = hostFixture.nativeElement.querySelectorAll('mat-tab-group');
    expect(groups.length).toBe(1);
  });

  it('should render all tab labels in the DOM', () => {
    const text = hostFixture.nativeElement.textContent?.toLowerCase() || '';
    for (let i = 1; i <= 5; i++) {
      expect(text).toContain(`tab ${i}`);
    }
  });

  // ── activeTabChange ──

  it('should emit index on tab change', () => {
    tabComponent.onTabChange(2);
    expect(host.activeTabIndex).toBe(2);
  });

  it('should emit index 0 for first tab', () => {
    tabComponent.onTabChange(0);
    expect(host.activeTabIndex).toBe(0);
  });

  it('should emit last index for last tab', () => {
    tabComponent.onTabChange(4);
    expect(host.activeTabIndex).toBe(4);
  });

  it('should emit correct index for single tab', () => {
    host.tabs = createTabs(1);
    hostFixture.detectChanges();
    tabComponent.onTabChange(0);
    expect(host.activeTabIndex).toBe(0);
  });

  // ── Dynamic tab count ──

  it('should render all tabs when fewer than 3', () => {
    host.tabs = createTabs(2);
    hostFixture.detectChanges();
    const text = hostFixture.nativeElement.textContent?.toLowerCase() || '';
    expect(text).toContain('tab 1');
    expect(text).toContain('tab 2');
  });

  it('should render no tabs when empty', () => {
    host.tabs = [];
    hostFixture.detectChanges();
    const groups = hostFixture.nativeElement.querySelectorAll('mat-tab-group');
    expect(groups.length).toBe(1);
  });

  it('should render all tabs when more than 5', () => {
    host.tabs = createTabs(8);
    hostFixture.detectChanges();
    const text = hostFixture.nativeElement.textContent?.toLowerCase() || '';
    for (let i = 1; i <= 8; i++) {
      expect(text).toContain(`tab ${i}`);
    }
  });
});

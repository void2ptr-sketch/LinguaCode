import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';
import { CardFormTabsComponent, TabDefinition, TabId } from './card-form-tabs.component';

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
  activeTabId: TabId | null = null;

  onActiveTabChange(tabId: TabId): void {
    this.activeTabId = tabId;
  }
}

describe('CardFormTabsComponent', () => {
  let hostFixture: import('@angular/core/testing').ComponentFixture<HostComponent>;
  let host: HostComponent;
  let tabComponent: CardFormTabsComponent;

  const createTabs = (): TabDefinition[] => [
    { id: 'content', label: 'Содержание', visible: true },
    { id: 'answers', label: 'Ответы', visible: true },
    { id: 'appearance', label: 'Оформление', visible: true },
    { id: 'placement', label: 'Размещение', visible: true },
    { id: 'publishing', label: 'Публикация', visible: true },
  ];

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HostComponent, CardFormTabsComponent],
    });

    hostFixture = TestBed.createComponent(HostComponent);
    host = hostFixture.componentInstance;
    host.tabs = createTabs();
    hostFixture.detectChanges();

    tabComponent = hostFixture.debugElement.children[0].componentInstance;
  });

  // ── Structure ──

  it('should export TabDefinition type with stable id', () => {
    const tab: TabDefinition = { id: 'content', label: 'Test', visible: true };
    expect(tab.id).toBe('content');
    expect(tab.label).toBe('Test');
    expect(tab.visible).toBe(true);
  });

  it('should render mat-tab-group', () => {
    const groups = hostFixture.nativeElement.querySelectorAll('mat-tab-group');
    expect(groups.length).toBe(1);
  });

  it('should render all visible tab labels in the DOM', () => {
    const text = hostFixture.nativeElement.textContent?.toLowerCase() || '';
    expect(text).toContain('содержание');
    expect(text).toContain('ответы');
    expect(text).toContain('оформление');
    expect(text).toContain('размещение');
    expect(text).toContain('публикация');
  });

  it('should hide invisible tabs', () => {
    host.tabs = createTabs().map((tab) =>
      tab.id === 'answers' ? { ...tab, visible: false } : tab,
    );
    hostFixture.detectChanges();

    const text = hostFixture.nativeElement.textContent?.toLowerCase() || '';
    expect(text).not.toContain('ответы');
    expect(tabComponent.visibleTabs().length).toBe(4);
  });

  it('should render a validation badge with an accessible label', () => {
    host.tabs = createTabs().map((tab) =>
      tab.id === 'answers'
        ? { ...tab, badge: '2', badgeAriaLabel: 'Ответы, 2 ошибки' }
        : tab,
    );
    hostFixture.detectChanges();

    const badge = hostFixture.nativeElement.querySelector('.card-form__tab-badge');
    expect(badge?.textContent?.trim()).toBe('2');

    const label = hostFixture.nativeElement.querySelector(
      '.card-form__tab-label[aria-label="Ответы, 2 ошибки"]',
    );
    expect(label).toBeTruthy();
  });

  it('should not render a badge for tabs without a badge value', () => {
    const badges = hostFixture.nativeElement.querySelectorAll('.card-form__tab-badge');
    expect(badges.length).toBe(0);
  });

  // ── activeTabChange ──

  it('should emit stable id for the first tab', () => {
    tabComponent.onTabChange(0);
    expect(host.activeTabId).toBe('content');
  });

  it('should emit stable id mapped through the tab list', () => {
    tabComponent.onTabChange(2);
    expect(host.activeTabId).toBe('appearance');
  });

  it('should map index through visible tabs when a tab is hidden', () => {
    host.tabs = createTabs().map((tab) =>
      tab.id === 'answers' ? { ...tab, visible: false } : tab,
    );
    hostFixture.detectChanges();

    tabComponent.onTabChange(1);
    expect(host.activeTabId).toBe('appearance');
  });

  it('should not emit for an out-of-range index', () => {
    host.activeTabId = null;
    tabComponent.onTabChange(99);
    expect(host.activeTabId).toBeNull();
  });
});

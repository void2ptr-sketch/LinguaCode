import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { describe, expect, it } from 'vitest';

import { NavigationComponent } from './navigation.component';

describe('NavigationComponent', () => {
  let fixture: ComponentFixture<NavigationComponent>;
  let component: NavigationComponent;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [NavigationComponent, MatDividerModule, MatListModule, MatIconModule],
      providers: [provideRouter([])],
    });
    fixture = TestBed.createComponent(NavigationComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    fixture.detectChanges();
    expect(component).toBeDefined();
  });

  it('should expose groups', () => {
    expect(component.groups).toBeDefined();
    expect(component.groups).toHaveLength(3);
  });

  it('should have learning group', () => {
    const learningGroup = component.groups.find((g) => g.id === 'learning');
    expect(learningGroup).toBeDefined();
    expect(learningGroup?.items).toHaveLength(4);
  });

  it('should have tools group', () => {
    const toolsGroup = component.groups.find((g) => g.id === 'tools');
    expect(toolsGroup).toBeDefined();
    expect(toolsGroup?.items).toHaveLength(3);
  });

  it('should have account group', () => {
    const accountGroup = component.groups.find((g) => g.id === 'account');
    expect(accountGroup).toBeDefined();
    expect(accountGroup?.items).toHaveLength(1);
  });

  it('should render navigation list', () => {
    fixture.detectChanges();
    const navList = fixture.nativeElement.querySelector('mat-nav-list.navigation');
    expect(navList).toBeDefined();
  });

  it('should have aria-label navigation', () => {
    fixture.detectChanges();
    const navList = fixture.nativeElement.querySelector('mat-nav-list');
    expect(navList?.getAttribute('aria-label')).toBe('Навигация');
  });

  it('should render all group items', () => {
    fixture.detectChanges();
    const links = fixture.nativeElement.querySelectorAll('a[mat-list-item]');
    expect(links.length).toBe(8);
  });

  it('should render learning group items', () => {
    fixture.detectChanges();
    const learningGroup = component.groups.find((g) => g.id === 'learning');
    learningGroup?.items.forEach((item) => {
      expect(item.label).toBeDefined();
      expect(item.path).toBeDefined();
      expect(item.icon).toBeDefined();
    });
  });

  it('should render tools group items', () => {
    fixture.detectChanges();
    const toolsGroup = component.groups.find((g) => g.id === 'tools');
    toolsGroup?.items.forEach((item) => {
      expect(item.label).toBeDefined();
      expect(item.path).toBeDefined();
      expect(item.icon).toBeDefined();
    });
  });

  it('should render account group items', () => {
    fixture.detectChanges();
    const accountGroup = component.groups.find((g) => g.id === 'account');
    accountGroup?.items.forEach((item) => {
      expect(item.label).toBeDefined();
      expect(item.path).toBeDefined();
      expect(item.icon).toBeDefined();
    });
  });

  it('should render dividers between groups', () => {
    fixture.detectChanges();
    const dividers = fixture.nativeElement.querySelectorAll('mat-divider.navigation__divider');
    expect(dividers.length).toBe(2);
  });

  it('should render mat-icons for each item', () => {
    fixture.detectChanges();
    const icons = fixture.nativeElement.querySelectorAll('mat-icon');
    expect(icons.length).toBe(8);
  });
});

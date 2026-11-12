import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { signal } from '@angular/core';
import { describe, expect, it } from 'vitest';

import { SidebarNavigationLeftComponent } from './sidebar-navigation-left.component';
import { RoleService } from '../../entities/auth/services/role.service';
import type { NavGroup } from './sidebar-nav-config';

describe('SidebarNavigationLeftComponent', () => {
  let fixture: ComponentFixture<SidebarNavigationLeftComponent>;
  let component: SidebarNavigationLeftComponent;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [SidebarNavigationLeftComponent, MatDividerModule, MatListModule, MatIconModule],
      providers: [
        provideRouter([]),
        {
          provide: RoleService,
          useValue: {
            roles: signal(['ROLE_AUTHOR']),
            hasRole: (role: string) => ['ROLE_AUTHOR', 'ROLE_ADMIN'].includes(role),
          },
        },
      ],
    });
    fixture = TestBed.createComponent(SidebarNavigationLeftComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    fixture.detectChanges();
    expect(component).toBeDefined();
  });

  it('should expose groups', () => {
    fixture.detectChanges();
    const groups = component.groups();
    expect(groups).toBeDefined();
    expect(groups).toHaveLength(3);
  });

  it('should expose groups with correct structure', () => {
    fixture.detectChanges();
    const groups = component.groups();
    expect(groups[0]?.id).toBe('learning');
    expect(groups[1]?.id).toBe('tools');
    expect(groups[2]?.id).toBe('account');
  });

  it('should render learning group items', () => {
    fixture.detectChanges();
    const learningGroup = component.groups().find((g: NavGroup) => g.id === 'learning');
    expect(learningGroup).toBeDefined();
    expect(learningGroup!.items).toHaveLength(4);
    learningGroup?.items.forEach((item) => {
      expect(item.label).toBeDefined();
      expect(item.path).toBeDefined();
      expect(item.icon).toBeDefined();
    });
  });

  it('should render tools group items', () => {
    fixture.detectChanges();
    const toolsGroup = component.groups().find((g: NavGroup) => g.id === 'tools');
    expect(toolsGroup).toBeDefined();
    // «Конструктор курсов» удалён — функции перенесены в «Проводник контента».
    expect(toolsGroup!.items).toHaveLength(4);
    toolsGroup?.items.forEach((item) => {
      expect(item.label).toBeDefined();
      expect(item.path).toBeDefined();
      expect(item.icon).toBeDefined();
    });
  });

  it('should render account group items', () => {
    fixture.detectChanges();
    const accountGroup = component.groups().find((g: NavGroup) => g.id === 'account');
    expect(accountGroup).toBeDefined();
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
    expect(icons.length).toBe(9);
  });
});

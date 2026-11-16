import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatTooltipModule } from '@angular/material/tooltip';
import { describe, expect, it } from 'vitest';

import { SidebarNavigationLeftComponent } from './sidebar-navigation-left.component';
import { RoleService } from '../../entities/auth/services/role.service';
import type { NavGroup } from './sidebar-nav-config';

describe('SidebarNavigationLeftComponent', () => {
  let fixture: ComponentFixture<SidebarNavigationLeftComponent>;
  let component: SidebarNavigationLeftComponent;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        SidebarNavigationLeftComponent,
        MatDividerModule,
        MatListModule,
        MatIconModule,
        MatTooltipModule,
      ],
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
    expect(groups).toHaveLength(4);
  });

  it('should expose groups with correct structure', () => {
    fixture.detectChanges();
    const groups = component.groups();
    expect(groups[0]?.id).toBe('learning');
    expect(groups[1]?.id).toBe('tools');
    expect(groups[2]?.id).toBe('admin');
    expect(groups[3]?.id).toBe('account');
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
    // «Конструктор курсов» и «Конструктор сценариев» удалены —
    // функции перенесены в «Проводник контента».
    expect(toolsGroup!.items).toHaveLength(3);
    toolsGroup?.items.forEach((item) => {
      expect(item.label).toBeDefined();
      expect(item.path).toBeDefined();
      expect(item.icon).toBeDefined();
    });
  });

  it('should render admin group items', () => {
    fixture.detectChanges();
    const adminGroup = component.groups().find((g: NavGroup) => g.id === 'admin');
    expect(adminGroup).toBeDefined();
    expect(adminGroup!.items).toHaveLength(1);
    expect(adminGroup!.items[0].label).toBe('Админ');
    expect(adminGroup!.items[0].path).toBe('/admin');
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
    expect(dividers.length).toBe(3);
  });

  it('should render mat-icons for each item plus toggle button', () => {
    fixture.detectChanges();
    const icons = fixture.nativeElement.querySelectorAll('mat-icon');
    expect(icons.length).toBe(10); // 9 nav icons + 1 toggle icon
  });

  it('should have collapsed input defaulting to false', () => {
    fixture.detectChanges();
    expect(component.collapsed()).toBe(false);
  });

  it('should emit toggle when toggle is called', () => {
    let toggled = false;
    component.toggleChange.subscribe(() => {
      toggled = true;
    });
    component.toggleChange.emit();
    expect(toggled).toBe(true);
  });
});

describe('SidebarNavigationLeftComponent - collapsed state', () => {
  it('should apply navigation--collapsed class when collapsed is true', () => {
    @Component({
      selector: 'app-test-wrapper',
      template: `<app-sidebar-navigation-left [collapsed]="collapsed()" />`,
      imports: [
        SidebarNavigationLeftComponent,
        MatDividerModule,
        MatListModule,
        MatIconModule,
        MatTooltipModule,
      ],
    })
    class TestWrapperComponent {
      collapsed = signal(false);
    }

    TestBed.configureTestingModule({
      imports: [TestWrapperComponent],
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

    const wrapperFixture = TestBed.createComponent(TestWrapperComponent);
    const wrapper = wrapperFixture.componentInstance;
    wrapper.collapsed.set(true);
    wrapperFixture.detectChanges();

    const navList = wrapperFixture.nativeElement.querySelector('mat-nav-list');
    expect(navList.classList).toContain('navigation--collapsed');
  });
});

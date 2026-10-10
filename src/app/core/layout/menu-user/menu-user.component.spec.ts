import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { signal } from '@angular/core';
import { describe, expect, it } from 'vitest';

import { MenuUserComponent } from './menu-user.component';
import { UserStore } from '../../state';

describe('MenuUserComponent', () => {
  let fixture: ComponentFixture<MenuUserComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [MenuUserComponent, MatButtonModule, MatIconModule],
      providers: [
        provideRouter([]),
        {
          provide: UserStore,
          useValue: {
            displayName: signal('Test User'),
          },
        },
      ],
    });
    fixture = TestBed.createComponent(MenuUserComponent);
  });

  it('should create', () => {
    fixture.detectChanges();
    expect(fixture.componentInstance).toBeDefined();
  });

  it('should have displayName signal', () => {
    fixture.detectChanges();
    expect(fixture.componentInstance.displayName).toBeDefined();
  });

  it('should resolve displayName from UserStore', () => {
    fixture.detectChanges();
    expect(fixture.componentInstance.displayName()).toBe('Test User');
  });

  it('should render menu component', () => {
    fixture.detectChanges();
    const menu = fixture.nativeElement.querySelector('app-menu-user');
    expect(menu).toBeDefined();
  });
});

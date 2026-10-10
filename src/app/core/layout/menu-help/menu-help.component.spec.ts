import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { describe, expect, it } from 'vitest';

import { MenuHelpComponent } from './menu-help.component';

describe('MenuHelpComponent', () => {
  let fixture: ComponentFixture<MenuHelpComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [MenuHelpComponent, MatButtonModule, MatIconModule, MatMenuModule],
      providers: [provideRouter([])],
    });
    fixture = TestBed.createComponent(MenuHelpComponent);
  });

  it('should create', () => {
    fixture.detectChanges();
    expect(fixture.componentInstance).toBeDefined();
  });

  it('should render menu component', () => {
    fixture.detectChanges();
    const menu = fixture.nativeElement.querySelector('app-menu-help');
    expect(menu).toBeDefined();
  });
});

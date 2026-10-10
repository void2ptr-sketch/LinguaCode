import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { describe, expect, it } from 'vitest';

import { MenuToolsComponent } from './menu-tools.component';

describe('MenuToolsComponent', () => {
  let fixture: ComponentFixture<MenuToolsComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [MenuToolsComponent, MatButtonModule, MatIconModule, MatMenuModule],
      providers: [provideRouter([])],
    });
    fixture = TestBed.createComponent(MenuToolsComponent);
  });

  it('should create', () => {
    fixture.detectChanges();
    expect(fixture.componentInstance).toBeDefined();
  });

  it('should render menu component', () => {
    fixture.detectChanges();
    const menu = fixture.nativeElement.querySelector('app-menu-tools');
    expect(menu).toBeDefined();
  });
});

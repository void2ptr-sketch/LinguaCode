import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { describe, expect, it } from 'vitest';

import { MainHeaderComponent } from './main-header.component';
import { MenuCardsComponent } from '../menu-cards/menu-cards.component';
import { MenuToolsComponent } from '../menu-tools/menu-tools.component';
import { MenuHelpComponent } from '../menu-help/menu-help.component';
import { MenuUserComponent } from '../menu-user/menu-user.component';

describe('MainHeaderComponent', () => {
  let fixture: ComponentFixture<MainHeaderComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        MainHeaderComponent,
        MatToolbarModule,
        MenuCardsComponent,
        MenuToolsComponent,
        MenuHelpComponent,
        MenuUserComponent,
      ],
      providers: [provideRouter([])],
    });

    fixture = TestBed.createComponent(MainHeaderComponent);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(fixture.componentInstance).toBeDefined();
  });

  it('should render the component', () => {
    const root = fixture.nativeElement;
    expect(root.querySelector('mat-toolbar')).toBeTruthy();
  });

  it('should have mat-toolbar', () => {
    const root = fixture.nativeElement;
    expect(root.querySelector('mat-toolbar')).toBeTruthy();
  });
});

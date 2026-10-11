import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { describe, expect, it } from 'vitest';

import { HeaderComponent } from './header.component';
import { MenuCardsComponent } from '../menu-cards/menu-cards.component';
import { MenuToolsComponent } from '../menu-tools/menu-tools.component';
import { MenuHelpComponent } from '../menu-help/menu-help.component';
import { MenuUserComponent } from '../menu-user/menu-user.component';

describe('HeaderComponent', () => {
  let fixture: ComponentFixture<HeaderComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        HeaderComponent,
        MatToolbarModule,
        MenuCardsComponent,
        MenuToolsComponent,
        MenuHelpComponent,
        MenuUserComponent,
      ],
      providers: [provideRouter([])],
    });

    fixture = TestBed.createComponent(HeaderComponent);
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

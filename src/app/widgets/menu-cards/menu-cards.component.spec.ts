import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { describe, expect, it } from 'vitest';

import { MenuCardsComponent } from './menu-cards.component';

describe('MenuCardsComponent', () => {
  let fixture: ComponentFixture<MenuCardsComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [MenuCardsComponent, MatButtonModule, MatIconModule, MatMenuModule],
      providers: [provideRouter([])],
    });
    fixture = TestBed.createComponent(MenuCardsComponent);
  });

  it('should create', () => {
    fixture.detectChanges();
    expect(fixture.componentInstance).toBeDefined();
  });

  it('should have isLearningSection signal', () => {
    fixture.detectChanges();
    expect(fixture.componentInstance.isLearningSection).toBeDefined();
  });

  it('should render menu component', () => {
    fixture.detectChanges();
    const menu = fixture.nativeElement.querySelector('app-menu-cards');
    expect(menu).toBeDefined();
  });
});

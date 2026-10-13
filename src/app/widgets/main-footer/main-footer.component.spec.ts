import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatToolbarModule } from '@angular/material/toolbar';
import { describe, expect, it } from 'vitest';

import { MainFooterComponent } from './main-footer.component';

describe('MainFooterComponent', () => {
  let fixture: ComponentFixture<MainFooterComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [MainFooterComponent, MatToolbarModule],
    });
    fixture = TestBed.createComponent(MainFooterComponent);
  });

  it('should create', () => {
    fixture.detectChanges();
    expect(fixture.componentInstance).toBeDefined();
  });

  it('should render mat-toolbar', () => {
    fixture.detectChanges();
    const toolbar = fixture.nativeElement.querySelector('mat-toolbar');
    expect(toolbar).toBeDefined();
  });

  it('should render footer text', () => {
    fixture.detectChanges();
    const span = fixture.nativeElement.querySelector('span');
    expect(span?.textContent).toContain('LinguaCode');
  });

  it('should have footer class', () => {
    fixture.detectChanges();
    const toolbar = fixture.nativeElement.querySelector('mat-toolbar');
    expect(toolbar?.classList).toContain('footer');
  });
});

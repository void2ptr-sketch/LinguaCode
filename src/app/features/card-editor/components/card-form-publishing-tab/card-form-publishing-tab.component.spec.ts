import { ComponentFixture, TestBed } from '@angular/core/testing';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { CardFormPublishingTabComponent } from './card-form-publishing-tab.component';
import { CatalogService } from '../../../../entities/card/api/catalog.service';
import type { CardIndexMetaOverride } from '../../../../entities/card/model';

describe('CardFormPublishingTabComponent', () => {
  let component: CardFormPublishingTabComponent;
  let fixture: ComponentFixture<CardFormPublishingTabComponent>;

  const meta: CardIndexMetaOverride = {
    difficulty: 'beginner',
    tags: ['a'],
    requiredTier: 'FREE',
    published: true,
    slug: 'test-card',
    languagePairId: 'pair-1',
    updatedAt: '2024-01-01',
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CardFormPublishingTabComponent],
      providers: [
        {
          provide: CatalogService,
          useValue: {
            difficulties: vi.fn(() => [{ code: 'beginner', label: 'Начальный' }]),
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(CardFormPublishingTabComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('meta', meta);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeDefined();
  });

  it('should have meta input', () => {
    expect(component.meta).toBeDefined();
  });

  it('should have metaChange output', () => {
    expect(component.metaChange).toBeDefined();
  });

  it('should render editable meta fields', () => {
    const fields = fixture.nativeElement.querySelector('app-card-meta-fields');
    expect(fields).toBeTruthy();
  });

  it('should render collapsed technical information panel', () => {
    const text = fixture.nativeElement.textContent || '';
    expect(text).toContain('Техническая информация');
    const panel = fixture.nativeElement.querySelector('mat-expansion-panel');
    expect(panel).toBeTruthy();
  });

  it('should render read-only technical values', () => {
    const panel = fixture.nativeElement.querySelector('mat-expansion-panel') as HTMLElement;
    const values = Array.from(panel.querySelectorAll('input')).map(
      (input) => (input as HTMLInputElement).value,
    );
    expect(values).toContain('test-card');
    expect(values).toContain('pair-1');

    const text = fixture.nativeElement.textContent || '';
    expect(text).toContain('2024-01-01');
  });

  it('should emit metaChange', () => {
    const spy = vi.spyOn(component.metaChange, 'emit');
    const next = { ...meta, published: false };
    component.metaChange.emit(next);
    expect(spy).toHaveBeenCalledWith(next);
  });
});

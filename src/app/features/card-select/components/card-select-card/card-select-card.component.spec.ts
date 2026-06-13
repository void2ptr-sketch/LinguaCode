import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SelectCard } from '../../../../core/models';
import { CardSelectCardComponent } from './card-select-card.component';

const CARD: SelectCard = {
  id: 'c1',
  kind: 'select',
  title: 'Test',
  appearance: { theme: 'azure-blue', fontSize: 'md' },
  question: 'Question?',
  options: ['One', 'Two'],
  correctIndex: 0,
};

describe('CardSelectCardComponent', () => {
  let fixture: ComponentFixture<CardSelectCardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CardSelectCardComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(CardSelectCardComponent);
    fixture.componentRef.setInput('card', CARD);
    fixture.detectChanges();
  });

  it('should render question options', () => {
    const text = fixture.nativeElement.textContent as string;
    expect(text).toContain('Question?');
    expect(text).toContain('One');
    expect(text).toContain('Two');
  });

  it('should emit selected option', () => {
    const component = fixture.componentInstance;
    let selected: number | undefined;
    component.optionSelected.subscribe((index) => {
      selected = index;
    });

    component.selectOption(1);
    expect(selected).toBe(1);
  });
});

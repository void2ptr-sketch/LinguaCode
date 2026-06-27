import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';

import type { MemoryCard } from '../../../../core/models';
import { MemoryCardComponent } from './memory-card.component';

describe('MemoryCardComponent', () => {
  const card: MemoryCard = {
    id: 'memory-1',
    kind: 'memory',
    title: 'Пары слов',
    appearance: { theme: 'azure-blue', fontSize: 'md' },
    promptKnown: 'Сопоставьте переводы',
    pairs: [
      { known: 'Привет', learning: 'Hello' },
      { known: 'Пока', learning: 'Bye' },
    ],
  };

  let fixture: ComponentFixture<MemoryCardComponent>;
  let component: MemoryCardComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MemoryCardComponent],
      providers: [provideNoopAnimations()],
    }).compileComponents();

    fixture = TestBed.createComponent(MemoryCardComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('card', card);
    fixture.detectChanges();
  });

  it('should show all words in two visible columns', () => {
    expect(component.leftItems().map((item) => item.label)).toEqual(['Привет', 'Пока']);
    expect(component.rightItems().map((item) => item.label).sort()).toEqual(['Bye', 'Hello']);
  });

  it('should match pair when opposite column items share pairId', () => {
    const hello = component.rightItems().find((item) => item.label === 'Hello');
    const privet = component.leftItems().find((item) => item.label === 'Привет');

    expect(hello).toBeDefined();
    expect(privet).toBeDefined();

    component.selectItem(privet!);
    component.selectItem(hello!);

    expect(component.matchedPairIds()).toEqual(['0']);
    expect(component.isMatched(privet!)).toBeTrue();
    expect(component.isMatched(hello!)).toBeTrue();
  });

  it('should flash mismatch for unrelated pair and keep board open', () => {
    const bye = component.rightItems().find((item) => item.label === 'Bye');
    const privet = component.leftItems().find((item) => item.label === 'Привет');

    component.selectItem(privet!);
    component.selectItem(bye!);

    expect(component.matchedPairIds()).toEqual([]);
    expect(component.mismatchItemIds()).toEqual([privet!.id, bye!.id]);
  });

  it('should complete when all pairs are matched', () => {
    const completeSpy = jasmine.createSpy('memoryComplete');
    component.memoryComplete.subscribe(completeSpy);

    const hello = component.rightItems().find((item) => item.label === 'Hello')!;
    const bye = component.rightItems().find((item) => item.label === 'Bye')!;
    const privet = component.leftItems().find((item) => item.label === 'Привет')!;
    const poka = component.leftItems().find((item) => item.label === 'Пока')!;

    component.selectItem(privet);
    component.selectItem(hello);
    component.selectItem(poka);
    component.selectItem(bye);

    expect(component.matchedPairIds()).toEqual(['0', '1']);
    expect(completeSpy).toHaveBeenCalledWith(true);
  });
});

import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';

import type { CodeSelectCard } from '../../../core/models';
import { UserPersistence } from '../../../core/state/user.persistence';
import { UserStore } from '../../../core/state/user.store';
import { CardHostComponent } from './card-host.component';

describe('CardHostComponent', () => {
  const codeSelectCard: CodeSelectCard = {
    id: 'code-select-test-1',
    kind: 'code-select',
    title: 'Perl: вывод',
    caption: 'Что выведет этот код?',
    appearance: { theme: 'azure-blue', fontSize: 'md' },
    prompt: {
      code: 'print "Hello";',
      language: 'perl',
    },
    options: [
      { code: 'Hello', language: 'plain' },
      { code: 'print Hello', language: 'plain' },
      { code: 'undefined', language: 'plain' },
    ],
    correctIndex: 0,
  };

  let fixture: ComponentFixture<CardHostComponent>;

  beforeEach(async () => {
    localStorage.clear();

    await TestBed.configureTestingModule({
      imports: [CardHostComponent],
      providers: [provideNoopAnimations(), UserStore, UserPersistence],
    }).compileComponents();

    fixture = TestBed.createComponent(CardHostComponent);
    fixture.componentRef.setInput('card', codeSelectCard);
    fixture.detectChanges();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('should render code-select card with caption and option buttons', () => {
    const host = fixture.nativeElement as HTMLElement;

    expect(host.querySelector('app-code-select-card')).not.toBeNull();
    expect(host.textContent).toContain('Perl: вывод');
    expect(host.textContent).toContain('Что выведет этот код?');
    expect(host.querySelectorAll('.code-select-card__options button').length).toBe(3);
  });

  it('should forward option selection from code-select card', () => {
    const optionSelectedSpy = jasmine.createSpy('optionSelected');
    fixture.componentInstance.optionSelected.subscribe(optionSelectedSpy);

    const firstOption = fixture.nativeElement.querySelector(
      '.code-select-card__options button',
    ) as HTMLButtonElement;
    firstOption.click();
    fixture.detectChanges();

    expect(optionSelectedSpy).toHaveBeenCalledWith(0);
  });
});

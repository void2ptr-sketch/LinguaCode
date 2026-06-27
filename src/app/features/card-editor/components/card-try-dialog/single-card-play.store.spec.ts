import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { Card } from '../../../../core/models';
import { SingleCardPlayStore } from './single-card-play.store';

const SELECT_CARD: Card = {
  id: 'c1',
  kind: 'select',
  title: 'Test',
  appearance: { theme: 'azure-blue', fontSize: 'md' },
  direction: 'known-to-learning',
  promptKnown: 'Q?',
  optionsLearning: ['A', 'B'],
  correctIndex: 0,
};

describe('SingleCardPlayStore', () => {
  let store: SingleCardPlayStore;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [SingleCardPlayStore, provideHttpClient(), provideHttpClientTesting()],
    });
    store = TestBed.inject(SingleCardPlayStore);
    store.setCard(SELECT_CARD);
  });

  it('should check correct select answer', () => {
    store.selectOption(0);
    expect(store.checkAnswer()).toBeTrue();
    expect(store.feedback()).toBe('correct');
  });

  it('should reset interaction on try again', () => {
    store.selectOption(0);
    store.checkAnswer();
    const hostKeyBefore = store.hostKey();

    store.tryAgain();

    expect(store.feedback()).toBeNull();
    expect(store.selectedIndex()).toBeNull();
    expect(store.hostKey()).toBe(hostKeyBefore + 1);
  });

  it('should reset on direction change', () => {
    store.selectOption(0);
    store.checkAnswer();

    store.setSessionDirection('learning-to-known');

    expect(store.sessionDirection()).toBe('learning-to-known');
    expect(store.feedback()).toBeNull();
  });
});

import { buildOptionClass } from './option-card.util';

describe('buildOptionClass', () => {
  it('should always include the base option class', () => {
    expect(buildOptionClass(0, null, null, 0)).toBe('option');
  });

  it('should mark the selected option', () => {
    expect(buildOptionClass(2, 2, null, 0)).toBe('option option--selected');
  });

  it('should not mark unselected options', () => {
    expect(buildOptionClass(1, 0, null, 0)).toBe('option');
  });

  it('should mark the correct option when feedback is present', () => {
    expect(buildOptionClass(3, 1, 'correct', 3)).toBe('option option--correct');
  });

  it('should mark the incorrect option only when it was selected', () => {
    expect(buildOptionClass(1, 1, 'incorrect', 2)).toBe('option option--selected option--incorrect');
  });

  it('should not mark a wrong option that was not selected', () => {
    expect(buildOptionClass(0, 1, 'incorrect', 2)).toBe('option');
  });

  it('should combine selected and correct classes for the winning option', () => {
    expect(buildOptionClass(2, 2, 'correct', 2)).toBe('option option--selected option--correct');
  });
});

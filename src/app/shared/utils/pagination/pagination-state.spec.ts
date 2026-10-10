import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';

import { createPaginationState } from './pagination-state';

@Component({
  template: '',
  imports: [],
})
class PaginationHostComponent {
  readonly controller = createPaginationState({ initialPageSize: 5 });
  readonly count = signal(50);
  readonly items = signal(Array.from({ length: 50 }, (_, index) => index));
  readonly slice = this.controller.createSlice(this.items);

  constructor() {
    this.controller.bindItemCount(this.count);
  }
}

describe('createPaginationState', () => {
  function setup(): {
    fixture: ReturnType<typeof TestBed.createComponent<PaginationHostComponent>>;
    host: PaginationHostComponent;
  } {
    const fixture = TestBed.createComponent(PaginationHostComponent);
    fixture.detectChanges();
    return { fixture, host: fixture.componentInstance };
  }

  it('should apply default options when none are provided', () => {
    const controller = createPaginationState();

    expect(controller.pageIndex()).toBe(0);
    expect(controller.pageSize()).toBe(10);
    expect(controller.pageSizeOptions).toEqual([5, 10, 25]);
  });

  it('should apply custom options', () => {
    const controller = createPaginationState({
      initialPageSize: 25,
      pageSizeOptions: [25, 50],
    });

    expect(controller.pageSize()).toBe(25);
    expect(controller.pageSizeOptions).toEqual([25, 50]);
  });

  it('should slice the first page by default', () => {
    const { host } = setup();

    expect(host.slice()).toEqual([0, 1, 2, 3, 4]);
  });

  it('should update the slice after a page change', () => {
    const { fixture, host } = setup();

    host.controller.onPageChange({ pageIndex: 3, pageSize: 5 } as never);
    fixture.detectChanges();

    expect(host.slice()).toEqual([15, 16, 17, 18, 19]);
  });

  it('should update page size from the page event', () => {
    const { fixture, host } = setup();

    host.controller.onPageChange({ pageIndex: 0, pageSize: 25 } as never);
    fixture.detectChanges();

    expect(host.controller.pageSize()).toBe(25);
    expect(host.slice()).toEqual(Array.from({ length: 25 }, (_, index) => index));
  });

  it('should clamp the page index when the item count shrinks', () => {
    const { fixture, host } = setup();

    host.controller.onPageChange({ pageIndex: 9, pageSize: 5 } as never);
    fixture.detectChanges();

    host.count.set(8);
    host.items.set(Array.from({ length: 8 }, (_, index) => index));
    fixture.detectChanges();

    expect(host.controller.pageIndex()).toBe(1);
    expect(host.slice()).toEqual([5, 6, 7]);
  });

  it('should keep the page index when the item count allows it', () => {
    const { fixture, host } = setup();

    host.controller.onPageChange({ pageIndex: 3, pageSize: 5 } as never);
    fixture.detectChanges();

    host.count.set(20);
    fixture.detectChanges();

    expect(host.controller.pageIndex()).toBe(3);
    expect(host.slice()).toEqual([15, 16, 17, 18, 19]);
  });

  it('should not write when the page index is already clamped', () => {
    const { fixture, host } = setup();

    const before = host.controller.pageIndex();
    host.count.set(3);
    host.items.set([0, 1, 2]);
    fixture.detectChanges();

    expect(host.controller.pageIndex()).toBe(before);
    expect(host.slice()).toEqual([0, 1, 2]);
  });
});

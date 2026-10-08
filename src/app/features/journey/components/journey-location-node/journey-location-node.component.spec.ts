import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router } from '@angular/router';
import { of } from 'rxjs';
import { vi } from 'vitest';
import { JourneyLocationNodeComponent } from './journey-location-node.component';
import type { JourneyLocationNode } from '../../../../core/models/journey.types';
import { JourneyAnalyticsService } from '../../../../core/services/journey-analytics.service';

const baseNode: JourneyLocationNode = {
  id: 'n1',
  title: 'Тестовая локация',
  description: 'Описание тестовой локации',
  cardCount: 5,
  order: 1,
  status: 'available',
  contentTypes: ['theory'],
  lessonId: 'l1',
  lessonTitle: 'Урок 1',
  courseId: 'c1',
  courseTitle: 'Курс 1',
  completionPercent: 0,
  visited: false,
  favorite: false,
  blockReason: null,
  scenarioId: 's1',
};

const mockActivatedRoute = {
  snapshot: { queryParams: {} },
  queryParams: of({}),
  params: of({}),
  data: of({}),
};

const mockRouter = {
  navigate: vi.fn().mockResolvedValue(true),
};

function createComponent(node: JourneyLocationNode) {
  @Component({
    selector: 'app-wrapper',
    imports: [JourneyLocationNodeComponent],
    template: `
      <app-journey-location-node
        [node]="node"
        [selected]="selected"
        (nodeSelect)="onSelect($event)"
        (toggleFavorite)="onToggleFavorite($event)"
      />
    `,
  })
  class WrapperComponent {
    node = node;
    selected = false;
    onSelect = vi.fn();
    onToggleFavorite = vi.fn();
  }

  return { WrapperComponent };
}

describe('JourneyLocationNodeComponent', () => {
  it('should create and render available node', async () => {
    const { WrapperComponent } = createComponent(baseNode);

    await TestBed.configureTestingModule({
      imports: [WrapperComponent],
      providers: [
        { provide: ActivatedRoute, useValue: mockActivatedRoute },
        { provide: Router, useValue: mockRouter },
        {
          provide: JourneyAnalyticsService,
          useValue: {
            trackEvent: vi.fn(),
            toggleFavorite: vi.fn(),
            isFavorite: vi.fn(() => false),
          },
        },
      ],
    }).compileComponents();

    const fixture = TestBed.createComponent(WrapperComponent);
    const component = fixture.componentInstance;
    fixture.detectChanges();

    expect(component).toBeTruthy();

    const titleEl = fixture.nativeElement.querySelector('.journey-node__title');
    expect(titleEl?.textContent).toBe('Тестовая локация');

    const subtitleEl = fixture.nativeElement.querySelector('.journey-node__subtitle');
    expect(subtitleEl?.textContent).toBe('Урок 1');

    const statusIcon = fixture.nativeElement.querySelector('.journey-node__status-icon');
    expect(statusIcon).toBeTruthy();

    const contentIcon = fixture.nativeElement.querySelector('.journey-node__content-icon');
    expect(contentIcon).toBeTruthy();

    const nodeBtn = fixture.nativeElement.querySelector('.journey-node');
    expect(nodeBtn.classList.contains('journey-node--locked')).toBe(false);

    const placeholder = fixture.nativeElement.querySelector('.journey-node__placeholder');
    expect(placeholder).toBeTruthy();

    const favBtn = fixture.nativeElement.querySelector('.journey-node__fav-btn');
    favBtn.click();
    expect(component.onToggleFavorite).toHaveBeenCalledWith('n1');
  });

  it('should handle locked node', async () => {
    const lockedNode: JourneyLocationNode = { ...baseNode, status: 'locked' };
    const { WrapperComponent } = createComponent(lockedNode);

    await TestBed.configureTestingModule({
      imports: [WrapperComponent],
      providers: [
        { provide: ActivatedRoute, useValue: mockActivatedRoute },
        { provide: Router, useValue: mockRouter },
        {
          provide: JourneyAnalyticsService,
          useValue: {
            trackEvent: vi.fn(),
            toggleFavorite: vi.fn(),
            isFavorite: vi.fn(() => false),
          },
        },
      ],
    }).compileComponents();

    const fixture = TestBed.createComponent(WrapperComponent);
    fixture.detectChanges();

    const nodeBtn = fixture.nativeElement.querySelector('.journey-node');
    expect(nodeBtn.classList.contains('journey-node--locked')).toBe(true);

    const spy = vi.spyOn(fixture.componentInstance, 'onSelect');
    nodeBtn.click();
    expect(spy).not.toHaveBeenCalled();
  });

  it('should show progress spinner for in-progress status', async () => {
    const inProgressNode: JourneyLocationNode = { ...baseNode, status: 'in-progress', completionPercent: 50 };
    const { WrapperComponent } = createComponent(inProgressNode);

    await TestBed.configureTestingModule({
      imports: [WrapperComponent],
      providers: [
        { provide: ActivatedRoute, useValue: mockActivatedRoute },
        { provide: Router, useValue: mockRouter },
        {
          provide: JourneyAnalyticsService,
          useValue: {
            trackEvent: vi.fn(),
            toggleFavorite: vi.fn(),
            isFavorite: vi.fn(() => false),
          },
        },
      ],
    }).compileComponents();

    const fixture = TestBed.createComponent(WrapperComponent);
    fixture.detectChanges();

    const spinner = fixture.nativeElement.querySelector('.journey-node__spinner');
    expect(spinner).toBeTruthy();
  });

  it('should show completed class on status icon', async () => {
    const completedNode: JourneyLocationNode = { ...baseNode, status: 'completed' };
    const { WrapperComponent } = createComponent(completedNode);

    await TestBed.configureTestingModule({
      imports: [WrapperComponent],
      providers: [
        { provide: ActivatedRoute, useValue: mockActivatedRoute },
        { provide: Router, useValue: mockRouter },
        {
          provide: JourneyAnalyticsService,
          useValue: {
            trackEvent: vi.fn(),
            toggleFavorite: vi.fn(),
            isFavorite: vi.fn(() => false),
          },
        },
      ],
    }).compileComponents();

    const fixture = TestBed.createComponent(WrapperComponent);
    fixture.detectChanges();

    const statusIcon = fixture.nativeElement.querySelector('.journey-node__status-icon--completed');
    expect(statusIcon).toBeTruthy();
  });

  it('should render description when provided', async () => {
    const { WrapperComponent } = createComponent(baseNode);

    await TestBed.configureTestingModule({
      imports: [WrapperComponent],
      providers: [
        { provide: ActivatedRoute, useValue: mockActivatedRoute },
        { provide: Router, useValue: mockRouter },
        {
          provide: JourneyAnalyticsService,
          useValue: {
            trackEvent: vi.fn(),
            toggleFavorite: vi.fn(),
            isFavorite: vi.fn(() => false),
          },
        },
      ],
    }).compileComponents();

    const fixture = TestBed.createComponent(WrapperComponent);
    fixture.detectChanges();

    const descriptionEl = fixture.nativeElement.querySelector('.journey-node__description');
    expect(descriptionEl).toBeTruthy();
    expect(descriptionEl?.textContent).toBe('Описание тестовой локации');
  });

  it('should render card count badge', async () => {
    const { WrapperComponent } = createComponent(baseNode);

    await TestBed.configureTestingModule({
      imports: [WrapperComponent],
      providers: [
        { provide: ActivatedRoute, useValue: mockActivatedRoute },
        { provide: Router, useValue: mockRouter },
        {
          provide: JourneyAnalyticsService,
          useValue: {
            trackEvent: vi.fn(),
            toggleFavorite: vi.fn(),
            isFavorite: vi.fn(() => false),
          },
        },
      ],
    }).compileComponents();

    const fixture = TestBed.createComponent(WrapperComponent);
    fixture.detectChanges();

    const badgeEl = fixture.nativeElement.querySelector('.journey-node__badge');
    expect(badgeEl).toBeTruthy();
    expect(badgeEl?.textContent).toBe('5 карточек');
  });

  it('should not render description when empty', async () => {
    const nodeWithoutDescription: JourneyLocationNode = { ...baseNode, description: '' };
    const { WrapperComponent } = createComponent(nodeWithoutDescription);

    await TestBed.configureTestingModule({
      imports: [WrapperComponent],
      providers: [
        { provide: ActivatedRoute, useValue: mockActivatedRoute },
        { provide: Router, useValue: mockRouter },
        {
          provide: JourneyAnalyticsService,
          useValue: {
            trackEvent: vi.fn(),
            toggleFavorite: vi.fn(),
            isFavorite: vi.fn(() => false),
          },
        },
      ],
    }).compileComponents();

    const fixture = TestBed.createComponent(WrapperComponent);
    fixture.detectChanges();

    const descriptionEl = fixture.nativeElement.querySelector('.journey-node__description');
    expect(descriptionEl).toBeFalsy();
  });
});

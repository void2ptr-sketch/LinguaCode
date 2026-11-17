import { TestBed } from '@angular/core/testing';
import { PLATFORM_ID } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { provideRouter } from '@angular/router';
import { describe, expect, it } from 'vitest';
import { MainLayoutComponent } from './main-layout.component';

describe('MainLayoutComponent', () => {
  beforeEach(async () => {
    localStorage.clear();
    await TestBed.configureTestingModule({
      imports: [MainLayoutComponent, BrowserModule],
      providers: [
        provideRouter([]),
        {
          provide: PLATFORM_ID,
          useValue: 'browser',
        },
      ],
    }).compileComponents();
  });

  it('should create', () => {
    const fixture = TestBed.createComponent(MainLayoutComponent);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should default to false when localStorage is empty', () => {
    const fixture = TestBed.createComponent(MainLayoutComponent);
    const component = fixture.componentInstance;
    expect(component.sidebarCollapsed()).toBe(false);
  });

  it('should read initial state from localStorage', () => {
    localStorage.setItem('sidebar_collapsed', 'true');
    const fixture = TestBed.createComponent(MainLayoutComponent);
    const component = fixture.componentInstance;
    expect(component.sidebarCollapsed()).toBe(true);
  });

  it('should persist toggle state to localStorage', () => {
    const fixture = TestBed.createComponent(MainLayoutComponent);
    const component = fixture.componentInstance;
    expect(component.sidebarCollapsed()).toBe(false);
    component.toggleSidebar();
    fixture.detectChanges(); // flush effect
    expect(component.sidebarCollapsed()).toBe(true);
    expect(localStorage.getItem('sidebar_collapsed')).toBe('true');
  });

  it('should toggle correctly', () => {
    const fixture = TestBed.createComponent(MainLayoutComponent);
    const component = fixture.componentInstance;
    expect(component.sidebarCollapsed()).toBe(false);
    component.toggleSidebar();
    expect(component.sidebarCollapsed()).toBe(true);
    component.toggleSidebar();
    expect(component.sidebarCollapsed()).toBe(false);
  });
});

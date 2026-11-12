import { Component } from '@angular/core';
import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { describe, expect, it, vi, beforeEach } from 'vitest';

import { ProgramDeleteConfirmDialogComponent } from './program-delete-confirm-dialog.component';

describe('ProgramDeleteConfirmDialogComponent', () => {
  let dialog: MatDialog;
  let consoleWarnSpy: jest.SpyInstance;

  beforeEach(waitForAsync(() => {
    consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(vi.fn());
    TestBed.configureTestingModule({
      imports: [ProgramDeleteConfirmDialogComponent, MatDialogModule, MatButtonModule],
      providers: [MatDialog],
    }).compileComponents();

    dialog = TestBed.inject(MatDialog);
  }));

  afterEach(() => {
    consoleWarnSpy.mockRestore();
  });

  it('should create', () => {
    const ref = dialog.open(ProgramDeleteConfirmDialogComponent, {
      data: { programTitle: 'Test Program' },
    });
    expect(ref).toBeTruthy();
    ref.destroy();
  });

  it('should return false when cancelled', waitForAsync(() => {
    const ref = dialog.open(ProgramDeleteConfirmDialogComponent, {
      data: { programTitle: 'Test' },
    });
    ref.afterClosed().subscribe((result) => {
      expect(result).toBe(false);
      ref.destroy();
    });
    ref.close(false);
  }));

  it('should return true when confirmed', waitForAsync(() => {
    const ref = dialog.open(ProgramDeleteConfirmDialogComponent, {
      data: { programTitle: 'Test' },
    });
    ref.afterClosed().subscribe((result) => {
      expect(result).toBe(true);
      ref.destroy();
    });
    ref.close(true);
  }));
});

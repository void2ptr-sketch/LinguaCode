import { TestBed } from '@angular/core/testing';
import { MatDialog } from '@angular/material/dialog';
import { of } from 'rxjs';
import { vi } from 'vitest';

import { CourseBuilderDialogService } from './course-builder-dialog.service';
import { CourseBuilderDialogComponent } from './course-builder-dialog.component';

describe('CourseBuilderDialogService', () => {
  let service: CourseBuilderDialogService;
  let dialogOpenMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    dialogOpenMock = vi.fn().mockReturnValue({
      afterClosed: () => of(undefined),
    });

    TestBed.configureTestingModule({
      providers: [
        CourseBuilderDialogService,
        {
          provide: MatDialog,
          useValue: {
            open: dialogOpenMock,
          },
        },
      ],
    });

    service = TestBed.inject(CourseBuilderDialogService);
  });

  it('should be created', () => {
    expect(service).toBeDefined();
  });

  describe('openCreate', () => {
    it('should open dialog in create mode', async () => {
      const result = await service.openCreate();

      expect(dialogOpenMock).toHaveBeenCalledWith(CourseBuilderDialogComponent, {
        width: '48rem',
        maxWidth: '95vw',
        maxHeight: '90vh',
        data: { mode: 'create', courseId: '' },
        panelClass: 'course-builder-dialog',
      });
      expect(result).toBeUndefined();
    });
  });

  describe('openEdit', () => {
    it('should open dialog in edit mode with course ID', async () => {
      const result = await service.openEdit('course-123');

      expect(dialogOpenMock).toHaveBeenCalledWith(CourseBuilderDialogComponent, {
        width: '48rem',
        maxWidth: '95vw',
        maxHeight: '90vh',
        data: { mode: 'edit', courseId: 'course-123' },
        panelClass: 'course-builder-dialog',
      });
      expect(result).toBeUndefined();
    });
  });
});

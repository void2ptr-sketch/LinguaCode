import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { describe, expect, it, beforeEach, vi } from 'vitest';
import { ScormExportButtonComponent } from './scorm-export-button.component';
import { ScormExportService } from '../../../../entities/course/api/scorm-export.service';
import { AppLoggerService } from '../../../../shared/logger/app-logger.service';

describe('ScormExportButtonComponent', () => {
  let fixture: ComponentFixture<ScormExportButtonComponent>;
  let exportSpy: ReturnType<typeof vi.fn>;
  let errorSpy: ReturnType<typeof vi.fn>;
  let openSpy: ReturnType<typeof vi.fn>;

  const mockBundle = {
    courses: [],
    programs: [],
    lessons: [],
    scenarios: [],
    cards: [],
    xapiStatements: [],
  } as never;

  beforeEach(async () => {
    exportSpy = vi.fn();
    errorSpy = vi.fn();
    openSpy = vi.fn();

    TestBed.configureTestingModule({
      imports: [ScormExportButtonComponent, MatButtonModule, MatIconModule, MatSnackBarModule],
      providers: [
        {
          provide: ScormExportService,
          useValue: { export: exportSpy },
        },
        {
          provide: AppLoggerService,
          useValue: { error: errorSpy },
        },
        {
          provide: MatSnackBar,
          useValue: { open: openSpy },
        },
      ],
    });

    fixture = TestBed.createComponent(ScormExportButtonComponent);
    fixture.componentRef.setInput('courseId', 'course-1');
  });

  it('should create', () => {
    expect(fixture.componentInstance).toBeDefined();
  });

  it('should export successfully', async () => {
    exportSpy.mockResolvedValue(mockBundle);
    const originalCreateObjectURL = URL.createObjectURL;
    const revokeSpy = vi.spyOn(URL, 'revokeObjectURL');
    URL.createObjectURL = vi.fn(() => 'http://mock/url');

    fixture.detectChanges();
    await fixture.componentInstance.onExport();

    expect(exportSpy).toHaveBeenCalledWith('course-1');
    expect(revokeSpy).toHaveBeenCalled();
    URL.createObjectURL = originalCreateObjectURL;
  });

  it('should show error toast when export fails with Error', async () => {
    exportSpy.mockRejectedValue(new Error('Network error'));
    fixture.detectChanges();
    await fixture.componentInstance.onExport();

    expect(errorSpy).toHaveBeenCalled();
    expect(openSpy).toHaveBeenCalledWith('Ошибка экспорта в SCORM', 'Закрыть', { duration: 5000 });
  });

  it('should show generic error when export fails with non-Error', async () => {
    exportSpy.mockRejectedValue('string error');
    fixture.detectChanges();
    await fixture.componentInstance.onExport();

    expect(errorSpy).toHaveBeenCalled();
    expect(openSpy).toHaveBeenCalledWith('Ошибка экспорта в SCORM', 'Закрыть', { duration: 5000 });
  });
});

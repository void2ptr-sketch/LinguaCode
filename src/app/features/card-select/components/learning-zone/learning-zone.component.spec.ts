import { ComponentFixture, TestBed } from '@angular/core/testing';
import { LearningZoneComponent } from './learning-zone.component';

describe('LearningZoneComponent', () => {
  let component: LearningZoneComponent;
  let fixture: ComponentFixture<LearningZoneComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LearningZoneComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(LearningZoneComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

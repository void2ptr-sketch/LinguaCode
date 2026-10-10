import { ComponentFixture, TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';

import { PhoneticIpaComponent } from './phonetic-ipa.component';

describe('PhoneticIpaComponent', () => {
  let fixture: ComponentFixture<PhoneticIpaComponent>;
  let component: PhoneticIpaComponent;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [PhoneticIpaComponent],
    });
    fixture = TestBed.createComponent(PhoneticIpaComponent);
    component = fixture.componentInstance;
  });

  describe('initialization', () => {
    it('should create', () => {
      expect(component).toBeDefined();
    });

    it('should render phonetic-ipa span element', () => {
      fixture.componentRef.setInput('transcription', '/ni hao/');
      fixture.detectChanges();
      const el = fixture.nativeElement.querySelector('.phonetic-ipa');
      expect(el).toBeDefined();
    });
  });

  describe('display computed', () => {
    it('should wrap transcription in brackets when not already wrapped', () => {
      fixture.componentRef.setInput('transcription', 'ni hao');
      fixture.detectChanges();
      expect(component.display()).toBe('[ni hao]');
    });

    it('should not wrap when transcription already starts with bracket', () => {
      fixture.componentRef.setInput('transcription', '[ni hao]');
      fixture.detectChanges();
      expect(component.display()).toBe('[ni hao]');
    });

    it('should not wrap when transcription already starts with slash', () => {
      fixture.componentRef.setInput('transcription', '/ni hao/');
      fixture.detectChanges();
      expect(component.display()).toBe('/ni hao/');
    });

    it('should return empty string when transcription is empty', () => {
      fixture.componentRef.setInput('transcription', '');
      fixture.detectChanges();
      expect(component.display()).toBe('');
    });

    it('should trim whitespace from transcription', () => {
      fixture.componentRef.setInput('transcription', '  ni hao  ');
      fixture.detectChanges();
      expect(component.display()).toBe('[ni hao]');
    });

    it('should return empty string when transcription is whitespace only', () => {
      fixture.componentRef.setInput('transcription', '   ');
      fixture.detectChanges();
      expect(component.display()).toBe('');
    });
  });

  describe('inline mode', () => {
    it('should not apply inline class when inline is false', () => {
      fixture.componentRef.setInput('transcription', '/ni hao/');
      fixture.componentRef.setInput('inline', false);
      fixture.detectChanges();
      const el = fixture.nativeElement.querySelector('.phonetic-ipa');
      expect(el?.classList).not.toContain('phonetic-ipa--inline');
    });

    it('should apply inline class when inline is true', () => {
      fixture.componentRef.setInput('transcription', '/ni hao/');
      fixture.componentRef.setInput('inline', true);
      fixture.detectChanges();
      const el = fixture.nativeElement.querySelector('.phonetic-ipa');
      expect(el?.classList).toContain('phonetic-ipa--inline');
    });
  });

  describe('template rendering', () => {
    it('should render the display value inside span', () => {
      fixture.componentRef.setInput('transcription', 'ni hao');
      fixture.detectChanges();
      const el = fixture.nativeElement.querySelector('.phonetic-ipa');
      expect(el?.textContent).toBe('[ni hao]');
    });

    it('should render slash-wrapped transcription as-is', () => {
      fixture.componentRef.setInput('transcription', '/ni hao/');
      fixture.detectChanges();
      const el = fixture.nativeElement.querySelector('.phonetic-ipa');
      expect(el?.textContent).toBe('/ni hao/');
    });
  });
});

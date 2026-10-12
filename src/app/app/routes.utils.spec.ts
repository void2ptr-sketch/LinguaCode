import { describe, it, expect } from 'vitest';

import { mergeRoutes } from './routes.utils';
import type { Routes } from '@angular/router';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mockComponent = (route: string): any => ({ name: `MockComponent_${route}` });

describe('routes.utils', () => {
  describe('mergeRoutes', () => {
    it('should return empty array for no arguments', () => {
      const result = mergeRoutes();
      expect(result).toEqual([]);
    });

    it('should return a single config as-is', () => {
      const config: Routes = [
        { path: 'home', loadComponent: () => mockComponent('home') },
      ];
      const result = mergeRoutes(config);
      expect(result).toEqual(config);
    });

    it('should flatten and merge two route configs', () => {
      const configA: Routes = [
        { path: 'home', loadComponent: () => mockComponent('home') },
        { path: 'about', loadComponent: () => mockComponent('about') },
      ];
      const configB: Routes = [
        { path: 'contact', loadComponent: () => mockComponent('contact') },
      ];

      const result = mergeRoutes(configA, configB);

      expect(result).toHaveLength(3);
      expect(result[0]!.path).toBe('home');
      expect(result[1]!.path).toBe('about');
      expect(result[2]!.path).toBe('contact');
    });

    it('should flatten and merge multiple route configs', () => {
      const configA: Routes = [
        { path: 'a', loadComponent: () => mockComponent('a') },
      ];
      const configB: Routes = [
        { path: 'b', loadComponent: () => mockComponent('b') },
      ];
      const configC: Routes = [
        { path: 'c', loadComponent: () => mockComponent('c') },
      ];

      const result = mergeRoutes(configA, configB, configC);

      expect(result).toHaveLength(3);
      expect(result[0]!.path).toBe('a');
      expect(result[1]!.path).toBe('b');
      expect(result[2]!.path).toBe('c');
    });

    it('should handle empty config arrays', () => {
      const configA: Routes = [
        { path: 'a', loadComponent: () => mockComponent('a') },
      ];
      const configB: Routes = [];

      const result = mergeRoutes(configA, configB);

      expect(result).toHaveLength(1);
      expect(result).toEqual(configA);
    });

    it('should preserve route order', () => {
      const configA: Routes = [
        { path: 'first', loadComponent: () => mockComponent('first') },
        { path: 'second', loadComponent: () => mockComponent('second') },
      ];
      const configB: Routes = [
        { path: 'third', loadComponent: () => mockComponent('third') },
      ];

      const result = mergeRoutes(configA, configB);

      expect(result[0]!.path).toBe('first');
      expect(result[1]!.path).toBe('second');
      expect(result[2]!.path).toBe('third');
    });

    it('should handle configs with nested route objects', () => {
      const configA: Routes = [
        {
          path: 'admin',
          children: [
            { path: 'users', loadComponent: () => mockComponent('users') },
          ],
        },
      ];
      const configB: Routes = [
        { path: 'home', loadComponent: () => mockComponent('home') },
      ];

      const result = mergeRoutes(configA, configB);

      expect(result).toHaveLength(2);
      expect(result[0]).toEqual(configA[0]);
      expect(result[1]).toEqual(configB[0]);
    });
  });
});

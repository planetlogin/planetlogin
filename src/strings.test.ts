import { describe, it, expect } from 'vitest';
import { labelsFor, LANGUAGES, type PlanetLoginLabels } from './strings';

const CLAVES: (keyof PlanetLoginLabels)[] = ['placeholder', 'searchAria', 'locate', 'locateAria', 'globeAria'];

describe('labelsFor', () => {
  it('traduce al idioma pedido', () => {
    expect(labelsFor('es').placeholder).toBe('Código postal, ciudad o país…');
    expect(labelsFor('es').locate).toBe('Localizar');
    expect(labelsFor('fr').locate).toBe('Localiser');
    expect(labelsFor('ja').placeholder).toContain('郵便番号');
  });

  it('acepta la etiqueta completa que da el navegador', () => {
    // navigator.language devuelve «es-ES», no «es».
    expect(labelsFor('es-ES').locate).toBe('Localizar');
    expect(labelsFor('pt-BR').locate).toBe('Localizar');
    expect(labelsFor('EN-GB').locate).toBe('Locate');
  });

  it('cae al inglés entero cuando el idioma no está', () => {
    const kl = labelsFor('kl'); // groenlandés
    expect(kl).toEqual(labelsFor('en'));
    expect(kl.locate).toBe('Locate');
  });

  it('sin idioma habla inglés', () => {
    expect(labelsFor().locate).toBe('Locate');
    expect(labelsFor('').locate).toBe('Locate');
  });

  it('deja sobreescribir una cadena suelta sin perder las demás', () => {
    const l = labelsFor('es', { locate: 'Ir' });
    expect(l.locate).toBe('Ir');
    expect(l.placeholder).toBe('Código postal, ciudad o país…');
  });

  it('ningún idioma se deja una cadena a medias', () => {
    // El componente escribe las cinco siempre: una ausencia saldria como
    // `undefined` en pantalla, no como el ingles.
    for (const lang of LANGUAGES) {
      const l = labelsFor(lang);
      for (const k of CLAVES) {
        expect(typeof l[k], `${lang}.${k}`).toBe('string');
        expect(l[k].length, `${lang}.${k}`).toBeGreaterThan(0);
      }
    }
  });

  it('cada idioma traduce de verdad, no copia el inglés', () => {
    const en = labelsFor('en');
    for (const lang of LANGUAGES.filter((l) => l !== 'en')) {
      const l = labelsFor(lang);
      expect(l.locate === en.locate && l.placeholder === en.placeholder, lang).toBe(false);
    }
  });

  it('la descripción del globo dice cómo manejarlo, no solo qué es', () => {
    // Es lo unico que oye quien no ve la pantalla: sin las teclas no sirve.
    for (const lang of LANGUAGES) {
      expect(labelsFor(lang).globeAria.length, lang).toBeGreaterThan(60);
    }
  });
});

/**
 * __tests__/languageContext.test.ts
 *
 * L10N-03: LanguageContext always exposes lang='en' and setLang is a no-op
 * (English-only app — multi-language support removed).
 */

jest.mock('react-native-mmkv', () => ({
  MMKV: jest.fn().mockImplementation(() => ({
    getString: jest.fn(() => undefined),
    getBoolean: jest.fn(() => false),
    set: jest.fn(),
  })),
}));

jest.mock('expo-localization', () => ({
  getLocales: jest.fn(() => [{ languageCode: 'en' }]),
}));

jest.mock('react-i18next', () => ({
  useTranslation: jest.fn(() => ({
    t: (key: string) => key,
    i18n: {
      language: 'en',
      changeLanguage: jest.fn(),
    },
  })),
  initReactI18next: {
    type: '3rdParty',
    init: jest.fn(),
  },
}));

// Must import after mocks
import React from 'react';
import { renderHook, act } from '@testing-library/react-native';

describe('LanguageContext', () => {
  it('lang is always "en"', async () => {
    const { LanguageProvider, useLanguage } = require('@/context/LanguageContext');

    const wrapper = ({ children }: { children: React.ReactNode }) =>
      React.createElement(LanguageProvider, null, children);

    const { result } = renderHook(() => useLanguage(), { wrapper });

    expect(result.current.lang).toBe('en');
  });

  it('setLang is a no-op and does not throw', async () => {
    const { LanguageProvider, useLanguage } = require('@/context/LanguageContext');

    const wrapper = ({ children }: { children: React.ReactNode }) =>
      React.createElement(LanguageProvider, null, children);

    const { result } = renderHook(() => useLanguage(), { wrapper });

    await act(async () => {
      result.current.setLang('en');
    });

    expect(result.current.lang).toBe('en');
  });
});

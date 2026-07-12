import {
  getConsentPreferences,
  saveConsentPreferences,
} from '../lib/consent';
import { Prefs } from '../store/mmkv';

jest.mock('../store/mmkv', () => ({
  Prefs: {
    getBool: jest.fn(() => false),
    setBool: jest.fn(),
  },
}));

jest.mock('../lib/mixpanel', () => ({
  optInMixpanel: jest.fn(),
  optOutMixpanel: jest.fn(),
}));

describe('AiConsentGate consent logic', () => {
  beforeEach(() => jest.clearAllMocks());

  it('saveConsentPreferences stores aiProcessing=true', () => {
    const prefs = { analytics: false, crashReport: false, aiProcessing: false };
    saveConsentPreferences({ ...prefs, aiProcessing: true });

    expect(Prefs.setBool).toHaveBeenCalledWith('gdpr_consent_ai_processing', true);
    expect(Prefs.setBool).toHaveBeenCalledWith('gdpr_consent_given', true);
  });

  it('getConsentPreferences returns aiProcessing=false by default', () => {
    (Prefs.getBool as jest.Mock).mockReturnValue(false);
    const prefs = getConsentPreferences();
    expect(prefs.aiProcessing).toBe(false);
  });

  it('getConsentPreferences returns aiProcessing=true when stored', () => {
    (Prefs.getBool as jest.Mock).mockImplementation((key: string) =>
      key === 'gdpr_consent_ai_processing' ? true : false,
    );
    const prefs = getConsentPreferences();
    expect(prefs.aiProcessing).toBe(true);
  });
});

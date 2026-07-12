// lib/onesignal.test.ts
import { filterAllowedTags } from './onesignal';

describe('filterAllowedTags', () => {
  it('keeps allowed tags including is_pro and trial_status', () => {
    expect(filterAllowedTags({ is_pro: 'true', trial_status: 'trial', language: 'en' }))
      .toEqual({ is_pro: 'true', trial_status: 'trial', language: 'en' });
  });
  it('drops unknown tags', () => {
    expect(filterAllowedTags({ is_pro: 'true', secret_mood: 'sad' } as any))
      .toEqual({ is_pro: 'true' });
  });
  it('omits undefined values', () => {
    expect(filterAllowedTags({ is_pro: undefined, trial_status: 'active' }))
      .toEqual({ trial_status: 'active' });
  });
});

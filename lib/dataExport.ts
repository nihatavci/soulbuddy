/**
 * lib/dataExport.ts — GDPR Data Export (Article 20)
 *
 * Exports all user data as a JSON file that can be shared.
 * Uses expo-file-system + expo-sharing for the download flow.
 */

import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { supabase } from '@/services/supabase';
import { getConsentPreferences, getCcpaDoNotSell } from '@/lib/consent';

export interface DataExportResult {
  success: boolean;
  error?: string;
}

/**
 * Export all user data as a JSON file and open the share sheet.
 * Collects: profile, sessions, messages, mood entries, consent preferences.
 */
export async function exportUserData(userId: string): Promise<DataExportResult> {
  try {
    // Collect data from Supabase
    const [profileRes, sessionsRes, messagesRes, moodRes] = await Promise.all([
      supabase.from('profiles').select('*').eq('id', userId).maybeSingle(),
      supabase.from('conversation_sessions').select('*').eq('user_id', userId),
      supabase.from('messages').select('*').eq('user_id', userId),
      supabase.from('mood_entries').select('*').eq('user_id', userId),
    ]);

    const exportData = {
      exportDate: new Date().toISOString(),
      userId,
      profile: profileRes.data ?? null,
      conversationSessions: sessionsRes.data ?? [],
      messages: messagesRes.data ?? [],
      moodEntries: moodRes.data ?? [],
      consentPreferences: getConsentPreferences(),
      ccpaDoNotSell: getCcpaDoNotSell(),
    };

    // Write to temp file
    const fileName = `myapp-data-export-${Date.now()}.json`;
    const filePath = `${FileSystem.cacheDirectory}${fileName}`;
    await FileSystem.writeAsStringAsync(filePath, JSON.stringify(exportData, null, 2));

    // Open share sheet
    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(filePath, {
        mimeType: 'application/json',
        dialogTitle: 'Export Your Data',
        UTI: 'public.json',
      });
    }

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message ?? 'Export failed' };
  }
}

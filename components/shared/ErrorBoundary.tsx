import React from "react";
import { ErrorBoundary as ReactErrorBoundary, type FallbackProps } from "react-error-boundary";
import { View, Text, StyleSheet, Pressable, Platform } from "react-native";
import * as Updates from "expo-updates";
import { captureError } from "@/lib/sentry";
import i18n from "@/i18n";

function ErrorFallback({ error, resetErrorBoundary }: FallbackProps) {
  const errorMessage = error instanceof Error ? error.message : String(error);
  const stack = error instanceof Error ? (error.stack ?? '') : '';

  const handleRestart = async () => {
    try {
      // In production, reload the JS bundle to fully restart the app
      if (!__DEV__) {
        await Updates.reloadAsync();
      }
    } catch {
      // If Updates.reloadAsync fails (e.g. updates disabled), fall through
    }
    // Fallback: reset the error boundary (re-mounts the component tree)
    resetErrorBoundary();
  };

  return (
    <View style={[styles.container, __DEV__ && styles.containerDev]}>
      <View style={styles.content}>
        <Text style={styles.logo}>myapp</Text>
        <Text style={[styles.title, __DEV__ && styles.titleDev]}>{i18n.t('errors.somethingWrong')}</Text>
        <Text style={styles.subtitle}>
          {i18n.t('errors.crashBody')}
        </Text>

        {__DEV__ && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorTitle}>Error (dev only)</Text>
            <Text style={styles.errorText}>
              {errorMessage}
            </Text>
            {!!stack && (
              <Text style={[styles.errorText, { marginTop: 8, fontSize: 10, opacity: 0.7 }]}>
                {stack.slice(0, 600)}
              </Text>
            )}
          </View>
        )}

        <Pressable style={styles.primaryButton} onPress={resetErrorBoundary}>
          <Text style={styles.primaryButtonText}>{i18n.t('common.tryAgain')}</Text>
        </Pressable>

        <Pressable style={styles.secondaryButton} onPress={handleRestart}>
          <Text style={styles.secondaryButtonText}>{i18n.t('errors.restartApp')}</Text>
        </Pressable>
      </View>
    </View>
  );
}

interface ErrorBoundaryProps {
  children: React.ReactNode;
}

export function ErrorBoundary({ children }: ErrorBoundaryProps) {
  return (
    <ReactErrorBoundary
      FallbackComponent={ErrorFallback}
      onReset={() => {
        // Reset any state that caused the error
      }}
      onError={(error, info) => {
        // Report to Sentry — never includes health data (stripped in lib/sentry.ts)
        captureError(error instanceof Error ? error : new Error(String(error)), {
          componentStack: info?.componentStack ?? undefined,
        });
        console.error("ErrorBoundary caught:", error, info);
      }}
    >
      {children}
    </ReactErrorBoundary>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  containerDev: {
    backgroundColor: "#fff0f0",  // light red tint in dev — easy to spot
  },
  content: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  logo: {
    fontSize: 28,
    fontWeight: "700",
    color: "#1a1a1a",
    letterSpacing: 1,
    marginBottom: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: "600",
    color: "#1a1a1a",
    marginBottom: 8,
  },
  titleDev: {
    color: "#cc0000",
  },
  subtitle: {
    fontSize: 15,
    color: "#666",
    marginBottom: 28,
    textAlign: "center",
    lineHeight: 22,
    maxWidth: 300,
  },
  errorContainer: {
    backgroundColor: "#f5f5f5",
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    width: "100%",
    maxWidth: 400,
  },
  errorTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#666",
    marginBottom: 8,
  },
  errorText: {
    fontSize: 12,
    color: "#333",
    fontFamily: Platform.select({ ios: "Menlo", android: "monospace", default: "monospace" }),
  },
  primaryButton: {
    backgroundColor: "#1a1a1a",
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 32,
    width: "100%",
    maxWidth: 280,
    alignItems: "center",
    marginBottom: 12,
  },
  primaryButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  secondaryButton: {
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 32,
    width: "100%",
    maxWidth: 280,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.1)",
  },
  secondaryButtonText: {
    color: "#666",
    fontSize: 16,
    fontWeight: "500",
  },
});

import React from "react";
import { View, Text } from "react-native";

interface EmptyStateProps {
  title: string;
  message?: string;
  icon?: React.ReactNode;
}

/**
 * EmptyState component for displaying empty states in lists or views
 */
export function EmptyState({ title, message, icon }: EmptyStateProps) {
  return (
    <View className="flex-1 items-center justify-center p-8">
      {icon && <View className="mb-4">{icon}</View>}
      <Text className="text-xl font-semibold text-foreground mb-2">{title}</Text>
      {message && <Text className="text-base text-default-600 text-center">{message}</Text>}
    </View>
  );
}

'use client';

import { Group, Text } from '@mantine/core';

export type AlertItem = {
  room: string;
  message: string;
  ts: string;
};

type AlertBannerProps = {
  alert?: AlertItem;
};

function roomLabel(room: string) {
  return room
    .split('-')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

function formatTime(ts: string) {
  try {
    return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  } catch {
    return '';
  }
}

export function AlertBanner({ alert }: AlertBannerProps) {
  if (!alert) return null;

  return (
    <div className="alertBanner" role="alert" aria-live="assertive">
      <Group justify="space-between" align="center" px="lg" py="sm" wrap="nowrap">
        <Group gap="sm" align="center" wrap="nowrap">
          <span style={{ fontSize: '1.25rem', flexShrink: 0 }}>🔥</span>
          <div>
            <Text size="xs" fw={700} c="red.3" style={{ letterSpacing: '0.08em', textTransform: 'uppercase' }}>
              Alert — {roomLabel(alert.room)}
            </Text>
            <Text fw={600} c="red.1" size="sm">
              {alert.message}
            </Text>
          </div>
        </Group>
        <Text size="xs" c="dimmed" style={{ flexShrink: 0, fontVariantNumeric: 'tabular-nums' }}>
          {formatTime(alert.ts)}
        </Text>
      </Group>
    </div>
  );
}

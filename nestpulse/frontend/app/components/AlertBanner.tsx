'use client';

import { Alert } from '@mantine/core';

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

export function AlertBanner({ alert }: AlertBannerProps) {
  if (!alert) {
    return null;
  }

  return (
    <Alert color="red" radius="sm" className="alertBanner">
      <strong>{roomLabel(alert.room)}</strong> {alert.message}
    </Alert>
  );
}

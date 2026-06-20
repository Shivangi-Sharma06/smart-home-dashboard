'use client';

import { Card, Group, Progress, Stack, Text, Title } from '@mantine/core';

export type SensorType = 'temperature' | 'humidity' | 'motion';

type SensorCardProps = {
  room: string;
  type: SensorType;
  value: number | boolean | null;
  unit?: string;
};

const titles: Record<SensorType, string> = {
  temperature: 'Temperature',
  humidity: 'Humidity',
  motion: 'Motion',
};

function formatTemperatureUnit(unit?: string) {
  return unit === 'C' ? '°C' : unit ?? '°C';
}

function formatRoom(room: string) {
  return room
    .split('-')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

export function SensorCard({ room, type, value, unit }: SensorCardProps) {
  const isTemperature = type === 'temperature';
  const isHumidity = type === 'humidity';
  const isMotion = type === 'motion';
  const temperatureValue = typeof value === 'number' ? value : null;
  const isHot = isTemperature && temperatureValue !== null && temperatureValue > 35;
  const motionDetected = isMotion && value === true;

  return (
    <Card radius="sm" className="sensorCard">
      <Stack gap="md" h="100%" justify="space-between">
        <Group justify="space-between" align="flex-start" wrap="nowrap">
          <div>
            <Text size="xs" c="dimmed" tt="uppercase" fw={700}>
              {formatRoom(room)}
            </Text>
            <Title order={3}>{titles[type]}</Title>
          </div>
          {isMotion && (
            <span
              className={motionDetected ? 'motionDot motionDotActive' : 'motionDot'}
              aria-label={motionDetected ? 'Motion detected' : 'No motion'}
            />
          )}
        </Group>

        {isTemperature && (
          <Text className={isHot ? 'sensorValue hotValue' : 'sensorValue'}>
            {temperatureValue === null ? '--' : temperatureValue.toFixed(1)}
            <span>{formatTemperatureUnit(unit)}</span>
          </Text>
        )}

        {isHumidity && (
          <Stack gap="xs">
            <Text className="sensorValue">
              {typeof value === 'number' ? value.toFixed(1) : '--'}
              <span>%</span>
            </Text>
            <Progress
              value={typeof value === 'number' ? value : 0}
              color="nestBlue.6"
              radius="xs"
              size="lg"
            />
          </Stack>
        )}

        {isMotion && (
          <Text className="motionLabel" c={motionDetected ? 'green.4' : 'dimmed'}>
            {motionDetected ? 'Detected' : 'Clear'}
          </Text>
        )}
      </Stack>
    </Card>
  );
}

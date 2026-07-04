'use client';

import { Card, Group, Progress, Stack, Text } from '@mantine/core';

export type SensorType = 'temperature' | 'humidity' | 'motion';

type SensorCardProps = {
  room: string;
  type: SensorType;
  value: number | boolean | null;
  unit?: string;
};

const ICONS: Record<SensorType, string> = {
  temperature: '🌡️',
  humidity: '💧',
  motion: '👁️',
};

const TITLES: Record<SensorType, string> = {
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

function getTemperatureClass(value: number | null): string {
  if (value === null) return 'noDataValue';
  if (value > 35) return 'sensorValue hotValue';
  if (value < 18) return 'sensorValue coldValue';
  return 'sensorValue';
}

export function SensorCard({ room, type, value, unit }: SensorCardProps) {
  const isTemperature = type === 'temperature';
  const isHumidity = type === 'humidity';
  const isMotion = type === 'motion';

  const temperatureValue = typeof value === 'number' ? value : null;
  const isHot = isTemperature && temperatureValue !== null && temperatureValue > 35;
  const motionDetected = isMotion && value === true;

  // Humidity bar color
  const humidityNum = typeof value === 'number' ? value : 0;
  const humidityBarColor = humidityNum > 70 ? 'nestBlue.3' : humidityNum > 50 ? 'nestCyan.5' : 'nestCyan.4';

  return (
    <Card
      radius="md"
      p="lg"
      className="sensorCard"
      data-type={type}
    >
      <Stack gap="md" h="100%" justify="space-between">
        {/* Header */}
        <Group justify="space-between" align="flex-start" wrap="nowrap">
          <Stack gap={2}>
            <Text className="roomName">{formatRoom(room)}</Text>
            <Text className="sensorTypeTitle">{TITLES[type]}</Text>
          </Stack>
          <div className={`sensorIcon sensorIcon-${type}`}>
            {ICONS[type]}
          </div>
        </Group>

        {/* Temperature */}
        {isTemperature && (
          <Stack gap={4}>
            <Text className={temperatureValue === null ? 'noDataValue' : getTemperatureClass(temperatureValue)}>
              {temperatureValue === null ? '—' : temperatureValue.toFixed(1)}
              {temperatureValue !== null && <span>{formatTemperatureUnit(unit)}</span>}
            </Text>
            {isHot && (
              <Text size="xs" fw={600} c="red.4" style={{ letterSpacing: '0.04em' }}>
                ⚠ HIGH TEMPERATURE ALERT
              </Text>
            )}
          </Stack>
        )}

        {/* Humidity */}
        {isHumidity && (
          <Stack gap={8}>
            <Text className={typeof value === 'number' ? 'sensorValue humidityValue' : 'noDataValue'}>
              {typeof value === 'number' ? value.toFixed(1) : '—'}
              {typeof value === 'number' && <span>%</span>}
            </Text>
            <Progress
              value={typeof value === 'number' ? value : 0}
              color={humidityBarColor}
              radius="xl"
              size={8}
              className="humidityBar"
            />
            {typeof value === 'number' && (
              <Text size="xs" c="dimmed" fw={500}>
                {value < 30 ? 'Dry' : value < 50 ? 'Comfortable' : value < 70 ? 'Humid' : 'Very Humid'}
              </Text>
            )}
          </Stack>
        )}

        {/* Motion */}
        {isMotion && (
          <Stack gap={8}>
            <Group gap="xs" align="center">
              <span
                className={motionDetected ? 'motionDot motionDotActive' : 'motionDot'}
                aria-label={motionDetected ? 'Motion detected' : 'No motion'}
              />
              <Text
                className={`motionLabel ${
                  value === null ? '' : motionDetected ? 'motionLabelActive' : 'motionLabelInactive'
                }`}
              >
                {value === null ? '—' : motionDetected ? 'Detected' : 'Clear'}
              </Text>
            </Group>
            {value !== null && (
              <Text size="xs" fw={500} c={motionDetected ? 'green.5' : 'dimmed'}>
                {motionDetected ? 'Movement in progress' : 'No activity'}
              </Text>
            )}
          </Stack>
        )}
      </Stack>
    </Card>
  );
}

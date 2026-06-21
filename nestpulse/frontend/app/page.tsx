'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { AppShell, Badge, Box, Container, Group, SimpleGrid, Stack, Text, Title } from '@mantine/core';
import { AlertBanner, type AlertItem } from './components/AlertBanner';
import { RoomFilter, type RoomFilterValue } from './components/RoomFilter';
import { SensorCard } from './components/SensorCard';

type SensorReadings = {
  temperature: { value: number; unit: string } | null;
  humidity: { value: number } | null;
  motion: { detected: boolean } | null;
};

type NestPulseState = {
  rooms: Record<string, SensorReadings>;
  alerts: AlertItem[];
};

const initialState: NestPulseState = {
  rooms: {
    'living-room': { temperature: null, humidity: null, motion: null },
    bedroom: { temperature: null, humidity: null, motion: null },
    kitchen: { temperature: null, humidity: null, motion: null },
  },
  alerts: [],
};

function websocketUrl() {
  if (process.env.NEXT_PUBLIC_WS_URL) {
    return process.env.NEXT_PUBLIC_WS_URL;
  }

  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  return `${protocol}//${window.location.hostname}:8000/ws`;
}

function isNestPulseState(value: unknown): value is NestPulseState {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const candidate = value as Partial<NestPulseState>;
  return Boolean(candidate.rooms && typeof candidate.rooms === 'object' && Array.isArray(candidate.alerts));
}

export default function Home() {
  const socketRef = useRef<WebSocket | null>(null);
  const reconnectTimerRef = useRef<number | null>(null);
  const [connected, setConnected] = useState(false);
  const [state, setState] = useState<NestPulseState>(initialState);
  const [filter, setFilter] = useState<RoomFilterValue>('all');

  useEffect(() => {
    let shouldReconnect = true;

    const connect = () => {
      const socket = new WebSocket(websocketUrl());
      socketRef.current = socket;

      socket.onopen = () => setConnected(true);
      socket.onclose = () => {
        setConnected(false);
        socketRef.current = null;
        if (shouldReconnect) {
          reconnectTimerRef.current = window.setTimeout(connect, 1500);
        }
      };
      socket.onerror = () => setConnected(false);
      socket.onmessage = (event) => {
        try {
          const nextState: unknown = JSON.parse(event.data);
          if (isNestPulseState(nextState)) {
            setState(nextState);
          }
        } catch {
          setConnected(false);
        }
      };
    };

    connect();

    return () => {
      shouldReconnect = false;
      if (reconnectTimerRef.current !== null) {
        window.clearTimeout(reconnectTimerRef.current);
      }
      socketRef.current?.close();
      socketRef.current = null;
    };
  }, []);

  const visibleRooms = useMemo(() => {
    const entries = Object.entries(state.rooms);
    if (filter === 'all') {
      return entries;
    }
    return entries.filter(([room]) => room === filter);
  }, [filter, state.rooms]);

  const latestAlert = state.alerts.at(-1);

  return (
    <AppShell header={{ height: 72 }} padding="md" className="appShell">
      <AppShell.Header className="topNav">
        <Container size="xl" h="100%">
          <Group h="100%" justify="space-between">
            <Group gap="sm">
              <Box className="logoMark" />
              <Title order={1}>NestPulse</Title>
            </Group>
            <Badge color={connected ? 'green' : 'red'} variant="light" radius="xs" size="lg">
              {connected ? 'Connected' : 'Disconnected'}
            </Badge>
          </Group>
        </Container>
      </AppShell.Header>

      <AppShell.Main>
        <Container size="xl" py="xl">
          <Stack gap="xl">
            <Group justify="space-between" align="flex-end">
              <div>
                <Text c="dimmed" size="sm" fw={700} tt="uppercase">
                  Live telemetry
                </Text>
                <Title order={2}>SmartHome rooms</Title>
              </div>
              <Box className="filterWrap">
                <RoomFilter value={filter} onChange={setFilter} />
              </Box>
            </Group>

            <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing="md">
              {visibleRooms.flatMap(([room, readings]) => [
                <SensorCard
                  key={`${room}-temperature`}
                  room={room}
                  type="temperature"
                  value={readings.temperature?.value ?? null}
                  unit={readings.temperature?.unit ?? 'C'}
                />,
                <SensorCard
                  key={`${room}-humidity`}
                  room={room}
                  type="humidity"
                  value={readings.humidity?.value ?? null}
                />,
                <SensorCard
                  key={`${room}-motion`}
                  room={room}
                  type="motion"
                  value={readings.motion?.detected ?? null}
                />,
              ])}
            </SimpleGrid>
          </Stack>
        </Container>
        <AlertBanner alert={latestAlert} />
      </AppShell.Main>
    </AppShell>
  );
}

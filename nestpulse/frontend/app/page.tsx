'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { AppShell, Box, Container, Group, SimpleGrid, Stack, Text, Title } from '@mantine/core';
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
    bedroom:       { temperature: null, humidity: null, motion: null },
    kitchen:       { temperature: null, humidity: null, motion: null },
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
  if (!value || typeof value !== 'object') return false;
  const candidate = value as Partial<NestPulseState>;
  return Boolean(candidate.rooms && typeof candidate.rooms === 'object' && Array.isArray(candidate.alerts));
}

/** Derive live stats from state for the top pill bar */
function computeStats(rooms: Record<string, SensorReadings>) {
  const readings = Object.values(rooms);
  const temps = readings.map((r) => r.temperature?.value).filter((v): v is number => v != null);
  const humids = readings.map((r) => r.humidity?.value).filter((v): v is number => v != null);
  const motionActive = readings.filter((r) => r.motion?.detected === true).length;
  const avgTemp = temps.length ? temps.reduce((a, b) => a + b, 0) / temps.length : null;
  const avgHumid = humids.length ? humids.reduce((a, b) => a + b, 0) / humids.length : null;
  return { avgTemp, avgHumid, motionActive };
}

export default function Home() {
  const [mounted, setMounted] = useState(false);
  const socketRef = useRef<WebSocket | null>(null);
  const reconnectTimerRef = useRef<number | null>(null);
  const [connected, setConnected] = useState(false);
  const [state, setState] = useState<NestPulseState>(initialState);
  const [filter, setFilter] = useState<RoomFilterValue>('all');
  const [updateCount, setUpdateCount] = useState(0);

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    if (!mounted) return undefined;

    let shouldReconnect = true;

    const connect = () => {
      const socket = new WebSocket(websocketUrl());
      socketRef.current = socket;

      socket.onopen  = () => setConnected(true);
      socket.onclose = () => {
        setConnected(false);
        socketRef.current = null;
        if (shouldReconnect) {
          reconnectTimerRef.current = window.setTimeout(connect, 1500);
        }
      };
      socket.onerror   = () => setConnected(false);
      socket.onmessage = (event) => {
        try {
          const nextState: unknown = JSON.parse(event.data);
          if (isNestPulseState(nextState)) {
            setState(nextState);
            setUpdateCount((c) => c + 1);
          }
        } catch {
          /* ignore parse errors */
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
  }, [mounted]);

  const visibleRooms = useMemo(() => {
    const entries = Object.entries(state.rooms);
    if (filter === 'all') return entries;
    return entries.filter(([room]) => room === filter);
  }, [filter, state.rooms]);

  const { avgTemp, avgHumid, motionActive } = useMemo(() => computeStats(state.rooms), [state.rooms]);
  const latestAlert = state.alerts.at(-1);

  if (!mounted) return null;

  return (
    <AppShell header={{ height: 68 }} padding="md" className="appShell">
      {/* ── Top Navigation ── */}
      <AppShell.Header className="topNav">
        <Container size="xl" h="100%">
          <Group h="100%" justify="space-between">
            {/* Brand */}
            <Group gap="sm">
              <Box className="logoMark" />
              <Title order={1} className="brandTitle">NestPulse</Title>
            </Group>

            {/* Connection status */}
            <Group gap="sm">
              <span
                className={connected ? 'connectedBadge' : 'disconnectedBadge'}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '4px 12px',
                  borderRadius: 99,
                  fontSize: '0.72rem',
                  fontWeight: 700,
                  letterSpacing: '0.06em',
                  textTransform: 'uppercase' as const,
                }}
              >
                <span style={{ width: 7, height: 7, borderRadius: '50%', background: 'currentColor', display: 'inline-block' }} />
                {connected ? 'Live' : 'Disconnected'}
              </span>
            </Group>
          </Group>
        </Container>
      </AppShell.Header>

      {/* ── Main Content ── */}
      <AppShell.Main>
        <Container size="xl" py="xl">
          <Stack gap="xl">
            {/* Section header */}
            <Group justify="space-between" align="flex-end" wrap="wrap" gap="md">
              <div>
                <Text className="sectionLabel">Live telemetry</Text>
                <Title order={2} className="sectionTitle">Smart Home Rooms</Title>
              </div>
              <Box className="filterWrap">
                <RoomFilter value={filter} onChange={setFilter} />
              </Box>
            </Group>

            {/* Stats pills */}
            <div className="statsBar">
              <div className="statPill">
                🌡️ Avg Temp&nbsp;<span>{avgTemp !== null ? `${avgTemp.toFixed(1)}°C` : '—'}</span>
              </div>
              <div className="statPill">
                💧 Avg Humidity&nbsp;<span>{avgHumid !== null ? `${avgHumid.toFixed(1)}%` : '—'}</span>
              </div>
              <div className="statPill">
                👁️ Motion Active&nbsp;<span>{motionActive} room{motionActive !== 1 ? 's' : ''}</span>
              </div>
              <div className="statPill">
                ⚡ Updates&nbsp;<span>{updateCount}</span>
              </div>
            </div>

            <hr className="sectionDivider" />

            {/* Sensor grid */}
            <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing="md" className="cardGrid">
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

        {/* Alert banner */}
        <AlertBanner alert={latestAlert} />
      </AppShell.Main>
    </AppShell>
  );
}

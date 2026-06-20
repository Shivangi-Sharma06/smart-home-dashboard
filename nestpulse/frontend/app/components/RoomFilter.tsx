'use client';

import { SegmentedControl } from '@mantine/core';

export type RoomFilterValue = 'all' | 'living-room' | 'bedroom' | 'kitchen';

const rooms = [
  { label: 'All', value: 'all' },
  { label: 'Living Room', value: 'living-room' },
  { label: 'Bedroom', value: 'bedroom' },
  { label: 'Kitchen', value: 'kitchen' },
];

type RoomFilterProps = {
  value: RoomFilterValue;
  onChange: (value: RoomFilterValue) => void;
};

export function RoomFilter({ value, onChange }: RoomFilterProps) {
  return (
    <SegmentedControl
      value={value}
      onChange={(next) => onChange(next as RoomFilterValue)}
      data={rooms}
      className="roomFilter"
      fullWidth
    />
  );
}

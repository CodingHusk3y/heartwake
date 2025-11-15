import React, { useMemo } from 'react';
import { View } from 'react-native';
import Svg, { Line, Polyline, Text as SvgText } from 'react-native-svg';

export default function LiveHrChart({
  data,
  width = 320,
  height = 120,
  stroke = '#4a90e2',
}: {
  data: number[]; // most recent last
  width?: number;
  height?: number;
  stroke?: string;
}) {
  const { points, min, max } = useMemo(() => {
    const n = data.length;
    const safe = n > 0 ? data : [0];
    const min = Math.min(...safe);
    const max = Math.max(...safe);
    const range = Math.max(1, max - min);
    const pad = 8;
    const pts = safe.map((v, i) => {
      const x = (i / Math.max(1, n - 1)) * (width - pad * 2) + pad;
      const y = height - (((v - min) / range) * (height - pad * 2) + pad);
      return `${x},${y}`;
    });
    return { points: pts.join(' '), min, max };
  }, [data, width, height]);

  return (
    <View style={{ width, height, paddingVertical: 4 }}>
      <Svg width={width} height={height}>
        {/* baseline grid */}
        <Line x1={0} y1={height-1} x2={width} y2={height-1} stroke="#2a2f4a" strokeWidth={1} />
        <Polyline points={points} fill="none" stroke={stroke} strokeWidth={2} />
        {/* min/max labels */}
        <SvgText x={4} y={12} fontSize={10} fill="#9aa0c0">max {Math.round(max)} bpm</SvgText>
        <SvgText x={4} y={height-2} fontSize={10} fill="#9aa0c0">min {Math.round(min)} bpm</SvgText>
      </Svg>
    </View>
  );
}

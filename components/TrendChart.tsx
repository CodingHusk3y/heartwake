import React from 'react';
import { View } from 'react-native';
import Svg, { Circle, Line, Polyline, Text as SvgText } from 'react-native-svg';
import { StoredSession } from '../services/storage';

type Props = { sessions: StoredSession[]; height?: number; };

// Renders rating trend (1-5) over time (most recent first). Early wakes highlighted.
export const TrendChart: React.FC<Props> = ({ sessions, height = 120 }) => {
  const rated = sessions.filter(s => typeof s.rating === 'number');
  if (rated.length < 2) return <View style={{ height, justifyContent: 'center' }} />;
  const maxRating = 5;
  const width = 300;
  const points = rated.map((s, idx) => {
    const x = (idx / (rated.length - 1)) * (width - 10) + 5;
    const y = height - ((s.rating! / maxRating) * (height - 20) + 10);
    const minutesEarly = s.early ? (s.minutesEarly ?? 0) : 0;
    // radius scales with minutesEarly (min 5, max ~10)
    const r = Math.min(10, 5 + Math.floor((minutesEarly || 0) / 10));
    return { x, y, early: s.early, r, minutesEarly };
  });
  const polyPoints = points.map(p => `${p.x},${p.y}`).join(' ');
  return (
    <View style={{ paddingVertical: 8 }}>
      <Svg width={width} height={height}>
        <Line x1={0} y1={height-10} x2={width} y2={height-10} stroke="#ccc" strokeWidth={1} />
        <Polyline points={polyPoints} fill="none" stroke="#4a90e2" strokeWidth={2} />
        {points.map((p,i) => (
          <>
            <Circle key={`c-${i}`} cx={p.x} cy={p.y} r={p.r} fill={p.early ? '#e24a4a' : '#4a90e2'} />
            {p.early && p.minutesEarly > 0 && (
              <SvgText key={`t-${i}`} x={p.x + 8} y={p.y - 8} fontSize={10} fill="#e24a4a">-{p.minutesEarly}m</SvgText>
            )}
          </>
        ))}
      </Svg>
    </View>
  );
};

import Svg, { Path, Line } from 'react-native-svg';

type Props = {
  size?: number;
  color?: string;
  open?: boolean;
};

export function EyeIcon({ size = 20, color = '#64748B', open = true }: Props) {
  return (
    <Svg width={size} height={size} viewBox="0 0 25.6728 25.6728" fill="none">
      <Path
        d="M2.13941 12.8364C2.13941 12.8364 5.88337 5.34846 12.8364 5.34846C19.7895 5.34846 23.5335 12.8364 23.5335 12.8364C23.5335 12.8364 19.7895 20.3243 12.8364 20.3243C5.88337 20.3243 2.13941 12.8364 2.13941 12.8364Z"
        stroke={color}
        strokeWidth={1.92546}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M12.8364 16.0455C14.6088 16.0455 16.0455 14.6087 16.0455 12.8364C16.0455 11.064 14.6088 9.62727 12.8364 9.62727C11.0641 9.62727 9.62732 11.064 9.62732 12.8364C9.62732 14.6087 11.0641 16.0455 12.8364 16.0455Z"
        stroke={color}
        strokeWidth={1.92546}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {!open && (
        <Line
          x1={2.5}
          y1={2.5}
          x2={23.17}
          y2={23.17}
          stroke={color}
          strokeWidth={1.92546}
          strokeLinecap="round"
        />
      )}
    </Svg>
  );
}

// src/components/ui/counter.tsx

import { MotionValue, motion, useSpring, useTransform } from "framer-motion";
import { useEffect, useState, type CSSProperties } from "react";

interface NumberProps {
  mv: MotionValue<number>;
  number: number;
  height: number;
}

function Number({ mv, number, height }: NumberProps) {
  let y = useTransform(mv, (latest) => {
    let placeValue = latest % 10;
    let offset = (10 + number - placeValue) % 10;
    let memo = offset * height;
    if (offset > 5) {
      memo -= 10 * height;
    }
    return memo;
  });

  const style: CSSProperties = {
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  };

  return <motion.span style={{ ...style, y }}>{number}</motion.span>;
}

interface DigitProps {
  place: number;
  value: number;
  height: number;
  digitStyle?: CSSProperties;
}

function Digit({ place, value, height, digitStyle }: DigitProps) {
  let valueRoundedToPlace = Math.floor(value / place);
  let animatedValue = useSpring(valueRoundedToPlace);

  useEffect(() => {
    animatedValue.set(valueRoundedToPlace);
  }, [animatedValue, valueRoundedToPlace]);

  const defaultStyle: CSSProperties = {
    height,
    position: "relative",
    width: "1ch",
    fontVariantNumeric: "tabular-nums",
  };

  return (
    <div style={{ ...defaultStyle, ...digitStyle }}>
      {Array.from({ length: 10 }, (_, i) => (
        <Number key={i} mv={animatedValue} number={i} height={height} />
      ))}
    </div>
  );
}

interface CounterDisplayProps {
  value: number;
  fontSize?: number;
  padding?: number;
  places?: number[];
  gap?: number;
  borderRadius?: number;
  horizontalPadding?: number;
  textColor?: string;
  fontWeight?: CSSProperties["fontWeight"];
  containerStyle?: CSSProperties;
  counterStyle?: CSSProperties;
  digitStyle?: CSSProperties;
  gradientHeight?: number;
  gradientFrom?: string;
  gradientTo?: string;
  topGradientStyle?: CSSProperties;
  bottomGradientStyle?: CSSProperties;
}

const CounterDisplay = ({
  value,
  fontSize = 100,
  padding = 0,
  places = [100, 10, 1],
  gap = 8,
  borderRadius = 4,
  horizontalPadding = 8,
  textColor = "white",
  fontWeight = "bold",
  containerStyle,
  counterStyle,
  digitStyle,
  gradientHeight = 16,
  gradientFrom = "black",
  gradientTo = "transparent",
  topGradientStyle,
  bottomGradientStyle,
}: CounterDisplayProps) => {
  const height = fontSize + padding;

  const defaultContainerStyle: CSSProperties = {
    position: "relative",
    display: "inline-block",
  };

  const defaultCounterStyle: CSSProperties = {
    fontSize,
    display: "flex",
    gap: gap,
    overflow: "hidden",
    borderRadius: borderRadius,
    paddingLeft: horizontalPadding,
    paddingRight: horizontalPadding,
    lineHeight: 1,
    color: textColor,
    fontWeight: fontWeight,
    backgroundColor: gradientFrom,
  };

  const gradientContainerStyle: CSSProperties = {
    pointerEvents: "none",
    position: "absolute",
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
  };

  const defaultTopGradientStyle: CSSProperties = {
    height: gradientHeight,
    background: `linear-gradient(to bottom, ${gradientFrom}, ${gradientTo})`,
  };

  const defaultBottomGradientStyle: CSSProperties = {
    position: "absolute",
    bottom: 0,
    width: "100%",
    height: gradientHeight,
    background: `linear-gradient(to top, ${gradientFrom}, ${gradientTo})`,
  };

  return (
    <div style={{ ...defaultContainerStyle, ...containerStyle }}>
      <div style={{ ...defaultCounterStyle, ...counterStyle }}>
        {places.map((place) => (
          <Digit
            key={place}
            place={place}
            value={value}
            height={height}
            digitStyle={digitStyle}
          />
        ))}
      </div>
      <div style={gradientContainerStyle}>
        <div
          style={topGradientStyle ? topGradientStyle : defaultTopGradientStyle}
        />
        <div
          style={
            bottomGradientStyle
              ? bottomGradientStyle
              : defaultBottomGradientStyle
          }
        />
      </div>
    </div>
  );
};

interface ComponentPropsWithControls extends CounterDisplayProps {
  initialValue?: number;
  min?: number;
  max?: number;
  step?: number;
  onValueChange?: (value: number) => void;
}

export const Component = ({
  initialValue = 0,
  min = 0,
  max = Infinity,
  step = 1,
  onValueChange,
  value: _value, // Ignore value prop to avoid conflict
  ...rest
}: ComponentPropsWithControls) => {
  const [count, setCount] = useState(initialValue);

  const increment = () => {
    const newValue = Math.min(count + step, max);
    setCount(newValue);
    onValueChange?.(newValue);
  };

  const decrement = () => {
    const newValue = Math.max(count - step, min);
    setCount(newValue);
    onValueChange?.(newValue);
  };

  const buttonStyle: CSSProperties = {
    padding: '0',
    fontSize: '1.5rem',
    cursor: 'pointer',
    borderRadius: '12px',
    width: '44px',
    height: '44px',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    color: 'white',
    border: '1px solid rgba(255, 255, 255, 0.2)',
    backdropFilter: 'blur(10px)',
  };

  const controlsContainerStyle: CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '20px',
    flexDirection: 'column',
  };

  const buttonRowStyle: CSSProperties = {
    display: 'flex',
    gap: '10px',
  };

  return (
    <div style={controlsContainerStyle}>
      <CounterDisplay
        value={count}
        textColor="white"
        gradientFrom="rgba(0, 0, 0, 0.3)"
        borderRadius={16}
        horizontalPadding={12}
        gap={4}
        {...rest}
      />
      <div style={buttonRowStyle}>
        <button onClick={decrement} style={buttonStyle}>-</button>
        <button onClick={increment} style={buttonStyle}>+</button>
      </div>
    </div>
  );
};

// Time-specific components for hours and minutes
interface TimeCounterProps {
  value: number;
  onValueChange: (value: number) => void;
  min?: number;
  max?: number;
  label?: string;
}

export const TimeCounter = ({
  value,
  onValueChange,
  min = 0,
  max = 23,
  label
}: TimeCounterProps) => {
  return (
    <div className="flex flex-col items-center space-y-2">
      <Component
        initialValue={value}
        value={value}
        min={min}
        max={max}
        step={1}
        places={[10, 1]}
        fontSize={48}
        padding={8}
        fontWeight={600}
        onValueChange={onValueChange}
      />
      {label && (
        <span className="text-sm text-gray-400 font-medium">{label}</span>
      )}
    </div>
  );
};

export { CounterDisplay };
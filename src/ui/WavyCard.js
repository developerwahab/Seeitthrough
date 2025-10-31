// src/ui/WavyCard.js
import React, { useState, useCallback } from "react";
import { View } from "react-native";
import Svg, { Path } from "react-native-svg";
 
export default function WavyCard({ color = "#EF4444", radius = 18, style, children }) {
  const [size, setSize] = useState({ w: 0, h: 0 });

  const onLayout = useCallback((e) => {
    const { width, height } = e.nativeEvent.layout;
    if (width !== size.w || height !== size.h) setSize({ w: width, h: height });
  }, [size.w, size.h]);
 
  const buildPath = () => {
    const w = Math.max(size.w, 1);
    const h = Math.max(size.h, 1);
    const r = Math.min(radius, 28);
 
    const waveInset = Math.min(22, w * 0.12);  
    const waveTop = Math.max(r + 10, h * 0.18);
    const waveBottom = Math.min(h - r - 10, h * 0.58);
 
    return [
      `M ${r} 0`,
      // top edge → top-right
      `H ${w - r}`,
      `Q ${w} 0, ${w} ${r}`,
      // right edge → bottom-right
      `V ${h - r}`,
      `Q ${w} ${h}, ${w - r} ${h}`,
      // bottom edge → bottom-left
      `H ${r}`,
      `Q 0 ${h}, 0 ${h - r}`, 
      `V ${waveBottom}`, 
      `C ${waveInset * 0.2} ${waveBottom - 12}, ${waveInset} ${waveBottom - 6}, ${waveInset} ${(waveBottom + waveTop) / 2}`,
      `C ${waveInset} ${waveTop + 6}, ${waveInset * 0.2} ${waveTop + 12}, 0 ${waveTop}`, 
      `V ${r}`,
      `Q 0 0, ${r} 0`,
      "Z",
    ].join(" ");
  };

  return (
    <View
      onLayout={onLayout}
      style={[
        {
          borderRadius: radius,
          overflow: "hidden",
          padding: 14,          
        },
        style,
      ]}
    >
      {/* Background shape */}
      {size.w > 0 && size.h > 0 && (
        <Svg
          pointerEvents="none"
          width={size.w}
          height={size.h}
          style={{ position: "absolute", inset: 0 }}
        >
          <Path d={buildPath()} fill={color} />
        </Svg>
      )}

      {/* Content on top */}
      <View style={{ position: "relative" }}>{children}</View>
    </View>
  );
}

import { useEffect, useRef, useState, type ReactNode, type ComponentRef } from "react";
import { Animated, Platform, StyleSheet, View, type GestureResponderEvent } from "react-native";
import { loadDemoTouches, useDemoTouches } from "../lib/demoTouches";

type Touch = { identifier: number; pageX: number; pageY: number };
type Mark = {
  id: number; position: Animated.ValueXY; opacity: Animated.Value; scale: Animated.Value;
  ripple: Animated.Value; started: number; startX: number; startY: number; moved: boolean; ending: boolean;
};

export function TouchIndicatorOverlay({ children }: { children: ReactNode }) {
  const enabled = useDemoTouches(state => state.enabled);
  const root = useRef<ComponentRef<typeof View>>(null);
  const marks = useRef(new Map<number, Mark>());
  const [visible, setVisible] = useState<Mark[]>([]);
  const origin = useRef({ x: 0, y: 0 });
  const mouseDown = useRef(false);
  const alive = useRef(true);
  useEffect(() => { alive.current = true; void loadDemoTouches(); return () => { alive.current = false; }; }, []);
  function clear() {
    for (const mark of marks.current.values()) {
      mark.opacity.stopAnimation(); mark.scale.stopAnimation(); mark.ripple.stopAnimation();
    }
    marks.current.clear(); mouseDown.current = false; setVisible([]);
  }
  useEffect(() => { if (!enabled) clear(); }, [enabled]);
  useEffect(() => () => {
    for (const mark of marks.current.values()) {
      mark.opacity.stopAnimation(); mark.scale.stopAnimation(); mark.ripple.stopAnimation();
    }
  }, []);
  function update(touch: Touch, start: boolean) {
    let mark = marks.current.get(touch.identifier);
    if (mark?.ending) mark = undefined;
    if (!mark && start) {
      mark = { id: touch.identifier, position: new Animated.ValueXY(), opacity: new Animated.Value(0),
        scale: new Animated.Value(0.7), ripple: new Animated.Value(0), started: Date.now(),
        startX: touch.pageX, startY: touch.pageY, moved: false, ending: false };
      marks.current.set(touch.identifier, mark);
      Animated.parallel([
        Animated.timing(mark.opacity, { toValue: 1, duration: 90, useNativeDriver: true }),
        Animated.spring(mark.scale, { toValue: 1, useNativeDriver: true, speed: 30, bounciness: 3 })
      ]).start();
      setVisible([...marks.current.values()]);
    }
    if (!mark || mark.ending) return;
    if (Math.hypot(touch.pageX - mark.startX, touch.pageY - mark.startY) > 10) mark.moved = true;
    mark.position.setValue({ x: touch.pageX - origin.current.x - 22, y: touch.pageY - origin.current.y - 22 });
  }
  function finish(touch: Touch, cancelled: boolean) {
    const mark = marks.current.get(touch.identifier);
    if (!mark || mark.ending) return;
    update(touch, false); mark.ending = true;
    mark.opacity.stopAnimation(); mark.scale.stopAnimation();
    if (!cancelled && !mark.moved && Date.now() - mark.started < 300) {
      Animated.timing(mark.ripple, { toValue: 1, duration: 250, useNativeDriver: true }).start();
    }
    Animated.timing(mark.opacity, { toValue: 0, duration: 250, useNativeDriver: true }).start(() => {
      if (marks.current.get(touch.identifier) !== mark) return;
      marks.current.delete(touch.identifier);
      if (alive.current) setVisible([...marks.current.values()]);
    });
  }
  function handle(event: GestureResponderEvent, phase: "start" | "move" | "end" | "cancel") {
    if (!enabled) return;
    const { touches, changedTouches } = event.nativeEvent;
    if (phase === "start" || phase === "move") {
      for (const touch of touches) update(touch, phase === "start");
    } else {
      for (const touch of changedTouches) finish(touch, phase === "cancel");
    }
  }
  // page coordinates share the window origin; measure this wrapper for safe areas and modal windows.
  const measure = () => root.current?.measureInWindow((x, y) => { origin.current = { x, y }; });
  // RN web mouse events supplement touch events; a mouse hover never creates a marker.
  const mouse = Platform.OS === "web" ? {
    onMouseDown: (event: any) => {
      if (!enabled || event.nativeEvent.button !== 0 || (event.nativeEvent?.sourceCapabilities?.firesTouchEvents)) return;
      mouseDown.current = true; update({ identifier: -1, pageX: event.nativeEvent.pageX, pageY: event.nativeEvent.pageY }, true);
    },
    onMouseMove: (event: any) => {
      if (!enabled || !mouseDown.current) return;
      const touch = { identifier: -1, pageX: event.nativeEvent.pageX, pageY: event.nativeEvent.pageY };
      if (event.nativeEvent.buttons === 0) { mouseDown.current = false; finish(touch, true); }
      else update(touch, false);
    },
    onMouseUp: (event: any) => {
      if (!enabled || !mouseDown.current) return;
      mouseDown.current = false; finish({ identifier: -1, pageX: event.nativeEvent.pageX, pageY: event.nativeEvent.pageY }, false);
    },
    onMouseLeave: (event: any) => {
      if (!enabled || !mouseDown.current) return;
      mouseDown.current = false; finish({ identifier: -1, pageX: event.nativeEvent.pageX, pageY: event.nativeEvent.pageY }, true);
    }
  } : {};
  return <View ref={root} collapsable={false} style={styles.root} onLayout={measure}
    onTouchStart={event => handle(event, "start")} onTouchMove={event => handle(event, "move")}
    onTouchEnd={event => handle(event, "end")} onTouchCancel={event => handle(event, "cancel")} {...mouse}>
    {children}
    {enabled && visible.length > 0 ? <View pointerEvents="none" accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={styles.layer}>
      {visible.map(mark => <Animated.View key={`${mark.id}-${mark.started}`} style={[styles.position, { opacity: mark.opacity, transform: mark.position.getTranslateTransform() }]}>
        <Animated.View style={[styles.circle, { transform: [{ scale: mark.scale }] }]} />
        <Animated.View style={[styles.circle, styles.ripple, { opacity: mark.ripple.interpolate({ inputRange: [0, 0.1, 1], outputRange: [0, 0.7, 0] }), transform: [{ scale: mark.ripple.interpolate({ inputRange: [0, 1], outputRange: [1, 1.8] }) }] }]} />
      </Animated.View>)}
    </View> : null}
  </View>;
}
const styles = StyleSheet.create({
  root: { flex: 1 },
  layer: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0, zIndex: 2147483647 },
  position: { position: "absolute", top: 0, left: 0, width: 44, height: 44 },
  circle: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0, borderRadius: 22, backgroundColor: "rgba(150,150,150,0.35)", borderWidth: 2, borderColor: "rgba(255,255,255,0.9)", shadowColor: "#000", shadowOpacity: 0.45, shadowRadius: 2, shadowOffset: { width: 0, height: 0 } },
  ripple: { backgroundColor: "transparent" }
});

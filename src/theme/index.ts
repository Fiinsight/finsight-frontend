export const colors = {
  text: "#101828", body: "#344054", secondary: "#475467", muted: "#667085", subtle: "#98A2B3",
  primary: "#175CD3", primarySoft: "#EFF4FF", onPrimary: "#FFFFFF", onPrimarySoft: "#D5E1FF",
  surface: "#FFFFFF", canvas: "#F8FAFC", surfaceMuted: "#F2F4F7", border: "#EAECF0", borderStrong: "#D0D5DD",
  up: "#D92D20", warning: "#B54708", overlay: "rgba(16,24,40,0.35)"
} as const;
export const radius = { small: 8, control: 12, card: 16, sheet: 20, pill: 999 } as const;
export const spacing = { xxs: 4, xs: 8, sm: 12, md: 16, lg: 20, xl: 24, xxl: 32 } as const;
export const typography = {
  size: { caption: 12, meta: 13, body: 14, reading: 15, label: 16, subheading: 18, heading: 20, display: 26 },
  weight: { regular: "400", semibold: "600", bold: "700" },
  lineHeight: { compact: 20, body: 22, heading: 26, display: 32 }
} as const;

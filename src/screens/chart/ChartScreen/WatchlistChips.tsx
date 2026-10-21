import { colors, radius, spacing, typography } from "../../../theme";
import { Ionicons } from "@expo/vector-icons";
import { ScrollView, Pressable, StyleSheet, Text } from "react-native";
import type { WatchlistItem } from "../../../types/api";

export function WatchlistChips({items,selectedSymbol,onSelect}:{items:WatchlistItem[];selectedSymbol:string;onSelect:(symbol:string,name:string)=>void}) {
  if (!items.length) return null;
  return <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
    {items.map(item=><Pressable key={item.symbol} accessibilityRole="button" accessibilityLabel={`관심종목 ${item.name} 차트 보기`}
      accessibilityState={{selected:item.symbol===selectedSymbol}} onPress={()=>onSelect(item.symbol,item.name)}
      style={[styles.chip,item.symbol===selectedSymbol&&styles.selected]}><Ionicons name="star" size={22} color={colors.primary} aria-hidden /><Text style={styles.text}>{item.name}</Text></Pressable>)}
  </ScrollView>;
}
const styles=StyleSheet.create({row:{gap: spacing.xs},chip:{flexDirection:"row",alignItems:"center",gap:6,minHeight:44,paddingHorizontal: spacing.sm,justifyContent:"center",borderRadius: radius.control,borderWidth:1,borderColor:colors.borderStrong},selected:{backgroundColor:colors.primarySoft,borderColor:colors.primary},text:{fontSize: typography.size.meta,color:colors.primary,fontWeight: typography.weight.bold}});

import { colors, typography } from "../../../theme";
import { Ionicons } from "@expo/vector-icons";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { formatPercent, formatPrice } from "../../../lib/format";

interface StockHeaderProps {
  name: string;
  symbol: string;
  price: number;
  changePercent: number;
  changeLabel: string;
  watched?: boolean;
  watchlistBusy?: boolean;
  onToggleWatchlist?: () => void;
}

export function StockHeader({ name, symbol, price, changePercent, changeLabel, watched, watchlistBusy, onToggleWatchlist }: StockHeaderProps) {
  return (
    <View style={styles.row}>
      <View style={{flex:1,minWidth:0}}>
        <View style={{flexDirection:"row",alignItems:"center"}}><Text style={[styles.name,{flexShrink:1}]}>{name}</Text>
          {/^[0-9]{6}$/.test(symbol) && onToggleWatchlist ? <Pressable accessibilityRole="button" accessibilityLabel={watched ? "관심종목 해제" : "관심종목 추가"}
            accessibilityState={{selected:!!watched,disabled:watchlistBusy}} disabled={watchlistBusy} onPress={onToggleWatchlist}
            style={styles.watchlistButton}><Ionicons name={watched ? "star" : "star-outline"} size={22} color={colors.primary} aria-hidden /></Pressable> : null}
        </View>
        <Text style={styles.symbol}>{symbol}</Text>
      </View>
      <View style={styles.priceGroup}>
        <Text style={styles.price}>{price > 0 ? formatPrice(price) : "확인 불가"}</Text>
        <Text style={[styles.change, { color: changePercent === 0 ? colors.muted : changePercent > 0 ? colors.up : colors.primary }]}>{price > 0 ? formatPercent(changePercent) : "-"}</Text>
        <Text style={styles.changeLabel}>{changeLabel}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  watchlistButton: { minWidth: 44, minHeight: 44, alignItems: "center", justifyContent: "center" },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end"
  },
  name: {
    color: colors.text,
    fontSize: typography.size.heading,
    fontWeight: typography.weight.bold
  },
  symbol: {
    color: colors.subtle,
    fontSize: typography.size.meta,
    marginTop: 2
  },
  priceGroup: {
    alignItems: "flex-end"
  },
  price: {
    color: colors.text,
    fontSize: typography.size.heading,
    fontWeight: typography.weight.bold
  },
  change: {
    fontSize: typography.size.meta,
    fontWeight: typography.weight.bold,
    marginTop: 2
  },
  changeLabel: {
    color: colors.subtle,
    fontSize: typography.size.caption,
    marginTop: 2
  }
});

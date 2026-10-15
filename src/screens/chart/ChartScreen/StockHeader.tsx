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
            style={{minWidth:44,minHeight:44,alignItems:"center",justifyContent:"center"}}><Text style={{fontSize:28,color:"#175CD3"}}>{watched ? "★" : "☆"}</Text></Pressable> : null}
        </View>
        <Text style={styles.symbol}>{symbol}</Text>
      </View>
      <View style={styles.priceGroup}>
        <Text style={styles.price}>{price > 0 ? formatPrice(price) : "확인 불가"}</Text>
        <Text style={[styles.change, { color: changePercent >= 0 ? "#D92D20" : "#175CD3" }]}>{price > 0 ? formatPercent(changePercent) : "-"}</Text>
        <Text style={styles.changeLabel}>{changeLabel}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end"
  },
  name: {
    color: "#101828",
    fontSize: 20,
    fontWeight: "800"
  },
  symbol: {
    color: "#98A2B3",
    fontSize: 13,
    marginTop: 2
  },
  priceGroup: {
    alignItems: "flex-end"
  },
  price: {
    color: "#101828",
    fontSize: 20,
    fontWeight: "800"
  },
  change: {
    fontSize: 13,
    fontWeight: "700",
    marginTop: 2
  },
  changeLabel: {
    color: "#98A2B3",
    fontSize: 10,
    marginTop: 2
  }
});

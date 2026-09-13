import { StyleSheet, Text, View } from "react-native";
import { formatPercent, formatPrice } from "../../../lib/format";

interface StockHeaderProps {
  name: string;
  symbol: string;
  price: number;
  changePercent: number;
}

export function StockHeader({ name, symbol, price, changePercent }: StockHeaderProps) {
  return (
    <View style={styles.row}>
      <View>
        <Text style={styles.name}>{name}</Text>
        <Text style={styles.symbol}>{symbol}</Text>
      </View>
      <View style={styles.priceGroup}>
        <Text style={styles.price}>{formatPrice(price)}</Text>
        <Text style={[styles.change, { color: changePercent >= 0 ? "#D92D20" : "#175CD3" }]}>{formatPercent(changePercent)}</Text>
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
  }
});

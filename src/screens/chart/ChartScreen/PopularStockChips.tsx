import { ScrollView, StyleSheet, Text, TouchableOpacity } from "react-native";
import { formatPercent, formatPrice } from "../../../lib/format";
import type { PopularStock } from "../../../types/api";

interface PopularStockChipsProps {
  stocks: PopularStock[];
  selectedSymbol: string;
  onSelect: (symbol: string) => void;
}

export function PopularStockChips({ stocks, selectedSymbol, onSelect }: PopularStockChipsProps) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
      {stocks.map((stock) => {
        const selected = stock.symbol === selectedSymbol;
        return (
          <TouchableOpacity
            key={stock.symbol}
            style={[styles.chip, selected && styles.chipSelected]}
            activeOpacity={0.85}
            onPress={() => onSelect(stock.symbol)}
          >
            <Text style={[styles.name, selected && styles.nameSelected]}>{stock.name}</Text>
            <Text style={[styles.price, selected && styles.nameSelected]}>{formatPrice(stock.price)}</Text>
            <Text style={[styles.change, { color: stock.changePercent >= 0 ? "#D92D20" : "#175CD3" }]}>{formatPercent(stock.changePercent)}</Text>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row: {
    gap: 10
  },
  chip: {
    backgroundColor: "#FFFFFF",
    borderColor: "#EAECF0",
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    minWidth: 108,
    gap: 2
  },
  chipSelected: {
    borderColor: "#175CD3",
    backgroundColor: "#EFF4FF"
  },
  name: {
    color: "#101828",
    fontSize: 13,
    fontWeight: "800"
  },
  nameSelected: {
    color: "#175CD3"
  },
  price: {
    color: "#344054",
    fontSize: 13,
    fontWeight: "700"
  },
  change: {
    fontSize: 12,
    fontWeight: "700"
  }
});

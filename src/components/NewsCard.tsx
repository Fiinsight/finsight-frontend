import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import { Image, Linking, Platform, Pressable, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { toRelativeTimeKorean } from "../lib/format";
import { categoryColor, cleanNewsCardText, newsCardPoint, newsCardSummary, newsImageUrl, publisherName } from "../lib/newsPresentation";
import type { NewsBrief } from "../types/api";

interface NewsCardProps {
  news: NewsBrief;
  onPress: () => void;
}

export function NewsCard({ news, onPress }: NewsCardProps) {
  const sourceUrl = newsImageUrl(news.url);
  const [linkError,setLinkError] = useState(false);
  const imageUrl = newsImageUrl(news.imageUrl);
  const [failedUrl, setFailedUrl] = useState<string | null>(null);
  const source = publisherName(news.source);
  return (
    <TouchableOpacity
      style={styles.newsCard}
      activeOpacity={0.85}
      onPress={() => {
        if (Platform.OS === "web" && typeof document !== "undefined") {
          (document.activeElement as HTMLElement | null)?.blur();
        }
        onPress();
      }}
    >
      <View style={styles.cardTop}>
        <Text style={styles.symbol}>{news.category}</Text>
        <Text style={styles.date}>{source} · {news.publishedAt ? toRelativeTimeKorean(news.publishedAt) : "발행시간 확인할 수 없음"}</Text>
      </View>
      <View style={styles.articleRow}>
        <View style={styles.copy}>
          <Text style={styles.newsTitle} numberOfLines={2}>{cleanNewsCardText(news.title)}</Text>
          <Text style={styles.summary} numberOfLines={2}>{newsCardSummary(news.summary)}</Text>
        </View>
        <Pressable accessibilityRole="link" accessibilityLabel={`${source} 사진 원문 보기`} disabled={!sourceUrl} onPress={event=>{event.stopPropagation();if(sourceUrl)void Linking.openURL(sourceUrl).catch(()=>setLinkError(true));}} style={[styles.thumbnail, {backgroundColor: categoryColor(news.category)}]}>
          {imageUrl && failedUrl !== imageUrl ? <>
            <Image source={{uri:imageUrl}} style={styles.image} accessibilityLabel={`${source} 기사 사진`} onError={() => setFailedUrl(imageUrl)} />
            <Text style={styles.imageCredit} numberOfLines={1}>사진 · {source}</Text>
          </> : <><Ionicons name={news.category==="시장" || news.category==="국내증시" ? "stats-chart-outline" : news.category==="산업·기술" ? "hardware-chip-outline" : "newspaper-outline"} size={26} color="#475467"/><Text style={styles.placeholder}>{news.category}</Text></>}
        </Pressable>
      </View>
      {linkError ? <Text accessibilityRole="alert" style={styles.linkError}>원문을 열지 못했어요. 기사 상세에서 다시 시도해주세요.</Text>:null}
      {news.importanceReason ? <Text style={styles.reason} numberOfLines={2}>투자 포인트: {newsCardPoint(news.importanceReason)}</Text> : null}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  linkError: {fontSize:13,color:"#B42318"},
  articleRow: {flexDirection:"row",gap:12,alignItems:"flex-start"},
  copy: {flex:1,minWidth:0,gap:8},
  thumbnail: {width:76,height:76,borderRadius:8,overflow:"hidden",justifyContent:"center",alignItems:"center"},
  image: {width:"100%",height:"100%"},
  imageCredit: {position:"absolute",bottom:0,left:0,right:0,backgroundColor:"rgba(0,0,0,.72)",color:"#FFFFFF",fontSize:10,padding:3},
  placeholder: {fontSize:11,fontWeight:"700",color:"#475467",textAlign:"center",padding:4},
  date: { color: "#667085", fontSize: 12 },
  newsCard: {
    backgroundColor: "#FFFFFF",
    borderColor: "#EAECF0",
    borderRadius: 8,
    borderWidth: 1,
    gap: 10,
    padding: 16
  },
  cardTop: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between"
  },
  symbol: {
    color: "#344054",
    fontSize: 12,
    fontWeight: "800"
  },
  newsTitle: {
    color: "#101828",
    fontSize: 18,
    fontWeight: "800",
    lineHeight: 25
  },
  summary: {
    maxHeight:42,
    overflow:"hidden",
    color: "#475467",
    fontSize: 14,
    lineHeight: 21
  },
  reason: {
    color: "#175CD3",
    fontSize: 13,
    fontWeight: "700",
    lineHeight: 19
  }
});

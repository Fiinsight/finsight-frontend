import { Pressable, StyleSheet, Text, View } from "react-native";
import type { NewsBrief } from "../../../types/api";
import { NewsCard } from "../../../components/NewsCard";
import { watchlistNewsState } from "../../../lib/watchlist";

export function WatchlistNewsSection({items,count,loading,failed,onRetry,onChart,onSelectNews}:{items:NewsBrief[];count:number;loading:boolean;failed:boolean;onRetry:()=>void;onChart:()=>void;onSelectNews:(id:number)=>void}) {
  const message=watchlistNewsState(loading,failed,count,items.length);
  return <View style={{gap:12}}><Text style={styles.title}>내 관심종목 뉴스</Text>
    {message ? <View style={styles.empty}><Text accessibilityRole={failed?"alert":undefined} style={styles.body}>{message}</Text>
      {!loading && failed ? <Pressable accessibilityRole="button" onPress={onRetry} style={styles.button}><Text style={styles.link}>다시 시도</Text></Pressable>
        : !loading && !count ? <Pressable accessibilityRole="button" onPress={onChart} style={styles.button}><Text style={styles.link}>차트에서 관심종목 추가하기</Text></Pressable> : null}
    </View> : items.map(item=><NewsCard key={item.id} news={item} onPress={()=>onSelectNews(item.id)} />)}
  </View>;
}
const styles=StyleSheet.create({title:{fontSize:18,fontWeight:"700",color:"#101828"},empty:{padding:16,backgroundColor:"#F8FAFC",borderRadius:12,gap:12},body:{fontSize:14,lineHeight:22,color:"#667085"},button:{minHeight:44,justifyContent:"center"},link:{color:"#175CD3",fontWeight:"700"}});

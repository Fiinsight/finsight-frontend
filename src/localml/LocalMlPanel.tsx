import React, { useEffect, useState } from "react";
import { Button, Pressable, StyleSheet, Text, View } from "react-native";

export type LocalMlQuery = {
  query: string;
  kind: "news" | "term" | "case";
  startAt?: string;
  endAt?: string;
  symbol?: string;
  term?: string;
};

export type LocalMlResult = {
  status: string;
  note?: string;
  candidateCount?: number;
  results: Array<{
    id: string;
    url?: string;
    title: string;
    score: number;
    evidence: string;
    publishedAt?: string;
    synthetic?: boolean;
    matchReason?: string;
  }>;
};

export type LocalMlTransport = (payload: LocalMlQuery) => Promise<LocalMlResult>;

export function LocalMlPanel({
  request,
  search,
  enabled = true,
  title = "관련 자료 검색",
  onNewsPress
}: {
  request: LocalMlQuery;
  search: LocalMlTransport;
  enabled?: boolean;
  title?: string;
  onNewsPress?: (newsId: number) => void;
}) {
  const [data, setData] = useState<LocalMlResult | null>(null);
  const [error, setError] = useState(false);
  const [busy, setBusy] = useState(false);
  const [retry, setRetry] = useState(0);
  const key = JSON.stringify(request);

  useEffect(() => {
    let active = true;
    setData(null);
    setError(false);
    if (!enabled) {
      setBusy(false);
      return () => {
        active = false;
      };
    }
    setBusy(true);
    search(JSON.parse(key) as LocalMlQuery)
      .then((result) => {
        if (active) setData(result);
      })
      .catch(() => {
        if (active) setError(true);
      })
      .finally(() => {
        if (active) setBusy(false);
      });
    return () => {
      active = false;
    };
  }, [key, search, enabled, retry]);

  if (!enabled) return null;
  return (
    <View style={styles.panel}>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.note}>관련 자료 검색 결과입니다. 상승·하락이나 원인을 판정하지 않습니다.</Text>
      {busy && <Text accessibilityLiveRegion="polite">로컬 모델 검색 중…</Text>}
      {error && (
        <>
          <Text>추가 검색을 사용할 수 없습니다. 기존 화면은 계속 이용할 수 있습니다.</Text>
          <Button title="다시 검색" onPress={() => setRetry((value) => value + 1)} />
        </>
      )}
      {data?.status === "RULE_FALLBACK" && <Text>로컬 규칙 검색 (fallback) · 의미 유사도를 확인할 수 없음</Text>}
      {data && <Text>{data.results.length > 0 ? "관련 자료를 찾았어요" : "관련 자료가 없어요"}</Text>}
      {data?.results.map((row) => {
        const newsId = /^\d+$/.test(row.id) ? Number(row.id) : NaN;
        const canOpen = request.kind === "news" && !!onNewsPress && Number.isSafeInteger(newsId) && newsId > 0;
        const content = (
          <>
            <Text style={styles.rowTitle}>{row.title}</Text>
            <Text>{row.publishedAt || "발행 시각 확인 불가"}</Text>
            {row.matchReason && <Text style={styles.matchReason}>{row.matchReason}</Text>}
            <Text numberOfLines={5}>{row.evidence}</Text>
            {data.status === "MODEL" && <Text>검색 유사도 {row.score.toFixed(3)}</Text>}
          </>
        );
        return canOpen ? (
          <Pressable key={row.id} style={styles.row} accessibilityRole="button"
            accessibilityLabel={`${row.title} 기사 상세 보기`} onPress={() => onNewsPress?.(newsId)}>
            {content}
          </Pressable>
        ) : <View key={row.id} style={styles.row}>{content}</View>;
      })}
      {data && data.results.length === 0 && <Text>조건에 맞는 추가 자료가 없습니다.</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  panel: { padding: 16, gap: 10, backgroundColor: "#EEF4FF", borderRadius: 12 },
  title: { fontWeight: "700", fontSize: 16 },
  note: { color: "#475467" },
  row: { borderTopWidth: 1, borderColor: "#CCD3DF", paddingTop: 12, gap: 6 },
  rowTitle: { fontWeight: "700" },
  matchReason: { color: "#175CD3" }
});

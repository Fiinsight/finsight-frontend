import { useState } from 'react';
import { Pressable, Text, View, StyleSheet } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { getTodayBriefing, getNewsDetail } from '../../../lib/api';
import { evidenceSentences, hasObservedNumber, learningSummary } from '../../../lib/learningActions';
import type { LearningPainPoint } from '../../../lib/learningPreferences';
import { colors, radius, spacing, typography } from '../../../theme';

type Props = { painPoint: LearningPainPoint; ownerId: number | null; focused: boolean; onArticle: (id: number) => void; onHistory: (tab: 'judgements' | 'notes') => void };
export function PainPointCard({ painPoint, ownerId, focused, onArticle, onHistory }: Props) {
  const [selected, setSelected] = useState<{ id: number; sentence: string } | null>(null);
  const needsArticle = painPoint === 'overload' || painPoint === 'evidence';
  const briefing = useQuery({ queryKey: ['learning-focus-news', ownerId], queryFn: getTodayBriefing, enabled: needsArticle && ownerId !== null && focused, retry: 0, staleTime: 60_000 });
  const article = briefing.data?.[0];
  const detail = useQuery({ queryKey: ['news-detail', article?.id], queryFn: () => getNewsDetail(article!.id), enabled: needsArticle && !!article && focused, retry: 0, staleTime: 60_000 });
  if (painPoint === 'terms') return null;
  const candidates = evidenceSentences(detail.data?.rawContent ?? '');
  const observed = candidates.find(hasObservedNumber);
  const sentences = observed ? [observed, ...candidates.filter(sentence => sentence !== observed)].slice(0, 3) : [];
  const summary = learningSummary(article?.summary ?? '', detail.data?.rawContent ?? '');
  const hasPractice = sentences.some(hasObservedNumber);
  return <View style={styles.card}>
    <Text accessibilityRole="header" style={styles.title}>{painPoint === 'reflection' ? '지난 생각 돌아보기' : painPoint === 'evidence' ? '판단 근거 연습' : '오늘은 이 기사 하나'}</Text>
    {painPoint === 'reflection' ? <>
      <Text style={styles.body}>지난 판단과 메모를 나란히 읽고 생각이 달라진 이유를 찾아보세요.</Text>
      <Pressable accessibilityRole="button" style={styles.button} onPress={() => onHistory('judgements')}><Text style={styles.link}>지난 판단 보기</Text></Pressable>
      <Pressable accessibilityRole="button" style={styles.button} onPress={() => onHistory('notes')}><Text style={styles.link}>기사 메모 보기</Text></Pressable>
    </> : ownerId === null ? <Text style={styles.body}>로그인하면 오늘의 기사로 연습할 수 있어요.</Text>
      : briefing.isPending ? <Text style={styles.body}>오늘의 기사를 불러오고 있어요.</Text>
      : briefing.isError ? <Pressable accessibilityRole="button" style={styles.button} onPress={() => void briefing.refetch()}><Text style={styles.link}>오늘 기사 다시 시도</Text></Pressable>
      : !article ? <Text style={styles.body}>오늘 확인할 기사가 아직 없어요.</Text> : <>
        <Text style={styles.title}>{article.title}</Text>
        {painPoint === 'overload' ? summary.text ? <>{summary.fromOriginal ? <Text style={styles.body}>원문 발췌 · 최대 세 문장</Text> : null}<Text style={styles.body} numberOfLines={3}>{summary.text}</Text></> : detail.isPending ? <Text style={styles.body}>기사 요약을 불러오고 있어요.</Text> : <Text style={styles.body}>요약을 확인하지 못했어요. 원문에서 확인해보세요.</Text> : detail.isPending ? <Text style={styles.body}>기사 근거를 불러오고 있어요.</Text>
          : detail.isError ? <Pressable accessibilityRole="button" style={styles.button} onPress={() => void detail.refetch()}><Text style={styles.link}>근거 문장 다시 시도</Text></Pressable>
          : hasPractice ? <>
            <Text style={styles.body}>기사 원문에서 전망이 아닌 숫자를 보고한 문장을 골라보세요.</Text>
            {sentences.map(sentence => <Pressable key={sentence} accessibilityRole="button" accessibilityState={{ selected: selected?.id === article.id && selected.sentence === sentence }} style={styles.option} onPress={() => setSelected({ id: article.id, sentence })}><Text style={styles.body}>{sentence}</Text></Pressable>)}
            {selected?.id === article.id ? <Text accessibilityRole="alert" style={styles.body}>{hasObservedNumber(selected.sentence) ? '숫자가 담긴 근거를 찾았어요. 기준 기간과 출처도 확인해보세요.' : '전망 표현과 숫자를 살펴보고, 관측된 수치를 보고한 문장을 다시 찾아보세요.'}</Text> : null}
          </> : <Text style={styles.body}>숫자 근거 연습에 맞는 문장이 없어요. 원문에서 판단의 근거를 직접 살펴보세요.</Text>}
        <Pressable accessibilityRole="button" style={styles.button} onPress={() => onArticle(article.id)}><Text style={styles.link}>이 기사 읽기</Text></Pressable>
      </>}
  </View>;
}
const styles = StyleSheet.create({
  card: { backgroundColor: colors.surface, borderRadius: radius.card, borderWidth: 1, borderColor: colors.border, padding: spacing.lg, gap: spacing.sm },
  title: { color: colors.text, fontSize: typography.size.reading, fontWeight: typography.weight.bold, lineHeight: typography.lineHeight.body },
  body: { color: colors.body, fontSize: typography.size.reading, lineHeight: typography.lineHeight.body },
  link: { color: colors.primary, fontSize: typography.size.reading, fontWeight: typography.weight.bold },
  button: { minHeight: 44, justifyContent: 'center' },
  option: { minHeight: 44, padding: spacing.md, backgroundColor: colors.primarySoft, borderRadius: radius.control }
});

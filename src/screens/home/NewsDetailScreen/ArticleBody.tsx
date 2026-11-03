import { StyleSheet, Text, View } from "react-native";
import { articleParagraph } from "../../../lib/newsPresentation";
import { splitAroundTerms, splitParagraphs } from "../../../lib/text";

interface ArticleBodyProps {
  text: string;
  showLabels?: boolean;
  terms: string[];
  onTermPress: (term: string) => void;
}

function TermizedParagraph({ text, terms, onTermPress }: ArticleBodyProps) {
  const segments = splitAroundTerms(text, terms);

  return (
    <Text style={styles.paragraph}>
      {segments.map((segment, index) =>
        segment.isTerm ? (
          <Text key={index} style={styles.termSpan} onPress={() => onTermPress(segment.text)}>
            {segment.text}
          </Text>
        ) : (
          <Text key={index}>{segment.text}</Text>
        )
      )}
    </Text>
  );
}

export function ArticleBody({ text, terms, onTermPress, showLabels = false }: ArticleBodyProps) {
  const paragraphs = splitParagraphs(text);

  return (
    <View style={styles.group}>
      {paragraphs.map((paragraph, index) => {
        const item = articleParagraph(paragraph, showLabels);
        return <View key={index} style={styles.paragraphGroup}>
          {item.label ? <View style={styles.badge}><Text style={styles.badgeText}>{item.label}</Text></View> : null}
          <TermizedParagraph text={item.text} terms={terms} onTermPress={onTermPress} />
        </View>;
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  paragraphGroup: {gap:6},
  badge: {alignSelf:"flex-start",backgroundColor:"#F2F4F7",borderRadius:4,paddingHorizontal:7,paddingVertical:3},
  badgeText: {fontSize:11,fontWeight:"700",color:"#475467"},
  group: {
    gap: 14
  },
  paragraph: {
    color: "#344054",
    fontSize: 15,
    lineHeight: 24
  },
  termSpan: {
    color: "#175CD3",
    fontWeight: "700",
    textDecorationLine: "underline"
  }
});

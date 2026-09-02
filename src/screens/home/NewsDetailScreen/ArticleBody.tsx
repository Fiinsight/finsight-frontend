import { StyleSheet, Text, View } from "react-native";
import { splitAroundTerms, splitParagraphs } from "../../../lib/text";

interface ArticleBodyProps {
  text: string;
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

export function ArticleBody({ text, terms, onTermPress }: ArticleBodyProps) {
  const paragraphs = splitParagraphs(text);

  return (
    <View style={styles.group}>
      {paragraphs.map((paragraph, index) => (
        <TermizedParagraph key={index} text={paragraph} terms={terms} onTermPress={onTermPress} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
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

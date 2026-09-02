// Local sample/fallback data used whenever an API call fails, times out, or
// the backend isn't reachable. Every screen must render fully and stay
// clickable on this data alone (see project spec: "resilience requirement").

import type {
  ChartData,
  ChartPoint,
  JudgementFeedback,
  JudgementChoice,
  JudgementHistoryItem,
  MarketSummary,
  NewsBrief,
  NewsDetail,
  PopularStock,
  TermExplanation
} from "../types/api";

export const sampleNews: NewsBrief[] = [
  {
    id: 1,
    title: "반도체 수출 회복세, 대형주 실적 기대감 확대",
    summary: "반도체 업황 회복 신호가 이어지며 국내 대형 기술주의 실적 기대가 커지고 있습니다.",
    importanceReason: "수출과 실적 전망은 주가 방향을 판단하는 핵심 근거입니다.",
    relatedSymbol: "005930",
    sentimentHint: "POSITIVE"
  },
  {
    id: 2,
    title: "원달러 환율 변동성 확대, 외국인 수급 주목",
    summary: "환율이 단기적으로 흔들리면서 외국인 매수세와 수입 비용 부담이 함께 관찰됩니다.",
    importanceReason: "환율은 기업 이익과 외국인 자금 흐름에 동시에 영향을 줍니다.",
    relatedSymbol: "KOSPI",
    sentimentHint: "NEUTRAL"
  },
  {
    id: 3,
    title: "금리 동결 전망 우세, 성장주 밸류에이션 부담 완화",
    summary: "기준금리 동결 가능성이 커지며 성장주의 할인율 부담이 일부 낮아질 수 있습니다.",
    importanceReason: "금리 변화는 미래 이익의 현재 가치 평가에 직접 연결됩니다.",
    relatedSymbol: "KQ150",
    sentimentHint: "POSITIVE"
  }
];

const sampleNewsDetailById: Record<number, NewsDetail> = {
  1: {
    id: 1,
    title: "반도체 수출 회복세, 대형주 실적 기대감 확대",
    category: "국내증시",
    publishedAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
    summary: "반도체 업황 회복 신호가 이어지며 국내 대형 기술주의 실적 기대가 커지고 있습니다.",
    rawContent:
      "산업통상자원부가 발표한 이달 수출 잠정치에 따르면 반도체 수출액이 전년 동월 대비 두 자릿수 증가율을 기록했다. HBM(고대역폭 메모리) 수요 확대와 서버용 메모리 가격 상승이 실적 개선을 이끌었다는 분석이다. 증권가에서는 삼성전자와 SK하이닉스의 4분기 영업이익 전망치를 잇달아 상향 조정하고 있다.\n\n다만 일각에서는 반도체 업황이 이미 주가에 상당 부분 선반영됐다는 우려도 나온다. 기준금리 정책 방향과 환율 변동성도 변수로 꼽힌다. 전문가들은 실적 발표 시즌을 앞두고 개별 종목의 가이던스를 확인하는 것이 중요하다고 조언한다.",
    importanceReason: "수출과 실적 전망은 주가 방향을 판단하는 핵심 근거입니다.",
    relatedSymbol: "005930",
    relatedSymbolName: "삼성전자",
    sentimentHint: "POSITIVE",
    keyTerms: ["반도체", "HBM", "실적", "기준금리", "환율"],
    levels: {
      beginner:
        "반도체를 많이 만드는 우리나라 회사들이 물건을 해외에 더 많이 팔기 시작했어요. 특히 'HBM'이라는 고성능 메모리가 잘 팔리고 있어서, 삼성전자나 SK하이닉스 같은 큰 회사들이 돈을 더 많이 벌 것이라는 기대가 커지고 있습니다. 다만 이런 기대가 이미 주가에 반영되어 있을 수도 있으니 조심스럽게 지켜봐야 해요.",
      normal:
        "이달 반도체 수출액이 전년 대비 두 자릿수 증가율을 기록하며 업황 회복을 뒷받침했습니다. HBM 수요 확대와 서버용 메모리 가격 상승이 주된 배경으로 지목되며, 증권가는 삼성전자·SK하이닉스의 4분기 영업이익 전망치를 상향 조정하고 있습니다. 다만 선반영 우려와 금리·환율 변수는 여전히 남아 있습니다.",
      analyst:
        "수출 지표 개선은 메모리 스팟가격 상승 사이클과 HBM3E 공급 확대가 맞물린 결과로 해석됩니다. 4분기 영업이익 컨센서스 상향은 이미 진행 중이며, 밸류에이션 재평가(리레이팅) 여부는 12개월 선행 PBR 밴드와 재고 소진 속도에 달려 있습니다. 실적 발표 시 가이던스와 CAPEX 방향성 확인이 관건입니다."
    }
  },
  2: {
    id: 2,
    title: "원달러 환율 변동성 확대, 외국인 수급 주목",
    category: "외환",
    publishedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    summary: "환율이 단기적으로 흔들리면서 외국인 매수세와 수입 비용 부담이 함께 관찰됩니다.",
    rawContent:
      "원달러 환율이 하루 사이 큰 폭으로 오르내리며 변동성이 확대되고 있다. 미국의 기준금리 발언과 국내 수출입 지표가 겹치며 방향성을 예측하기 어려운 장세가 이어지는 중이다. 외국인 투자자들은 최근 사흘 연속 국내 주식을 순매수하며 저가 매수에 나서는 모습이다.\n\n전문가들은 환율 변동성이 확대되면 수입 원자재 비용 부담이 커지는 업종과 수출 채산성이 개선되는 업종이 엇갈릴 수 있다고 설명한다.",
    importanceReason: "환율은 기업 이익과 외국인 자금 흐름에 동시에 영향을 줍니다.",
    relatedSymbol: "KOSPI",
    relatedSymbolName: "코스피",
    sentimentHint: "NEUTRAL",
    keyTerms: ["환율", "기준금리"],
    levels: {
      beginner:
        "원화와 달러를 바꾸는 비율(환율)이 하루에도 크게 오르락내리락하고 있어요. 환율이 오르면 해외에서 물건을 사올 때 더 비싸지고, 반대로 물건을 파는 회사는 유리해질 수 있습니다. 외국인 투자자들은 최근 우리나라 주식을 계속 사들이고 있어요.",
      normal:
        "원달러 환율의 변동성이 커지면서 외국인 수급에 관심이 쏠리고 있습니다. 미국 금리 발언과 국내 수출입 지표가 겹치며 방향성 예측이 어려운 가운데, 외국인은 사흘 연속 순매수를 기록했습니다. 업종별로 수입 비용 부담과 수출 채산성이 엇갈릴 수 있습니다.",
      analyst:
        "달러인덱스와 원화 변동성이 동반 확대되는 국면으로, 캐리 트레이드 청산 리스크와 수출 대형주의 환헤지 비율 점검이 필요합니다. 외국인 순매수 전환은 저평가 매력과 연동된 것으로 보이나, 지속성은 미 연준 정책 경로에 대한 확신도에 좌우될 전망입니다."
    }
  },
  3: {
    id: 3,
    title: "금리 동결 전망 우세, 성장주 밸류에이션 부담 완화",
    category: "국내증시",
    publishedAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
    summary: "기준금리 동결 가능성이 커지며 성장주의 할인율 부담이 일부 낮아질 수 있습니다.",
    rawContent:
      "한국은행 금융통화위원회를 앞두고 시장에서는 기준금리 동결 전망이 우세하다. 물가 상승률이 목표 수준에 근접하면서 추가 인상 압력이 크지 않다는 분석이다. 금리 동결 기대가 커지면서 성장주 중심으로 매수세가 유입되는 모습이다.\n\n다만 미국 연방준비제도의 정책 방향에 따라 국내 통화정책 셈법이 복잡해질 수 있다는 지적도 나온다.",
    importanceReason: "금리 변화는 미래 이익의 현재 가치 평가에 직접 연결됩니다.",
    relatedSymbol: "KQ150",
    relatedSymbolName: "코스닥150",
    sentimentHint: "POSITIVE",
    keyTerms: ["기준금리", "실적"],
    levels: {
      beginner:
        "나라의 기준이 되는 이자율(기준금리)을 이번에는 올리지 않을 것이라는 예상이 많아요. 금리를 올리지 않으면 미래에 돈을 더 벌 것으로 기대되는 성장하는 회사들의 주가가 좀 더 오르기 쉬워집니다.",
      normal:
        "한국은행 금통위를 앞두고 기준금리 동결 전망이 우세합니다. 물가 상승률이 목표 수준에 근접하며 추가 인상 압력이 크지 않다는 분석 속에 성장주로 매수세가 유입되고 있습니다. 다만 미 연준 정책 경로는 여전히 변수입니다.",
      analyst:
        "동결 기대는 물가 서프라이즈 완화와 성장 모멘텀 둔화가 함께 반영된 결과입니다. 할인율(WACC) 하락 기대는 듀레이션이 긴 성장주 밸류에이션에 우호적이나, 한미 금리차 확대에 따른 자본유출 리스크는 상단을 제한하는 요인입니다."
    }
  }
};

export function getSampleNewsDetail(id: number): NewsDetail {
  return (
    sampleNewsDetailById[id] ?? {
      ...sampleNewsDetailById[1],
      id
    }
  );
}

const genericTermFallback: Record<string, TermExplanation> = {
  실적: {
    term: "실적",
    definition: "일정 기간 동안 기업이 거둔 매출, 영업이익 등 경영 성과를 뜻합니다.",
    contextExplanation: "이 뉴스에서는 반도체 기업들의 다음 분기 실적 전망이 개선되고 있다는 맥락으로 쓰였습니다.",
    marketImpact: "실적 전망이 좋아지면 주가에 긍정적으로 반영되는 경우가 많습니다."
  },
  반도체: {
    term: "반도체",
    definition: "전기가 흐르거나 흐르지 않는 성질을 조절할 수 있는 소재로, 메모리·연산 등 전자기기의 핵심 부품입니다.",
    contextExplanation: "이 뉴스에서는 국내 수출을 이끄는 주력 산업으로 언급되었습니다.",
    marketImpact: "반도체 업황은 국내 대형 기술주 주가에 큰 영향을 줍니다."
  },
  HBM: {
    term: "HBM",
    definition: "High Bandwidth Memory의 약자로, AI 서버 등에 쓰이는 고대역폭·고성능 메모리 반도체입니다.",
    contextExplanation: "이 뉴스에서는 수요 확대가 실적 개선의 핵심 요인으로 언급되었습니다.",
    marketImpact: "HBM 공급 능력은 메모리 기업의 밸류에이션을 좌우하는 요인 중 하나입니다."
  },
  기준금리: {
    term: "기준금리",
    definition: "중앙은행이 시중 은행과 거래할 때 적용하는 정책금리로, 시장 금리의 기준이 됩니다.",
    contextExplanation: "이 뉴스에서는 금리 동결 여부가 시장 심리에 미치는 영향을 다루고 있습니다.",
    marketImpact: "금리가 오르면 대출 부담과 할인율이 커져 주가에는 대체로 부담 요인이 됩니다."
  },
  환율: {
    term: "환율",
    definition: "한 나라의 통화를 다른 나라 통화로 교환하는 비율입니다.",
    contextExplanation: "이 뉴스에서는 원달러 환율 변동이 수출입 기업과 외국인 수급에 미치는 영향을 다루고 있습니다.",
    marketImpact: "환율 상승은 수출기업 채산성에 유리하고 수입기업에는 부담이 될 수 있습니다."
  }
};

export function getFallbackTermExplanation(term: string): TermExplanation {
  return (
    genericTermFallback[term] ?? {
      term,
      definition: `${term}에 대한 설명을 준비 중입니다.`,
      contextExplanation: "이 뉴스 문맥에서의 자세한 설명은 잠시 후 다시 시도해주세요.",
      marketImpact: "일반적으로 이런 용어는 기업 실적이나 시장 심리와 연결되어 주가에 영향을 줄 수 있습니다."
    }
  );
}

export const KEY_TERM_DICTIONARY = Object.keys(genericTermFallback);

export const sampleMarketSummary: MarketSummary = {
  kospi: { label: "KOSPI", value: "2,814.22", change: "+0.42%", tone: "up" },
  kosdaq: { label: "KOSDAQ", value: "812.55", change: "+0.31%", tone: "up" },
  exchangeRate: { label: "원/달러", value: "1,382.10", change: "-0.18%", tone: "down" },
  baseRate: { label: "기준금리", value: "3.50%", change: "동결", tone: "flat" }
};

export const popularStocks: PopularStock[] = [
  { symbol: "005930", name: "삼성전자", price: 71800, changePercent: 0.84 },
  { symbol: "000660", name: "SK하이닉스", price: 189200, changePercent: 1.72 },
  { symbol: "035420", name: "NAVER", price: 214500, changePercent: -0.46 },
  { symbol: "035720", name: "카카오", price: 41850, changePercent: -0.95 },
  { symbol: "373220", name: "LG에너지솔루션", price: 398000, changePercent: 0.25 }
];

function seededRandom(seed: number): () => number {
  let value = seed;
  return () => {
    value = (value * 9301 + 49297) % 233280;
    return value / 233280;
  };
}

function symbolSeed(symbol: string): number {
  let seed = 0;
  for (let i = 0; i < symbol.length; i += 1) {
    seed += symbol.charCodeAt(i) * (i + 1);
  }
  return seed || 1;
}

export function generateSampleChartPoints(symbol: string, basePrice: number, days = 30): ChartPoint[] {
  const random = seededRandom(symbolSeed(symbol));
  const points: ChartPoint[] = [];
  let value = basePrice * 0.94;
  const today = new Date();

  for (let i = days - 1; i >= 0; i -= 1) {
    const date = new Date(today);
    date.setDate(today.getDate() - i);
    const drift = (random() - 0.46) * basePrice * 0.015;
    value = Math.max(basePrice * 0.8, value + drift);
    points.push({ date: date.toISOString().slice(0, 10), value: Math.round(value) });
  }

  // Make sure the series ends near the "current" price for a coherent chart.
  points[points.length - 1] = { date: points[points.length - 1].date, value: basePrice };
  return points;
}

export function getSamplePopularStock(symbol: string): PopularStock {
  return (
    popularStocks.find((stock) => stock.symbol === symbol) ?? {
      symbol,
      name: symbol,
      price: 50000,
      changePercent: 0.5
    }
  );
}

export interface ChartDocentContent {
  insightTitle: string;
  whatHappened: string;
  whyItMoved: string;
  marketImpact: string;
}

const chartDocentBySymbol: Record<string, ChartDocentContent> = {
  "005930": {
    insightTitle: "AI 반도체 수요 증가 발표",
    whatHappened: "글로벌 빅테크 기업들이 AI 서버 투자를 확대한다고 밝히며 관련 메모리 수요 전망이 상향 조정됐습니다.",
    whyItMoved: "HBM 등 고부가 메모리 공급 계약이 늘어날 것이라는 기대가 반영되며 매수세가 유입됐습니다.",
    marketImpact: "메모리 반도체 밸류체인 전반에 긍정적 영향을 줄 수 있으며, 관련 부품·장비주로 관심이 확산될 수 있습니다."
  },
  "000660": {
    insightTitle: "HBM 공급 계약 확대 소식",
    whatHappened: "주요 고객사와의 차세대 HBM 공급 물량 협상이 진전되고 있다는 소식이 전해졌습니다.",
    whyItMoved: "공급 안정성과 수익성 개선 기대가 겹치며 투자심리가 개선됐습니다.",
    marketImpact: "메모리 가격 협상력 강화는 실적 개선으로 이어질 가능성이 있습니다."
  }
};

export function getChartDocentContent(symbol: string): ChartDocentContent {
  return (
    chartDocentBySymbol[symbol] ?? {
      insightTitle: "관련 이슈 발생",
      whatHappened: "해당 종목과 관련된 주요 뉴스가 최근 발생하여 주가에 영향을 주고 있습니다.",
      whyItMoved: "수급과 실적 기대감이 함께 반영된 것으로 보입니다.",
      marketImpact: "관련 업종 전반의 투자심리에도 영향을 줄 수 있습니다."
    }
  );
}

export function getSampleChartData(symbolOrName: string): ChartData {
  const stock = popularStocks.find((s) => s.symbol === symbolOrName || s.name === symbolOrName) ?? getSamplePopularStock(symbolOrName);

  return {
    symbol: stock.symbol,
    symbolName: stock.name,
    price: stock.price,
    changePercent: stock.changePercent,
    points: generateSampleChartPoints(stock.symbol, stock.price),
    relatedNews: [
      {
        id: 1,
        title: "반도체 수출 회복세, 대형주 실적 기대감 확대",
        source: "한국경제",
        publishedAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
      },
      {
        id: null,
        title: "AI 반도체 수요 증가 발표, 관련주 동반 강세",
        source: "매일경제",
        publishedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
      }
    ]
  };
}

export function getSampleJudgementFeedback(newsId: number, choice: JudgementChoice, reason?: string): JudgementFeedback {
  const detail = getSampleNewsDetail(newsId);
  const symbol = detail.relatedSymbol && /^\d{6}$/.test(detail.relatedSymbol) ? detail.relatedSymbol : "005930";
  const stock = getSamplePopularStock(symbol);
  const points = generateSampleChartPoints(symbol, stock.price, 14);
  const actualChangePercent = points[points.length - 1].value / points[0].value - 1;
  const actualDirection: JudgementChoice = actualChangePercent > 0.005 ? "UP" : actualChangePercent < -0.005 ? "DOWN" : "NEUTRAL";
  const aligned = choice === actualDirection;

  const reasonsByAlignment = aligned
    ? [
        `${detail.relatedSymbolName || stock.name} 주가는 실제로 ${actualDirection === "UP" ? "상승" : actualDirection === "DOWN" ? "하락" : "보합"}했습니다.`,
        "판단 시점의 뉴스 내용과 실제 주가 흐름의 방향이 일치했습니다.",
        reason ? `작성하신 근거("${reason}")가 실제 결과와 잘 맞아떨어졌습니다.` : "핵심 재료를 잘 짚은 판단이었습니다."
      ]
    : [
        `실제로는 ${detail.relatedSymbolName || stock.name} 주가가 ${actualDirection === "UP" ? "상승" : actualDirection === "DOWN" ? "하락" : "보합권에서 마감"}했습니다.`,
        "예상과 다른 변수(수급, 거시 지표 등)가 추가로 작용했을 가능성이 있습니다.",
        "뉴스 하나만으로 방향을 단정하기보다 여러 지표를 함께 참고하면 도움이 됩니다."
      ];

  return {
    newsId,
    choice,
    aligned,
    message: aligned ? "판단과 실제 결과가 일치했습니다." : "판단과 실제 결과가 달랐어요.",
    actualChangePercent: Math.round(actualChangePercent * 1000) / 10,
    reasons: reasonsByAlignment,
    relatedSymbol: symbol,
    relatedSymbolName: detail.relatedSymbolName || stock.name,
    chart: points,
    judgedAt: new Date().toISOString()
  };
}

export const sampleJudgementHistory: JudgementHistoryItem[] = [
  {
    id: 1001,
    newsId: 1,
    newsTitle: "반도체 수출 회복세, 대형주 실적 기대감 확대",
    choice: "UP",
    actualResult: "+1.8%",
    correct: true,
    judgedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 1002,
    newsId: 2,
    newsTitle: "원달러 환율 변동성 확대, 외국인 수급 주목",
    choice: "NEUTRAL",
    actualResult: "-0.2%",
    correct: true,
    judgedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 1003,
    newsId: 3,
    newsTitle: "금리 동결 전망 우세, 성장주 밸류에이션 부담 완화",
    choice: "UP",
    actualResult: "-0.6%",
    correct: false,
    judgedAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString()
  }
];

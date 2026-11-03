import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {cleanNewsCardText,newsCardPoint,newsCardSummary,articleParagraph,publisherName,newsImageUrl} from './newsPresentation.ts';
test('cards strip level labels and ticker codes from every level without damaging amounts',()=>{
 for(const label of ['사실','전망','분석']) {
  const value=newsCardSummary(`[${label}] 삼성전자[005930]와 SK하이닉스(000660)의 매출은 12.5% 늘었다.\n\n[사실] 이익은 3조원이다.\n\n[전망] 세 번째 문단이다.`);
  assert(!/\[|005930|000660|\n|세 번째/.test(value));
  assert.match(value,/12.5%/);assert.match(value,/3조원/);
 }
 assert.equal(newsCardSummary('가'.repeat(300)).length,150);
 assert.equal(cleanNewsCardText('[마켓뷰] 코스피 향방'), '[마켓뷰] 코스피 향방');
 const card=fs.readFileSync(new URL('../components/NewsCard.tsx',import.meta.url),'utf8');
 assert.match(card,/styles.summary\} numberOfLines=\{2\}/);assert.match(card,/maxHeight:42/);
});
test('normal detail labels are separate badges while other reading text stays intact',()=>{
 assert.deepEqual(articleParagraph('[전망] 매출이 늘 것으로 예상된다.',true),{label:'전망',text:'매출이 늘 것으로 예상된다.'});
 assert.equal(articleParagraph('[사실] 원문',false).label,null);
 const body=fs.readFileSync(new URL('../screens/home/NewsDetailScreen/ArticleBody.tsx',import.meta.url),'utf8');assert.match(body,/styles.badge/);
});
test('publisher credit and safe remote images have explicit no-image fallbacks',()=>{
 assert.equal(publisherName('연합뉴스 경제 최신기사'),'연합뉴스');
 assert.equal(publisherName('한국경제 | 뉴스 | 경제'),'한국경제');
 assert.equal(newsImageUrl('https://cdn.publisher.test/photo.jpg'),'https://cdn.publisher.test/photo.jpg');
 for(const value of ['data:image/png;base64,abc','file:///tmp/a','http://localhost/a','http://127.0.0.1/a','http://172.16.1.1/a','https://user:pass@publisher.test/a'])assert.equal(newsImageUrl(value),null);
 const card=fs.readFileSync(new URL('../components/NewsCard.tsx',import.meta.url),'utf8');assert.match(card,/사진 ·/);assert.match(card,/onError=/);assert.match(card,/categoryColor/);
});

test('card point avoids repeating the quoted fact and keeps its article-specific check',()=>{
 assert.equal(newsCardPoint('“뉴스심리지수가 악화했다.”\n뉴스심리지수의 다음 발표치를 확인하세요.'),'뉴스심리지수의 다음 발표치를 확인하세요.');
});

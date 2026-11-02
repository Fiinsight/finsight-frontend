/** Reorder display indices; server grading always receives the original index. */
export function reshuffleQuizOptions(size:number, previous:number[] = [], random:()=>number = Math.random):number[] {
  const next=Array.from({length:size},(_,index)=>index);
  for(let index=next.length-1;index>0;index--){const other=Math.floor(random()*(index+1));[next[index],next[other]]=[next[other],next[index]];}
  if(next.length>1 && next.every((value,index)=>value===(previous[index]??index))) next.push(next.shift()!);
  return next;
}

import {test} from 'node:test';
import assert from 'node:assert/strict';
import {OPENING_FACT,COUNT_MS,TYPE_START_MS,CHAR_MS,openingFrame} from '../src/opening.js';

test('opening counter stays bounded and reaches the sourced total before typing',()=>{
 assert.equal(openingFrame(0).count,0);
 let previous=0;for(let t=0;t<=COUNT_MS+500;t+=10){const frame=openingFrame(t);assert.ok(frame.count>=previous&&frame.count<=OPENING_FACT.total);previous=frame.count;}
 assert.equal(openingFrame(COUNT_MS).count,49505);
 assert.deepEqual(openingFrame(TYPE_START_MS-1).lines,['','']);
 assert.equal(openingFrame(TYPE_START_MS+CHAR_MS).lines[0],'S');
});

test('opening copy types in order and finishes with the correct scope and ten-species sample',()=>{
 const firstLength=OPENING_FACT.lines[0].length;
 const first=openingFrame(TYPE_START_MS+firstLength*CHAR_MS);
 assert.equal(first.lines[0],OPENING_FACT.lines[0]);assert.equal(first.lines[1],'');assert.equal(first.complete,false);
 const last=openingFrame(20000);assert.deepEqual(last.lines,OPENING_FACT.lines);assert.equal(last.complete,true);assert.equal(last.count,49505);
 assert.match(last.lines[1],/10/);assert.match(OPENING_FACT.source,/^https:\/\/iucn.org\//);assert.equal(OPENING_FACT.date,'9 July 2026');
});

test('reduced motion presents the complete number and message immediately',()=>{
 const frame=openingFrame(0,true);assert.equal(frame.count,49505);assert.deepEqual(frame.lines,OPENING_FACT.lines);assert.equal(frame.complete,true);
});

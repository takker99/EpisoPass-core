// This is based on https://github.com/masui/EpisoPass2020/blob/master/src/crypt.coffee
//
// Toshiyuki Masui @ Pitecan.com
// Last Modified: 2019/12/27
//

/// <reference no-default-lib="true"/>
/// <reference lib="esnext" />
import { createHash } from "https://deno.land/std@0.103.0/hash/mod.ts";

/** 問題と回答候補のペア */
export interface QA {
  /** 問題 */ question: string;
  /** 回答候補 */ answers: string[];
}

/** seedとpasswordを相互変換する関数
 *
 * 常にcrypt(crypt(seed)) === seedが成立する
 *
 */
export interface Crypt {
  (seed: string): string;
}

/** seedとpasswordを相互変換する関数を作る
 *
 * @param qaList - 使用する問題と回答候補のペアのリスト
 * @param answers - 回答番号のリスト
 */
export function generateCrypt(qaList: QA[], answers: number[]): Crypt {
  const secretKey = makeSecretKey(qaList, answers);

  return (seed) => {
    // ハッシュ値ぽいときHex文字だけ使うことにする。ちょっと心配だが...
    // Hex文字が32文字以上で、数字と英字が入ってればまぁハッシュ値と思って良いのではないか...
    // TODO:変換方法を外部から指定できるようにする？
    const useHex = seed.match(/[0-9a-f]{32}/) && seed.match(/[a-f]/) &&
      seed.match(/[0-9]/);

    // secret_stringのMD5の32バイト値の一部を取り出して数値化し、
    // その値にもとづいて文字置換を行なう
    const hash = createHash("md5");
    hash.update(secretKey);
    const hashString = hash.toString();
    return [...Array(seed.length).keys()].map((i) => {
      const j = i % 8;
      const s = hashString.substring(j * 4, (j * 4) + 4);
      const n = parseInt(s, 16);
      return cryptChar(seed[i], n + i, useHex ? hexcharset : origcharset);
    }).join("");
  };
}

function makeSecretKey(qaList: QA[], answers: number[]) {
  if (qaList.length > answers.length) {
    throw Error("The number of answers must be larger than the number of QA");
  }
  for (let i = 0; i < qaList.length; i++) {
    if (qaList[i].answers.length - 1 < answers[i]) {
      throw RangeError(
        `out of range: answers=${JSON.stringify(qaList[i].answers)}, index = ${
          answers[i]
        }`,
      );
    }
  }

  return qaList.map((qa, index) =>
    `${qa.question}${qa.answers[answers[index]]}`
  ).join("");
}

//  文字種ごとに置換を行なうためのテーブル
const origcharset = [
  "abcdefghijklmnopqrstuvwxyz",
  "ABCDEFGHIJKLMNOPQRSTUVWXYZ",
  "0123456789",
  "-",
  "~!@#$%^&*()_=+[{]}|;:.,#?",
  " ",
  "\"'/<>\\`",
];

const hexcharset = [
  "0123456789abcdef",
];

function selectCharTable(c: string, charset: string[]) {
  return charset.find((char) => char.includes(c)) ?? "";
}

/** crypt_char(crypt_char(c,n),n) == c になるような文字置換関数
 *
 * @param c 変換対象の文字列
 *
 */
function cryptChar(
  c: string,
  n: number,
  charset: string[] = origcharset,
) {
  const chars = selectCharTable(c, charset); // 変換候補の文字のリスト
  const cind = chars.indexOf(c);
  const ind = ((n - cind) + chars.length) % chars.length;
  return chars[ind];
}

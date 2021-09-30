import { generateCrypt } from "./mod.ts";
import { data } from "https://scrapbox.io/api/code/villagepump/Episopassのアルゴリズム/data.ts";

const qas = data.questions.slice(0, 10).map((question) => ({
  question,
  answers: data.answers,
}));
const crypt = generateCrypt(qas, [2, 5, 3, 1, 6, 8, 23, 7, 3, 1]);
console.log(crypt("aaa"));

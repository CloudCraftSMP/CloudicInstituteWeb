const csv = require("csvtojson");
const axios = require("axios").default;
const express = require("express");
const router = express.Router();

const sql = require("../sqlhandler").con;

String.prototype.replaceAt = function(index, replacement) {
    return this.substring(0, index) + replacement + this.substring(index + replacement.length);
}

async function asyncForEach(array, callback) {
  for (let index = 0; index < array.length; index++) {
    await callback(array[index], index, array);
  }
}

async function searchSampa(term, res) {
    return new Promise((resolve, reject) => {
        sql.query(
            "SELECT SAMPA FROM `IS_PRON` WHERE WORD=?",
            [term],
            async (error, rows) => {
              if (error) return res.sendStatus(500);
              if (rows.length == 0) return resolve("D");
    
              resolve(rows[0].SAMPA);
    
            }
          );
    });
}

async function latinToCyrillic(text) {
    return new Promise((resolve, reject) => {

        text = text.replaceAll('\u0303', ''); // remove tilde diacritic - double letters

        text = text.replaceAll('hj', 'Х');
        text = text.replaceAll('rs', 'Ш');
        text = text.replaceAll('rd', 'Д');
        text = text.replaceAll('cj', 'Ч');
        text = text.replaceAll('hv', 'КВ');
        text = text.replaceAll('kj', 'Щ');

        text = text.replaceAll('jä', 'Я');
        text = text.replaceAll('ja', 'Я');
        text = text.replaceAll('je', 'Е');
        text = text.replaceAll('ji', 'Ї');
        text = text.replaceAll('jo', 'Ё');
        text = text.replaceAll('ju', 'Ю');

        text = text.replaceAll('a', 'А');
        text = text.replaceAll('á', 'ау');
        text = text.replaceAll('æ', 'ай');
        text = text.replaceAll('b', 'Б');
        text = text.replaceAll('d', 'Д');
        text = text.replaceAll('ð', 'Ж');
        text = text.replaceAll('e', 'Э');
        text = text.replaceAll('é', 'эй');
        text = text.replaceAll('f', 'Ф');
        text = text.replaceAll('g', 'Г');
        text = text.replaceAll('ǵ', 'Х');
        text = text.replaceAll('h', 'Х');
        text = text.replaceAll('i', 'І');
        text = text.replaceAll('í', 'И');
        text = text.replaceAll('j', 'Ј');
        text = text.replaceAll(' k', ' Щ'); // k at the start of a word
        text = text.replaceAll('k', 'К'); // remaining k's
        text = text.replaceAll('l', 'Л');
        text = text.replaceAll('ḷ', 'Ӆ');
        text = text.replaceAll('m', 'М');
        text = text.replaceAll('ṃ', 'Ӎ');
        text = text.replaceAll('n', 'Н');
        text = text.replaceAll('o', 'О');
        text = text.replaceAll('ó', 'уй');
        text = text.replaceAll('œ', 'уй');
        text = text.replaceAll('p', 'П');
        text = text.replaceAll('r', 'Р');
        text = text.replaceAll('s', 'С');
        text = text.replaceAll('t', 'Т');
        text = text.replaceAll('u', 'Ӧ');
        text = text.replaceAll('v', 'В');
        text = text.replaceAll('y', 'Ӱ');
        text = text.replaceAll('þ', 'З');
        text = text.replaceAll('å', 'О');
        text = text.replaceAll('ä', 'Я');
        text = text.replaceAll('ö', 'Ӧ');
        text = text.replaceAll('ü', 'У');

        resolve(text);
    });
}

async function ipaToOrthography(ipa) {
    return new Promise(async (resolve, reject) => {

        ipa = ipa.replaceAll('hv', 'kv');

        ipa = ipa.replaceAll('ai', 'æ');
        ipa = ipa.replaceAll('au', 'á');
        ipa = ipa.replaceAll('ei', 'é');
        ipa = ipa.replaceAll('ouː', 'ó');
        ipa = ipa.replaceAll('ou', 'ó');
        ipa = ipa.replaceAll('ɔi', '*');

        ipa = ipa.replaceAll('ɑ', 'a');
        ipa = ipa.replaceAll('b', 'b');
        ipa = ipa.replaceAll('t', 'd');
        ipa = ipa.replaceAll('ð', 'ð');
        ipa = ipa.replaceAll('e', 'e');
        ipa = ipa.replaceAll('f', 'f');
        ipa = ipa.replaceAll('ɡ', 'g'); // confusing
        ipa = ipa.replaceAll('x', 'ǵ');
        ipa = ipa.replaceAll('h', 'h');
        ipa = ipa.replaceAll('ɪ', 'i');
        ipa = ipa.replaceAll('i', 'í');
        ipa = ipa.replaceAll('j', 'j');
        ipa = ipa.replaceAll(' ɕ', ' k');
        ipa = ipa.replaceAll('ɕ', 'kj');
        ipa = ipa.replaceAll('l', 'l');
        ipa = ipa.replaceAll('l̥', 'ḷ');
        ipa = ipa.replaceAll('m', 'm');
        ipa = ipa.replaceAll('m̥', 'ṃ');
        ipa = ipa.replaceAll('n', 'n');
        ipa = ipa.replaceAll('p', 'p');
        ipa = ipa.replaceAll('r', 'r');
        ipa = ipa.replaceAll('s', 's');
        ipa = ipa.replaceAll('t', 't');
        ipa = ipa.replaceAll('ø', 'u');
        ipa = ipa.replaceAll('u', 'ü');
        ipa = ipa.replaceAll('ʏ', 'u');
        ipa = ipa.replaceAll('v', 'v');
        ipa =  ipa.replaceAll('y', 'y');
        ipa = ipa.replaceAll('θ', 'þ');
        ipa = ipa.replaceAll('oː', 'å');
        ipa = ipa.replaceAll('ɔ', 'o');
        ipa = ipa.replaceAll('a', 'ä');
        ipa = ipa.replaceAll('œ', 'ö');
        ipa = ipa.replaceAll('ç', 'hj');
        ipa = ipa.replaceAll('ʂ', 'rs');
        ipa = ipa.replaceAll('ɖ', 'rd');
        ipa = ipa.replaceAll('cʰ', 'cj');

        ipa = ipa.replaceAll('ɣː', 'gg'); // is-cl transliteration
        ipa = ipa.replaceAll('ɣ', 'g'); // is-cl transliteration
        ipa = ipa.replaceAll('ɛ', 'e'); // is-cl transliteration

        ipa = ipa.replaceAll('*', 'œ');

        //ipa.replaceAll('ʰ', '\'');
        ipa = ipa.replaceAll('ʰ', '');

        await new Promise((res) => {
            for (var i=0; i<ipa.length; i++) {
                if (ipa[i] == 'ː' && !ipa[i-1].match(/aäáæeéiíoöóuüú/g)) {
                    ipa = ipa.replaceAt(i - 1, ipa[i - 1] + '\u0303');
                };
                if (i == ipa.length - 1) res();
            }
        });

        ipa = ipa.replaceAll('ː', '');
        ipa = ipa.replaceAll('\u0303', '');

        ipa = ipa.replaceAll('dḷ', 'tḷ');
        ipa = ipa.replaceAll('dl', 'tl');

        ipa = ipa.replaceAll('hk', 'k');
        ipa = ipa.replaceAll('kv', 'hv');

        resolve({
            latin: ipa,
            cyrillic: (await latinToCyrillic(ipa)).toLowerCase()
        });
    });
}

router.get("/", (req, res) => {
  return res.sendStatus(200);
});

router.post("/is/pron", async (req, res) => {
  if (!req.body.text) return res.sendStatus(400);

  const sentence = req.body.text.split(' ');
  const pronSentence = [];

  await asyncForEach(sentence, async (word) => {
      pronSentence.push(await searchSampa(word, res));
  });

  const json = await csv()
  .fromStream(require("fs").createReadStream("sampa_ipa_single.csv"));

  const tempIpa = [];
  await asyncForEach(pronSentence, async (sampaWord) => {
    const tempIpaWord = [];
    await asyncForEach(sampaWord.split(' '), async (sampaChar) => {
        tempIpaWord.push(json.find(el => el.sampa === sampaChar).ipa);
    });
    tempIpa.push(tempIpaWord.join(''));
  });

  return res.status(200).send({ request: req.body, sampa: pronSentence.join(' '), ipa: tempIpa.join(' ') });
});

router.post("/is-cl/tran", async (req, res) => {
    if (!req.body.text) return res.sendStatus(400);

    const response = await axios.post(`http://localhost:${require('../config.json').port}/api/is/pron`, { text: req.body.text });

    return res.status(200).send({ request: req.body, sampa: response.data.sampa, ipa: response.data.ipa, transliteration: await ipaToOrthography(response.data.ipa) });
});

module.exports = router;

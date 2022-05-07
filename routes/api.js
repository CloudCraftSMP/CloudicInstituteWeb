const csv = require("csvtojson");
const axios = require("axios").default;
const aws = require('aws-sdk');
const express = require("express");
const router = express.Router();

const sql = require("../sqlhandler").con;

const Polly = new aws.Polly({ signatureVersion: 'v4', region: 'us-east-1' });

const vowels = /[aäáæeéiíoöóœuú]/g;

const vowelsList = new String(vowels).split('/')[1].split('');

const frontVowels = /[äöuyæá]/g;
const backVowels = /[aåúœó]/g;
const midVowels = /[ioe]/g;

const firstDipthongVowelsI = /[eao]/g;
const firstDipthongVowelsU = /[ao]/g;

String.prototype.replaceAt = function(index, replacement) {
    return this.substring(0, index) + replacement + this.substring(index + replacement.length);
}

function removeDuplicateCharacters(string) {
    return string
      .split('')
      .filter(function(item, pos, self) {
        return self.indexOf(item) == pos;
      })
      .join('');
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
        text = text.replaceAll('já', 'Яу');
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
        text = text.replaceAll('ú', 'У');

        resolve(text.toLowerCase());
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
        ipa = ipa.replaceAll('u', 'ú');
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
                if (ipa[i] == 'ː' && !ipa[i-1].match(vowels)) {
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

async function orthographyToIpa(text) {
    return new Promise(async (resolve, reject) => {

        text = text.replaceAll('hj', 'ç');
        text = text.replaceAll('rs', 'ʂ');
        text = text.replaceAll('rd', 'ɖ');
        text = text.replaceAll('cj', 'cʰ');

        text = text.replaceAll('tt', 'tl');

        text = text.replaceAll('gg', 'k');

        text = text.replaceAll('hv', 'kv');

        text = text.replaceAll('a', 'ɑ');
        text = text.replaceAll('b', 'b');
        text = text.replaceAll('d', 't');
        text = text.replaceAll('ð', 'ð');
        text = text.replaceAll('e', 'e');
        text = text.replaceAll('f', 'f');
        if (text[0] == "g") { text.replaceAll('g', 'k'); text = 'g' + text.substring(1); } else text = text.replaceAll('g', 'k');
        text = text.replaceAll('ǵ', 'x');
        text = text.replaceAll('h', 'h');
        text = text.replaceAll('i', 'ɪ');
        text = text.replaceAll('í', 'i');
        text = text.replaceAll('j', 'j');
        text = text.replaceAll(' k', ' ɕ');
        text = text.replaceAll('kj', 'ɕ');
        text = text.replaceAll('l', 'l');
        text = text.replaceAll('ḷ', 'l̥');
        text = text.replaceAll('m', 'm');
        text = text.replaceAll('ṃ', 'm̥');
        text = text.replaceAll('n', 'n');
        text = text.replaceAll('p', 'p');
        text = text.replaceAll('r', 'r');
        text = text.replaceAll('s', 's');
        text = text.replaceAll('t', 't');
        text = text.replaceAll('u', 'ʏ');
        text = text.replaceAll('ú', 'u');
        text = text.replaceAll('v', 'v');
        text = text.replaceAll('y', 'y');
        text = text.replaceAll('þ', 'θ');
        text = text.replaceAll('o', 'ɔ');
        text = text.replaceAll('å', 'oː');
        text = text.replaceAll('ä', 'a');
        text = text.replaceAll('œ', 'ɔi');
        text = text.replaceAll('ö', 'œ');

        text = text.replaceAll('æ', 'ai');
        text = text.replaceAll('á', 'au');
        text = text.replaceAll('é', 'ei');
        text = text.replaceAll('ó', 'ouː');
        text = text.replaceAll('ó', 'ou');

        text = text.replaceAll('\u0303', 'ː');

        resolve({
            latin: text
        });
    });
}

async function verifyWord(word) {
    return new Promise(async (resolve, reject) => {

        if (word.endsWith('t') && !word.endsWith('tt')) word = word + 't';
        if (word.endsWith('n') && !word.endsWith('nn')) word = word + 'n';

        // replace dipthongs
        word = word.replaceAll('ou', 'ó');
        word = word.replaceAll('ai', 'æ');
        word = word.replaceAll('aí', 'æ');
        word = word.replaceAll('äi', 'æ');
        word = word.replaceAll('äí', 'æ');
        word = word.replaceAll('aú', 'ú');

        word = word.replaceAll('õ', 'å');

        for (i in vowelsList) { // replace double vowels
            const vowel = vowelsList[i];
            word = word.replaceAll(vowel + vowel, vowel + '\u0303');
        }

        if (word.match(frontVowels) && word.match(backVowels)) { // if vowel harmony groups collide
            var firstIndex = 50000;
            for (i in new String(frontVowels).split('/')[1].split('')) { // for each front vowel
                var char = new String(frontVowels).split('/')[1].split('')[i];
                if (firstIndex > new String(word).indexOf(char) && new String(word).indexOf(char) != -1) firstIndex = new String(word).indexOf(char);
            }
            for (i in new String(backVowels).split('/')[1].split('')) { // for each back vowel
                var char = new String(backVowels).split('/')[1].split('')[i];
                if (firstIndex < new String(word).indexOf(char) && new String(word).indexOf(char) != -1) firstIndex = new String(word).indexOf(char);
            }

            var group = null;
            if (word[firstIndex].match(frontVowels)) { group = "front"; } else { group = "back"; }
            
            if (group == "front") {
                word = word.replaceAll("a", "ä");
                word = word.replaceAll("ú", "y");
                word = word.replaceAll("œ", "æ");
                word = word.replaceAll("ó", "á");
                word = word.replaceAll("i", "í");

                if (getRandomInt(2) == 0) {
                    word = word.replaceAll("å", "ö");
                } else {
                    word = word.replaceAll("å", "u");
                }

            } else if (group == "back") {
                word = word.replaceAll("ä", "a");
                word = word.replaceAll("ö", "å");
                word = word.replaceAll("u", "å");
                word = word.replaceAll("y", "ú");
                word = word.replaceAll("æ", "œ");
                word = word.replaceAll("á", "ó");
                word = word.replaceAll("í", "i");
            }
        }

        resolve(word);
    });
}

function endsInVowel(word) {
    const wordS = new String(word);
    if (wordS.substring(wordS.length - 1).match(vowels)) return true;
    return false;
}

function getRandomInt(max) {
    return Math.floor(Math.random() * max);
}

router.get("/", async (req, res) => {
  return res.sendStatus(200);
});

router.get("/cl/tts", async (req, res) => {
    if (!req.query.variant) return res.sendStatus(400);
    if (req.query.variant != "latin" && req.query.variant != "cyrillic") return res.sendStatus(400);
    if (!req.query.text) return res.sendStatus(400);

    res.setHeader('Content-disposition', 'attachment; filename=cl-' + req.query.variant + '-' + encodeURIComponent(req.query.text) + '.mp3');
    res.setHeader('Content-type', 'audio/mpeg');

    console.log(await orthographyToIpa(req.query.text));

    let params = {
        "Engine": "standard",
        "Text": `<speak><phoneme alphabet="ipa" ph="${(await orthographyToIpa(req.query.text)).latin}"></phoneme></speak>`,
        "OutputFormat": "mp3",
        "VoiceId": "Karl", // Astrid
        "TextType": "ssml"
    };

    Polly.synthesizeSpeech(params, (err, data) => {
        if (err) return res.status(500).send(err);
        if (data.AudioStream instanceof Buffer) {
            res.send(Buffer.from(data.AudioStream, 'binary'));
        }
    });

})

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

router.post("/is-cl/proto", async (req, res) => {
    if (!req.body.type) return res.sendStatus(400);
    // WORD TYPES TO BE SPECIFIED
    //
    // com - comparative - adjective (eg. more icelandic, greener, cuter)
    // nou - / - noun (eg. dog, fridge, escalator)
    if (!req.body.word) return res.sendStatus(400);
    var word = new String(req.body.word);

    // calcultaiveconst response = await axios.post(`http://localhost:${require('../config.json').port}/api/is/pron`, { text: word });
    //word = (await ipaToOrthography(response.data.ipa)).latin;

    word = word.replace("ý", "í");

    var final = {};
    var chance = 0;
    var probability = {};

    // replace certain consonant clusters
    word = word.replaceAll('ey', 'é');
    word = word.replaceAll('hv', 'v');
    word = word.replaceAll("x", "ǵs");
    word = word.replaceAll("sj", "kj");

    // get stem
    if (req.body.type == "nou") { // noun
        // getting the word stem
        if (word.endsWith('ur')) word = word.substring(0, word.length - 2);
    }
    if (req.body.type == "com") { // adjective
        // getting the word stem
        if (word.endsWith('ri')) word = word.substring(0, word.length - 2);
        if (word.endsWith('ni')) word = word.substring(0, word.length - 2);
    }

    if (word.length <= 3) word = word.replace(vowels, "å")

    var split = [];

    for (i in word.match(/.{1,3}/g)) {
        var tWord = word.match(/.{1,3}/g)[i];

    // 10% chance that u is replaced with e
    chance = getRandomInt(100);
    probability['u-e'] = 100 - chance;
    if (chance <= 10) tWord = tWord.replaceAll("u", "e");

    // 66% chance that ú is replaced with e
    chance = getRandomInt(100);
    probability['ú-e'] = 100 - chance;
    if (chance <= 66) tWord = tWord.replaceAll("ú", "e");

    // 75% chance that u is replaced with ö
    chance = getRandomInt(100);
    probability['u-ö'] = 100 - chance;
    if (chance <= 75) tWord = tWord.replaceAll("u", "ö");

    // 25% chance that a is replaced with ä
    chance = getRandomInt(100);
    probability['a-ä'] = 100 - chance;
    if (chance <= 75) tWord = tWord.replaceAll("a", "ä");

    // 5% chance that ö is replaced with y
    chance = getRandomInt(100);
    probability['ö-y'] = 100 - chance;
    if (chance <= 75) tWord = tWord.replaceAll("ö", "y");
    
    // 70% chance that d is replaced with t
    chance = getRandomInt(100);
    probability['d-t'] = 100 - chance;
    if (chance <= 70) tWord = tWord.replaceAll("d", "t");

    // 5% chance that ll is replaced with tl
    chance = getRandomInt(100);
    probability['ll-tl'] = 100 - chance;
    if (chance <= 5) tWord = tWord.replaceAll("ll", "tl");

    // 50% chance that ll is replaced with n
    chance = getRandomInt(100);
    probability['ll-n'] = 100 - chance;
    if (chance <= 50) tWord = tWord.replaceAll("ll", "n");

    // 50% chance that jö is replaced with 
    chance = getRandomInt(100);
    probability['jö-'] = 100 - chance;
    if (chance <= 50) tWord = tWord.replaceAll("jö", "");

    // 60% chance that æ is replaced with 
    chance = getRandomInt(100);
    probability['jö-'] = 100 - chance;
    if (chance <= 50) tWord = tWord.replaceAll("jö", "");

        // 40% chance that i is replaced with í
        chance = getRandomInt(100);
        probability['i-í'] = 100 - chance;
        if (chance <= 40) tWord = tWord.replaceAll("i", "í");

        // 60% chance that ä is replaced with æ
        chance = getRandomInt(100);
        probability['ä-æ'] = 100 - chance;
        if (chance <= 60) tWord = tWord.replaceAll("ä", "æ");

        // 40% chance that á is replaced with å
        chance = getRandomInt(100);
        probability['á-å'] = 100 - chance;
        if (chance <= 40) tWord = tWord.replaceAll("á", "å");

        // 70% chance that double letters are removed
        chance = getRandomInt(100);
        probability['dbl-sng'] = 100 - chance;
        if (chance <= 70) tWord = removeDuplicateCharacters(tWord);

        // 50% chance that the last letter is a
        chance = getRandomInt(100);
        probability['lastletter:a'] = 100 - chance;
        if (chance <= 50 && !tWord.substring(tWord.length - 1)[0].match(vowels) && tWord.length > 2) tWord = tWord + "a";

        // 30% chance that the last letter is o
        chance = getRandomInt(100);
        probability['lastletter:o'] = 100 - chance;
        if (chance <= 30 && !tWord.substring(tWord.length - 1)[0].match(vowels) && tWord.length > 3) tWord = tWord + "o";

        // 20% chance that s is replaced with rs
        chance = getRandomInt(100);
        probability['s-rs'] = 100 - chance;
        tWord = tWord.replaceAll("ss", "s");
        if (chance <= 20) tWord = tWord.replaceAll("s", "rs");

        // 50% chance that ð is replaced with þ
        chance = getRandomInt(100);
        probability['ð-þ'] = 100 - chance;
        if (chance <= 20) tWord = tWord.replaceAll("ð", "þ");

        // 50% chance that þ is replaced with f at the start
        chance = getRandomInt(100);
        probability['firstletter:þ-f'] = 100 - chance;
        if (chance <= 50 && word[0] == "þ") tWord = 'f' + tWord.substring(1);

        // 50% chance that r is replaced with t at the end
        chance = getRandomInt(100);
        probability['lastletter:r-t'] = 100 - chance;
        if (chance <= 50 && word[word.length - 1] == "r") tWord = tWord.substring(0, tWord.length - 1) + "t";

        split.push(tWord);
    }

    word = split.join('');

    if (word.substring(word.length - 1)[0] == "þ") word = word.substring(0, word.length - 1) + "ð"; // word can't end with þ
    if (word[0] == "å") word = word.replaceAll("å", "a"); // word can't start with å

    // replace vowel clusters / dipthongs
    word = word.replaceAll("ae", "æ");
    word = word.replaceAll("ai", "á");
    word = word.replaceAll("åa", "a");
    word = word.replaceAll("ei", "é");
    word = word.replaceAll("eo", "é");

    if (new String(word).match(/(rs)/g)) if (word.match(/(rs)/g).length > 1) word = word.replace("rs", "kj");

    word = word.replace(/.{1}(rs)/g, "ors");

    word = word.replaceAll("eo", "é");

    if (word.length > 2) if (word[word.length - 1] == "s" && word[word.length - 2] == "r") word = word.substring(0, word.length - 2) + "gga";

    if (word.length > 2) if (word[1] == "s" && word[0] == "r") word = "s" + word.substring(2);

    console.log(word[word.length - 1])

    if (req.body.type == "com") { // adjective

        // calculate affirmative
        final.affirmative = await verifyWord(word);

        // calcultaive comparative
        var wordC = word;
        if (endsInVowel(word)) { wordC = wordC + "m"; } else { wordC = wordC + "um" }
        final.comparative = await verifyWord(wordC);

        // calcultaive superlative
        var wordS = word;
        if (endsInVowel(word)) { wordS = wordS + "u"; } else { wordS = wordS + "u" }
        final.superlative = await verifyWord(wordS);
    }

    final._default = await verifyWord(word);

    return res.status(200).send({ request: req.body, ipa: await orthographyToIpa(await verifyWord(word)), word: final, probability: probability });
});

router.post("/cl/decline", async (req, res) => {
    if (!req.body.type) return res.sendStatus(400);
    // WORD TYPES TO BE SPECIFIED
    //
    // adj - adjective (eg. icelandic, red, cute)       - affirmative
    // nou - noun      (eg. dog, fridge, escalator)     - nominative sg.
    // num - numeral   (eg. one, two, three)            - cardinal
    // ver - verb      (eg. to write, to speak, to die) - infinitive
    if (!req.body.word) return res.sendStatus(400);

    var word = req.body.word;
    var final = {};

    if (req.body.type == "nou") {
        final.sg = {};
        final.pl = {};

        // calculate singular nominative
        final.sg.nominative = {
            latin: await verifyWord(word),
            cyrillic: await latinToCyrillic(await verifyWord(word)),
            ipa: await orthographyToIpa(await verifyWord(word)),
        }

        // calculate plural nominative
        var wordPNom = word;
        if (endsInVowel(word)) { wordPNom = wordPNom + "d"; } else { wordPNom = wordPNom + "íd" }
        if (word.match(firstDipthongVowelsI) || word.match(firstDipthongVowelsU)) wordPNom = wordPNom.substring(0, wordPNom.length - 1) + "ð";
        final.pl.nominative = {
            latin: await verifyWord(wordPNom),
            cyrillic: await latinToCyrillic(await verifyWord(wordPNom)),
            ipa: await orthographyToIpa(await verifyWord(wordPNom)),
        }

        // calculate singular genitive
        var wordSGen = word;
        if (endsInVowel(word)) { wordSGen = wordSGen + "ú"; } else { wordSGen = wordSGen + "ú" }
        final.sg.genitive = {
            latin: await verifyWord(wordSGen),
            cyrillic: await latinToCyrillic(await verifyWord(wordSGen)),
            ipa: await orthographyToIpa(await verifyWord(wordSGen)),
        }

        // calculate plural genitive
        var wordPGen = word;
        if (endsInVowel(word)) { wordPGen = wordPGen + "jen"; } else { wordPGen = wordPGen + "íjen" }
        final.pl.genitive = {
            latin: await verifyWord(wordPGen),
            cyrillic: await latinToCyrillic(await verifyWord(wordPGen)),
            ipa: await orthographyToIpa(await verifyWord(wordPGen)),
        }

        // calculate singular accusative
        var wordPAcc = word;
        if (endsInVowel(word)) { wordPAcc = wordPAcc + wordPAcc[wordPAcc.length - 1] + "r"; } else { wordPAcc = wordPAcc + "ur" }
        final.sg.accusative = {
            latin: await verifyWord(wordPAcc),
            cyrillic: await latinToCyrillic(await verifyWord(wordPAcc)),
            ipa: await orthographyToIpa(await verifyWord(wordPAcc)),
        }

        // calculate plural accusative
        var wordSAcc = word;
        if (endsInVowel(word)) { wordSAcc = wordSAcc + "ð"; } else { wordSAcc = wordSAcc + "íð" } // polysynthetic nominative plural suffix
        wordSAcc = wordSAcc + "ur";
        final.pl.accusative = {
            latin: await verifyWord(wordSAcc),
            cyrillic: await latinToCyrillic(await verifyWord(wordSAcc)),
            ipa: await orthographyToIpa(await verifyWord(wordSAcc)),
        }

        // calculate singular possessive
        var wordSPos = word;
        if (endsInVowel(word)) { wordSPos = wordSPos + "rí"; } else { wordSPos = wordSPos + "rí" }
        final.sg.possessive = {
            latin: await verifyWord(wordSPos),
            cyrillic: await latinToCyrillic(await verifyWord(wordSPos)),
            ipa: await orthographyToIpa(await verifyWord(wordSPos)),
        }

        // calculate plural possessive
        var wordPPos = word;
        if (endsInVowel(word)) { wordPPos = wordPPos + "ð"; } else { wordPPos = wordPPos + "íð" } // polysynthetic nominative plural suffix
        wordPPos = wordPPos + "ri";
        final.pl.possessive = {
            latin: await verifyWord(wordPPos),
            cyrillic: await latinToCyrillic(await verifyWord(wordPPos)),
            ipa: await orthographyToIpa(await verifyWord(wordPPos)),
        }

        // calculate singular illative
        var wordSIll = word;
        if (endsInVowel(word)) { wordSIll = wordSIll + "a"; } else { wordSIll = wordSIll + "a" }
        final.sg.illative = {
            latin: await verifyWord(wordSIll),
            cyrillic: await latinToCyrillic(await verifyWord(wordSIll)),
            ipa: await orthographyToIpa(await verifyWord(wordSIll)),
        }

        // calculate plural illative
        var wordPIll = word;
        if (endsInVowel(word)) { wordPIll = wordPIll + "ð"; } else { wordPIll = wordPIll + "íð" } // polysynthetic nominative plural suffix
        wordPIll = wordPIll + "a";
        final.pl.illative = {
            latin: await verifyWord(wordPIll),
            cyrillic: await latinToCyrillic(await verifyWord(wordPIll)),
            ipa: await orthographyToIpa(await verifyWord(wordPIll)),
        }

        // calculate singular inessive
        var wordSIne = word;
        if (endsInVowel(word)) { wordSIne = wordSIne.substring(0, wordSIne.length - 1) + "s"; } else { wordSIne = wordSIne + "s" }
        final.sg.inessive = {
            latin: await verifyWord(wordSIne),
            cyrillic: await latinToCyrillic(await verifyWord(wordSIne)),
            ipa: await orthographyToIpa(await verifyWord(wordSIne)),
        }

        // calculate plural inessive
        var wordPIne = word;
        if (endsInVowel(word)) { wordPIne = wordPIne + "ð"; } else { wordPIne = wordPIne + "íð" } // polysynthetic nominative plural suffix
        wordPIne = wordPIne + "is";
        final.pl.inessive = {
            latin: await verifyWord(wordPIne),
            cyrillic: await latinToCyrillic(await verifyWord(wordPIne)),
            ipa: await orthographyToIpa(await verifyWord(wordPIne)),
        }

        // calculate singular elative
        var wordSEla = word;
        if (endsInVowel(word)) { wordSEla = wordSEla.substring(0, wordSEla.length - 1) + "sen"; } else { wordSEla = wordSEla + "sen" }
        final.sg.elative = {
            latin: await verifyWord(wordSEla),
            cyrillic: await latinToCyrillic(await verifyWord(wordSEla)),
            ipa: await orthographyToIpa(await verifyWord(wordSEla)),
        }

        // calculate plural elative
        var wordPEla = word;
        if (endsInVowel(word)) { wordPEla = wordPEla + "ð"; } else { wordPEla = wordPEla + "íð" } // polysynthetic nominative plural suffix
        wordPEla = wordPEla + "sen";
        final.pl.elative = {
            latin: await verifyWord(wordPEla),
            cyrillic: await latinToCyrillic(await verifyWord(wordPEla)),
            ipa: await orthographyToIpa(await verifyWord(wordPEla)),
        }

        // calculate singular allative
        var wordSAll = word;
        if (endsInVowel(word)) { wordSAll = wordSAll.substring(0, wordSAll.length - 1) + "únn"; } else { wordSAll = wordSAll + "únn" }
        final.sg.allative = {
            latin: await verifyWord(wordSAll),
            cyrillic: await latinToCyrillic(await verifyWord(wordSAll)),
            ipa: await orthographyToIpa(await verifyWord(wordSAll)),
        }

        // calculate plural allative
        var wordPAll = word;
        if (endsInVowel(word)) { wordPAll = wordPAll + "ð"; } else { wordPAll = wordPAll + "íð" } // polysynthetic nominative plural suffix
        wordPAll = wordPAll + "únn";
        final.pl.allative = {
            latin: await verifyWord(wordPAll),
            cyrillic: await latinToCyrillic(await verifyWord(wordPAll)),
            ipa: await orthographyToIpa(await verifyWord(wordPAll)),
        }

        // calculate singular adessive
        var wordSAde = word;
        if (endsInVowel(word)) { wordSAde = wordSAde + "inn"; } else { wordSAde = wordSAde + "inn" }
        final.sg.adessive = {
            latin: await verifyWord(wordSAde),
            cyrillic: await latinToCyrillic(await verifyWord(wordSAde)),
            ipa: await orthographyToIpa(await verifyWord(wordSAde)),
        }

        // calculate plural adessive
        var wordPAde = word;
        if (endsInVowel(word)) { wordPAde = wordPAde + "ð"; } else { wordPAde = wordPAde + "íð" } // polysynthetic nominative plural suffix
        wordPAde = wordPAde + "inn";
        final.pl.adessive = {
            latin: await verifyWord(wordPAde),
            cyrillic: await latinToCyrillic(await verifyWord(wordPAde)),
            ipa: await orthographyToIpa(await verifyWord(wordPAde)),
        }

        // calculate singular ablative
        var wordSAbl = word;
        if (endsInVowel(word)) { wordSAbl = wordSAbl.substring(0, wordSAbl.length - 1) + "en"; } else { wordSAbl = wordSAbl + "en" }
        final.sg.ablative = {
            latin: await verifyWord(wordSAbl),
            cyrillic: await latinToCyrillic(await verifyWord(wordSAbl)),
            ipa: await orthographyToIpa(await verifyWord(wordSAbl)),
        }

        // calculate plural ablative
        var wordPAbl = word;
        if (endsInVowel(word)) { wordPAbl = wordPAbl + "ð"; } else { wordPAbl = wordPAbl + "íð" } // polysynthetic nominative plural suffix
        wordPAbl = wordPAbl + "en";
        final.pl.ablative = {
            latin: await verifyWord(wordPAbl),
            cyrillic: await latinToCyrillic(await verifyWord(wordPAbl)),
            ipa: await orthographyToIpa(await verifyWord(wordPAbl)),
        }
    }

    if (req.body.type == "adj") {
        // calculate affirmative
        final.affirmative = {
            latin: await verifyWord(word),
            cyrillic: await latinToCyrillic(await verifyWord(word)),
            ipa: await orthographyToIpa(await verifyWord(word)),
        }

        // calculate comparative
        var wordC = word;
        if (endsInVowel(word)) { wordC = wordC + "m"; } else { wordC = wordC + "um" }
        final.comparative = {
            latin: await verifyWord(wordC),
            cyrillic: await latinToCyrillic(await verifyWord(wordC)),
            ipa: await orthographyToIpa(await verifyWord(wordC)),
        }
        
        // calculate superlative
        var wordS = word;
        if (endsInVowel(word)) { wordS = wordS + "u"; } else { wordS = wordS + "u" }
        final.superlative = {
            latin: await verifyWord(wordS),
            cyrillic: await latinToCyrillic(await verifyWord(wordS)),
            ipa: await orthographyToIpa(await verifyWord(wordS)),
        }
    }

    if (req.body.type == "ver") {
        if (word[word.length - 1] != 'a') return res.status(400).send({"error": `${word} is not a valid infinitive verb. Check it ends in 'a', and try again.`});
        if (!req.body.tense) return res.status(400).send({"error": `You must specify the 'tense' parameter, with one of the following values: 'past', 'present', 'future'.`});
        // calculate infinitive
        final.infinitive = {
            latin: await verifyWord(word),
            cyrillic: await latinToCyrillic(await verifyWord(word)),
            ipa: await orthographyToIpa(await verifyWord(word)),
        }

        final.sg = {}; final.pl = {};

        var firstVowelIndex = new String(word).search(vowels);
        var pastTenseInfinitive = word.substring(0, firstVowelIndex + 1) + "de" + word.substring(firstVowelIndex + 1)
        if (req.body.tense == "past") word = pastTenseInfinitive;

        console.log(pastTenseInfinitive);

        // calculate singular first person (I)
        var wordS1 = word + "r";
        final.sg.first = {
            latin: await verifyWord(wordS1),
            cyrillic: await latinToCyrillic(await verifyWord(wordS1)),
            ipa: await orthographyToIpa(await verifyWord(wordS1)),
        }

        // calculate singular second person (You)
        var wordS2 = word.substring(0, word.length - 1) + "in";
        final.sg.second = {
            latin: await verifyWord(wordS2),
            cyrillic: await latinToCyrillic(await verifyWord(wordS2)),
            ipa: await orthographyToIpa(await verifyWord(wordS2)),
        }

        // calculate singular third person (He/She)
        var wordS3 = word + "a";
        final.sg.third = {
            latin: await verifyWord(wordS3),
            cyrillic: await latinToCyrillic(await verifyWord(wordS3)),
            ipa: await orthographyToIpa(await verifyWord(wordS3)),
        }

        // calculate plural first person (We)
        var wordP1 = word.replaceAll("a", "ö").substring(0, word.length - 1) + (req.body.tense == 'future' ? "á" : "um");
        if (req.body.tense == "future") wordP1 = wordP1.replaceAll("ö", "ó");
        final.pl.first = {
            latin: await verifyWord(wordP1),
            cyrillic: await latinToCyrillic(await verifyWord(wordP1)),
            ipa: await orthographyToIpa(await verifyWord(wordP1)),
        }

        // calculate plural second person (You)
        var wordP2 = word.substring(0, word.length - 1) + (req.body.tense == 'future' ? "áð" : "ið");
        final.pl.second = {
            latin: await verifyWord(wordP2),
            cyrillic: await latinToCyrillic(await verifyWord(wordP2)),
            ipa: await orthographyToIpa(await verifyWord(wordP2)),
        }

        // calculate plural third person (They)
        var wordP3 = word.substring(0, word.length - 1) + (req.body.tense == 'future' ? "já" : "ja");
        final.pl.third = {
            latin: await verifyWord(wordP3),
            cyrillic: await latinToCyrillic(await verifyWord(wordP3)),
            ipa: await orthographyToIpa(await verifyWord(wordP3)),
        }
    }

    if (req.body.type == "num") {
        // calculate cardinal
        final.cardinal = {
            latin: await verifyWord(word),
            cyrillic: await latinToCyrillic(await verifyWord(word)),
            ipa: await orthographyToIpa(await verifyWord(word)),
        }

        // calculate ordinal
        var wordO = word;
        if (endsInVowel(word)) { wordO = wordO + "ðin"; } else { wordO = wordO + "in" }
        final.ordinal = {
            latin: await verifyWord(wordO),
            cyrillic: await latinToCyrillic(await verifyWord(wordO)),
            ipa: await orthographyToIpa(await verifyWord(wordO)),
        }
    }

    return res.status(200).send({ request: req.body, word: final });
});

function getNumZeroToNine(num) {
        if (num == 0) return "nótḷ";
        if (num == 1) return "étt";
        if (num == 2) return "två";
        if (num == 3) return "frítt";
        if (num == 4) return "fjóg";
        if (num == 5) return "fått";
        if (num == 6) return "ségga";
        if (num == 7) return "kjö";
        if (num == 8) return "átt";
        if (num == 9) return "ní";
}

function getPrefixZeroToNine(num) {
    if (num == 0) return "nótḷ";
    if (num == 1) return "é";
    if (num == 2) return "två";
    if (num == 3) return "frí";
    if (num == 4) return "fjó";
    if (num == 5) return "få";
    if (num == 6) return "sé";
    if (num == 7) return "kjö";
    if (num == 8) return "á";
    if (num == 9) return "ní";
}

function get0to99(num) {
    if (num < 20) {

        if (num < 10) return getNumZeroToNine(num);
        if (num == 10) return "tí";

        if (num == 11) return "étír";
        if (num == 12) return "tvåtír";
        if (num == 13) return "frítír";
        if (num == 14) return "fjótír";
        if (num == 15) return "fåtír";
        if (num == 16) return "sétír";
        if (num == 17) return "kjötír";
        if (num == 18) return "átír";
        if (num == 19) return "nítír";
    } else {
    var firstDigit = parseInt(new String(num).substring(0, 1));
    var secondDigit = parseInt(new String(num).substring(1, 2));
    return getPrefixZeroToNine(firstDigit) + "tí" + (secondDigit == 0 ? "" : getNumZeroToNine(secondDigit));
    }
}

function get0to999(num) {
    if (num < 100) {
        return get0to99(num);
    } else {
        var firstDigit = parseInt(new String(num).substring(0, 1));
        var lastDigits = parseInt(new String(num).substring(1));
        return getNumZeroToNine(firstDigit) + "hónra" + (lastDigits == 0 ? "" : " og " + get0to99(lastDigits));
    }
}

function get0to9999(num) {
    if (num < 1000) {
        return get0to999(num);
    } else {
        var firstDigit = parseInt(new String(num).substring(0, 1));
        var lastDigits = parseInt(new String(num).substring(1));
        return getNumZeroToNine(firstDigit) + "þysund" + (lastDigits == 0 ? "" : ", " + get0to999(lastDigits));
    }
}

function get0to999999(num) {
    if (num < 10000) {
        return get0to9999(num);
    } else {
        var firstDigit = 0;
        var lastDigits = 0;
        switch (new String(num).length) {
            case 5:
                firstDigit = parseInt(new String(num).substring(0, 2));
                lastDigits = parseInt(new String(num).substring(2));
            case 6:
                firstDigit = parseInt(new String(num).substring(0, 3));
                lastDigits = parseInt(new String(num).substring(3));
        }
        return get0to999(firstDigit) + " þysund" + (lastDigits == 0 ? "" : ", " + get0to999(lastDigits));
    }
}

function get0to999mil(num) {
    if (num < 1000000) {
        return get0to999999(num);
    } else {
        var firstDigit = 0;
        var lastDigits = 0;
        switch (new String(num).length) {
            case 7:
                firstDigit = parseInt(new String(num).substring(0, 1));
                lastDigits = parseInt(new String(num).substring(1));
            case 8:
                firstDigit = parseInt(new String(num).substring(0, 2));
                lastDigits = parseInt(new String(num).substring(2));
            case 9:
                firstDigit = parseInt(new String(num).substring(0, 3));
                lastDigits = parseInt(new String(num).substring(3));
        }
        return get0to999(firstDigit) + " míljóna" + (lastDigits == 0 ? "" : ", " + get0to999999(lastDigits));
    }
}

router.post("/cl/write-numeral", async (req, res) => {
    if (!req.body.numeral && req.body.numeral != 0) return res.sendStatus(400);
    if (isNaN(req.body.numeral)) return res.sendStatus(400);
    if (req.body.numeral < 0) return res.sendStatus(400);

    var num = req.body.numeral;
    var final = "";

    if (num < 20) { // 0 - 19 inclusive
        if (num == 0) final += "nótḷ";
        if (num == 1) final += "étt";
        if (num == 2) final += "två";
        if (num == 3) final += "frítt";
        if (num == 4) final += "fjóg";
        if (num == 5) final += "fått";
        if (num == 6) final += "ségga";
        if (num == 7) final += "kjö";
        if (num == 8) final += "áttä";
        if (num == 9) final += "ní";
        if (num == 10) final += "tí";

        if (num == 11) final += "étír";
        if (num == 12) final += "tvåtír";
        if (num == 13) final += "frítír";
        if (num == 14) final += "fjótír";
        if (num == 15) final += "fåtír";
        if (num == 16) final += "sétír";
        if (num == 17) final += "kjötír";
        if (num == 18) final += "átír";
        if (num == 19) final += "nítír";
    }

    if (num >= 20 && num <= 99) { // 20-99 inclusive
        final += get0to99(num);
    }

    if (num >= 100 && num <= 999) { // 100-999 inclusive
        final += get0to999(num);
    }

    if (num >= 1000 && num <= 9999) { // 1000-9999 inclusive
        final += get0to9999(num);
    }

    if (num >= 10000 && num <= 999999) { // 10000-999999 inclusive
        final += get0to999999(num);
    }

    if (num >= 1000000 && num <= 9999999) { // 1000000-9999999 inclusive
        final += get0to999mil(num);
    }

    return res.status(200).send({ request: req.body, word: final });
});

router.post("/en-cl/translate", async (req, res) => {
    if (!req.body.text) return res.sendStatus(400);

    const originalText     = req.body.text.toLowerCase();
    const cleanedText      = originalText.replace(/[.,!?()]/g, '');
    //const cTA              = cleanedText.split(' ').filter(function(i) { return i != 'the' });
    const sentences        = originalText.split(/(?<!\w\.\w.)(?<![A-Z][a-z]\.)(?<=\.|\?|and|so|but|because|although|or|for)\s/g); // split into sentences
    var finalText          = req.body.text.toLowerCase().replace(/( the )|(the )|( the)/g, " ")
                                                        .replace(/( i'm )/g, ' i am ')
                                                        .replace(/( you're )/g, ' you are ')
                                                        .replace(/( out of )/g, ' frá ')
                                                        .replace(/( in )/g, ' í ')
                                                        .replace(/( into )/g, ' á ')
                                                        .replace(/( off )/g, ' frá ')
                                                        .replace(/( away from )/g, ' frá ó ')
                                                        .replace(/( on )/g, ' ó ')
                                                        .replace(/( onto )/g, ' á ')
                                                        .replace(/( near )/g, ' át ')
                                                        .replace(/( at )/g, ' át ')
                                                        .replace(/( is )/g, ' e ')
                                                        .replace(/( am )/g, ' e ')
                                                        .replace(/( are )/g, ' e ')
                                                        .replace(/( a )/g, ' ')

    await asyncForEach(sentences, async (sentence, si) => {
        const cTA = sentence.replace(/[.,!?()]/g, '').split(' ').filter(function(i) { return i != 'the' });
        var preAccusative = [];

        await asyncForEach(cTA, async (word, i) => {
            const original = word;
            if (original == "the"
                || original == "a"
                || original == "an") return;
    
            if (original == "of" && cTA[i - 1] == "out") return finalText = finalText.replaceAll('out of', 'frá');

            if (original == "of") return finalText = finalText.replaceAll('of', 'að');
    
            // prepositions
            if (original == "and") return finalText = finalText.replaceAll(original, 'og');
            if (original == "or") return finalText = finalText.replaceAll(original, 'ella');
            if (original == "of") return finalText = finalText.replaceAll(original, 'að');
            if (original == "but") return finalText = finalText.replaceAll(original, 'et');
            if (original == "because") return finalText = finalText.replaceAll(original, 'vegnä');
            if (original == "for") return finalText = finalText.replaceAll(original, 'fírir');
            if (original == "than") return finalText = finalText.replaceAll(original, 'en');
            if (original == "more") return finalText = finalText.replaceAll(original, 'mér');
    
            //if (original == "is") return finalText = finalText.replaceAll(original, 'e');
            //if (original == "am") return finalText = finalText.replaceAll(original, 'e');
    
            var type = "verb";

            if (original.match(/\d+/g)) type = "numeral";
    
            // DO NOT USE IF ELSE STATEMENTS SO THE TYPE CAN BE CHANGED TO NOUN IF VERB ETC. ISNT FOUND IN THE TABLE
            if (type == "numeral") {
                var nucase = "cardinal";

                if (original.match(/[a-zA-Z]/g)) { // if it isn't an ordinal number but contains letters too
                    if (original.endsWith("th")) nucase = "ordinal";
                    type = "noun";
                }

                if (!(original.match(/\D+/g) && !original.match(/(th)|(st)|(nd)|(rd)/g))) { // this will run if the "else" block is chosen from above, or the statement isn't ran at all
                    console.log(nucase);
                    var cardinal = nucase == "ordinal" ? original.substring(0, original.length - 2) : original;
                    console.log(cardinal);

                    var numeral = await axios.post(`http://localhost:${require('../config.json').port}/api/cl/write-numeral`, { numeral: cardinal });
                    var conjTable = await axios.post(`http://localhost:${require('../config.json').port}/api/cl/decline`, { word: numeral.data.word, type: "num" });

                    word = conjTable.data.word[nucase].latin;
                }
            }

            if (type == "verb") {
                var tense = "present";
    
                word = await new Promise((resolve) => {
                    sql.query(
                        "SELECT * FROM `CL_VERB` WHERE en_past=? OR en_pres=? OR en_futu=?",
                        [original, original, original],
                        async (error, rows) => {
                            if (error) return res.status(500).send(error);
                            if (rows.length == 0) return resolve(null);
    
                            if (rows[0].en_past == original) tense = "past";
                            if (rows[0].en_pres == original) tense = "present";
                            if (rows[0].en_futu == original) tense = "future";
            
                            resolve(rows[0].cl_pres);
            
                        }
                    );
            });
    
            if (word == null) {
                type = "adjective";
                word = original;
            } else {
                var conjTable = await axios.post(`http://localhost:${require('../config.json').port}/api/cl/decline`, { word: word, type: "ver", tense: tense });
    
                var plural = false;
                var person = "third";
    
                if (cTA[i - 2] == "i" || cTA[i - 1] == "i'm") person = "first";
                if (cTA[i - 2] == "you" || cTA[i - 1] == "you're") person = "second";
                if (cTA[i - 2] == "we") { person = "first"; plural = true; }
                if (cTA[i - 2] == "yall") { person = "second"; plural = true; }
                if (cTA[i - 2] == "they") { person = "third"; plural = true; }
    
                word = conjTable.data.word[plural ? "pl" : "sg"][person].latin;
    
                finalText = finalText.replace("e " + original, word); // replace "is verb" (eng present tense) with "verb"

                preAccusative.push(i);
            }
    
            }

            if (type == "adjective") {
                var acase = "affirmative";

                word = await new Promise((resolve) => {
                    sql.query(
                        "SELECT * FROM `CL_ADJ` WHERE en_affi=? OR en_comp=? OR en_supe=?",
                        [original, original, original],
                        async (error, rows) => {
                            if (error) return res.status(500).send(error);
                            if (rows.length == 0) return resolve(null);
    
                            if (rows[0].en_affi == original) acase = "affirmative";
                            if (rows[0].en_comp == original) acase = "comparative";
                            if (rows[0].en_supe == original) acase = "superlative";
            
                            resolve(rows[0].cl_stem);
            
                        }
                    );
                });

                if (word == null) {
                    type = "pronoun";
                    word = original;
                } else {
                    var conjTable = await axios.post(`http://localhost:${require('../config.json').port}/api/cl/decline`, { word: word, type: "adj" });
        
                    word = conjTable.data.word[acase].latin;
                }
            }

            if (type == "pronoun") {
                if (['my', 'your', 'his', 'her', 'our', 'yalls', 'their'].includes(original)) {
                    if (original == 'my')    word = 'mína';
                    if (original == 'your')  word = 'þína';
                    if (original == 'his')   word = 'sína';
                    if (original == 'her')   word = 'sína';
                    if (original == 'our')   word = 'mínu';
                    if (original == 'yalls') word = 'þínu';
                    if (original == 'their') word = 'hínu';
                } else {
                    type = "noun";
                }
            }
    
            if (type == "noun") {
                var plural = false;
                var possessive = false;
                var accusative = false;
                var ncase = "nominative";

                await asyncForEach(preAccusative, async (wi) => {
                    if (wi < i) { 
                        ncase = "accusative";
                        accusative = true;
                    }
                });
                
                if (word.endsWith("'s")) { word = word.substring(0, word.length - 2); ncase = "genitive" }
    
                if (cTA.length > 1 && i > 0) {
    
                    if (['my', 'your', 'his', 'her', 'their', 'our'].includes(cTA[i - 1])) possessive = true;
                    if (cTA[i - 1].endsWith("'s")) possessive = true;
                    console.log(cTA[i - 1]);
    
                    if (cTA[i - 1] == "into") ncase = "illative";
                    if (cTA[i - 1] == "in") ncase = "inessive";
                    if (cTA[i - 1] == "of" || cTA[i - 2] == "out") ncase = "elative";
    
                    if (cTA[i - 1] == "onto") ncase = "allative";
                    if (cTA[i - 1] == "on") ncase = "adessive";
                    if (cTA[i - 1] == "near") ncase = "adessive";
                    if (cTA[i - 1] == "at") ncase = "adessive";
                    if (cTA[i - 1] == "off") ncase = "ablative";
                    if (cTA[i - 1] == "from" && cTA[i - 2] == "away") ncase = "ablative";
    
                }
    
                const preparse = word;
                
                word = await new Promise((resolve) => {
                    sql.query(
                        "SELECT * FROM `CL_NOUN` WHERE en_sg_nom=? OR en_pl_nom=?",
                        [original, original],
                        async (error, rows) => {
                            if (error) return res.status(500).send(error);
                            if (rows.length == 0) return resolve(null);
    
                            if (rows[0].en_pl_nom == original) plural = true;
            
                            resolve(rows[0].cl_sg_nom);
            
                        }
                    );
            });
    
            if (word == null) word = preparse;
            if (accusative && ncase != "accusative") word = word + (endsInVowel(word) ? "r" : "ur");
            if (possessive) word = word + (endsInVowel(word) ? "ni" : "eni");
            var conjTable = await axios.post(`http://localhost:${require('../config.json').port}/api/cl/decline`, { word: word, type: "nou" });
    
            word = conjTable.data.word[plural ? "pl" : "sg"][ncase].latin;
            }
    
            finalText = finalText.replace(original, word);
        })

    })

    finalText = finalText.replaceAll("  ", " ")
    finalText = finalText.replaceAll("( ", "(")

    return res.status(200).send({ request: req.body, translation: {
            latin: finalText.trim(),
            cyrillic: await latinToCyrillic(finalText.trim()),
            ipa: await orthographyToIpa(finalText.trim()),
    }})
});

module.exports = router;

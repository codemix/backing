import {byteLength, read, write} from "./";

describe('UTF8', function () {

  describe('byteLength()', function () {
    it('should determine the length of an empty string', function () {
      byteLength('').should.equal(0);
    });

    it('should determine the length of an ascii string', function () {
      byteLength('Hello World!').should.equal(12);
    });
  });


  describe('read()', function () {

    it('replacement chars (1 byte sequence)', () => {
      read(new Uint8Array([ 0x80 ]), 0).should.equal(
        '\uFFFD'
      );
      read(new Uint8Array([ 0x7F ]), 0).should.equal(
        '\u007F'
      );
    });

    it('replacement chars (2 byte sequences)', () => {
      read(new Uint8Array([ 0xC7 ]), 0).should.equal(
        '\uFFFD'
      );
      read(new Uint8Array([ 0xC7, 0xB1 ]), 0).should.equal(
        '\u01F1'
      );
      read(new Uint8Array([ 0xC0, 0xB1 ]), 0).should.equal(
        '\uFFFD\uFFFD'
      );
      read(new Uint8Array([ 0xC1, 0xB1 ]), 0).should.equal(
        '\uFFFD\uFFFD'
      );
    });

    it('replacement chars (3 byte sequences)', () => {
      read(new Uint8Array([ 0xE0 ]), 0).should.equal(
        '\uFFFD'
      );
      read(new Uint8Array([ 0xE0, 0xAC ]), 0).should.equal(
        '\uFFFD\uFFFD'
      );
      read(new Uint8Array([ 0xE0, 0xAC, 0xB9 ]), 0).should.equal(
        '\u0B39'
      );
    });

    it('replacement chars (4 byte sequences)', () => {
      read(new Uint8Array([ 0xF4 ]), 0).should.equal(
        '\uFFFD'
      );
      read(new Uint8Array([ 0xF4, 0x8F ]), 0).should.equal(
        '\uFFFD\uFFFD'
      );
      read(new Uint8Array([ 0xF4, 0x8F, 0x80 ]), 0).should.equal(
        '\uFFFD\uFFFD\uFFFD'
      );
      read(new Uint8Array([ 0xF4, 0x8F, 0x80, 0x84 ]), 0).should.equal(
        '\uDBFC\uDC04'
      );
      read(new Uint8Array([ 0xFF ]), 0).should.equal(
        '\uFFFD'
      );
      read(new Uint8Array([ 0xFF, 0x8F, 0x80, 0x84 ]), 0).should.equal(
        '\uFFFD\uFFFD\uFFFD\uFFFD'
      );
    });

    it('replacement chars on 256 random bytes', () => {
      read(new Uint8Array([ 152, 130, 206, 23, 243, 238, 197, 44, 27, 86, 208, 36, 163, 184, 164, 21, 94, 242, 178, 46, 25, 26, 253, 178, 72, 147, 207, 112, 236, 68, 179, 190, 29, 83, 239, 147, 125, 55, 143, 19, 157, 68, 157, 58, 212, 224, 150, 39, 128, 24, 94, 225, 120, 121, 75, 192, 112, 19, 184, 142, 203, 36, 43, 85, 26, 147, 227, 139, 242, 186, 57, 78, 11, 102, 136, 117, 180, 210, 241, 92, 3, 215, 54, 167, 249, 1, 44, 225, 146, 86, 2, 42, 68, 21, 47, 238, 204, 153, 216, 252, 183, 66, 222, 255, 15, 202, 16, 51, 134, 1, 17, 19, 209, 76, 238, 38, 76, 19, 7, 103, 249, 5, 107, 137, 64, 62, 170, 57, 16, 85, 179, 193, 97, 86, 166, 196, 36, 148, 138, 193, 210, 69, 187, 38, 242, 97, 195, 219, 252, 244, 38, 1, 197, 18, 31, 246, 53, 47, 134, 52, 105, 72, 43, 239, 128, 203, 73, 93, 199, 75, 222, 220, 166, 34, 63, 236, 11, 212, 76, 243, 171, 110, 78, 39, 205, 204, 6, 177, 233, 212, 243, 0, 33, 41, 122, 118, 92, 252, 0, 157, 108, 120, 70, 137, 100, 223, 243, 171, 232, 66, 126, 111, 142, 33, 3, 39, 117, 27, 107, 54, 1, 217, 227, 132, 13, 166, 3, 73, 53, 127, 225, 236, 134, 219, 98, 214, 125, 148, 24, 64, 142, 111, 231, 194, 42, 150, 185, 10, 182, 163, 244, 19, 4, 59, 135, 16 ]), 0).should.equal(
        '\uFFFD\uFFFD\uFFFD\u0017\uFFFD\uFFFD\uFFFD\u002C\u001B\u0056\uFFFD\u0024\uFFFD\uFFFD\uFFFD\u0015\u005E\uFFFD\uFFFD\u002E\u0019\u001A\uFFFD\uFFFD\u0048\uFFFD\uFFFD\u0070\uFFFD\u0044\uFFFD\uFFFD\u001D\u0053\uFFFD\uFFFD\u007D\u0037\uFFFD\u0013\uFFFD\u0044\uFFFD\u003A\uFFFD\uFFFD\uFFFD\u0027\uFFFD\u0018\u005E\uFFFD\u0078\u0079\u004B\uFFFD\u0070\u0013\uFFFD\uFFFD\uFFFD\u0024\u002B\u0055\u001A\uFFFD\uFFFD\uFFFD\uFFFD\uFFFD\u0039\u004E\u000B\u0066\uFFFD\u0075\uFFFD\uFFFD\uFFFD\u005C\u0003\uFFFD\u0036\uFFFD\uFFFD\u0001\u002C\uFFFD\uFFFD\u0056\u0002\u002A\u0044\u0015\u002F\uFFFD\u0319\uFFFD\uFFFD\uFFFD\u0042\uFFFD\uFFFD\u000F\uFFFD\u0010\u0033\uFFFD\u0001\u0011\u0013\uFFFD\u004C\uFFFD\u0026\u004C\u0013\u0007\u0067\uFFFD\u0005\u006B\uFFFD\u0040\u003E\uFFFD\u0039\u0010\u0055\uFFFD\uFFFD\u0061\u0056\uFFFD\uFFFD\u0024\uFFFD\uFFFD\uFFFD\uFFFD\u0045\uFFFD\u0026\uFFFD\u0061\uFFFD\uFFFD\uFFFD\uFFFD\u0026\u0001\uFFFD\u0012\u001F\uFFFD\u0035\u002F\uFFFD\u0034\u0069\u0048\u002B\uFFFD\uFFFD\uFFFD\u0049\u005D\uFFFD\u004B\uFFFD\u0726\u0022\u003F\uFFFD\u000B\uFFFD\u004C\uFFFD\uFFFD\u006E\u004E\u0027\uFFFD\uFFFD\u0006\uFFFD\uFFFD\uFFFD\uFFFD\u0000\u0021\u0029\u007A\u0076\u005C\uFFFD\u0000\uFFFD\u006C\u0078\u0046\uFFFD\u0064\uFFFD\uFFFD\uFFFD\uFFFD\u0042\u007E\u006F\uFFFD\u0021\u0003\u0027\u0075\u001B\u006B\u0036\u0001\uFFFD\uFFFD\uFFFD\u000D\uFFFD\u0003\u0049\u0035\u007F\uFFFD\uFFFD\uFFFD\uFFFD\u0062\uFFFD\u007D\uFFFD\u0018\u0040\uFFFD\u006F\uFFFD\uFFFD\u002A\uFFFD\uFFFD\u000A\uFFFD\uFFFD\uFFFD\u0013\u0004\u003B\uFFFD\u0010'
      );
    });

    it('replacement chars for anything in the surrogate pair range', () => {
      read(new Uint8Array([ 0xED, 0x9F, 0xBF ]), 0).should.equal(
        '\uD7FF'
      );
      read(new Uint8Array([ 0xED, 0xA0, 0x80 ]), 0).should.equal(
        '\uFFFD\uFFFD\uFFFD'
      );
      read(new Uint8Array([ 0xED, 0xBE, 0x8B ]), 0).should.equal(
        '\uFFFD\uFFFD\uFFFD'
      );
      read(new Uint8Array([ 0xED, 0xBF, 0xBF ]), 0).should.equal(
        '\uFFFD\uFFFD\uFFFD'
      );
      read(new Uint8Array([ 0xEE, 0x80, 0x80 ]), 0).should.equal(
        '\uE000'
      );
    });

    it('don\'t replace the replacement char', () => {
      read(new Uint8Array([ 0xEF, 0xBF, 0xBD ]), 0).should.equal(
        '\uFFFD'
      );
    });
  });

  describe('write()', function () {

    const array = new Uint8Array(1024 * 1024);
    let offset = 0;

    function writeAndRead (string, message = `Write and read: ${string}`) {
      it(message, () => {
        const result = write(array, offset, string);
        result.should.equal(offset + byteLength(string));
        read(array, offset, result).should.equal(string);
        offset = result;
      });
    }

    writeAndRead('hello world');
    writeAndRead('merry ☃☃☃☃☃');
    writeAndRead(`
      ᚠᛇᚻ᛫ᛒᛦᚦ᛫ᚠᚱᚩᚠᚢᚱ᛫ᚠᛁᚱᚪ᛫ᚷᛖᚻᚹᛦᛚᚳᚢᛗ
      ᛋᚳᛖᚪᛚ᛫ᚦᛖᚪᚻ᛫ᛗᚪᚾᚾᚪ᛫ᚷᛖᚻᚹᛦᛚᚳ᛫ᛗᛁᚳᛚᚢᚾ᛫ᚻᛦᛏ᛫ᛞᚫᛚᚪᚾ
      ᚷᛁᚠ᛫ᚻᛖ᛫ᚹᛁᛚᛖ᛫ᚠᚩᚱ᛫ᛞᚱᛁᚻᛏᚾᛖ᛫ᛞᚩᛗᛖᛋ᛫ᚻᛚᛇᛏᚪᚾ᛬
    `);
    writeAndRead(`
      An preost wes on leoden, Laȝamon was ihoten
      He wes Leovenaðes sone -- liðe him be Drihten.
      He wonede at Ernleȝe at æðelen are chirechen,
      Uppen Sevarne staþe, sel þar him þuhte,
      Onfest Radestone, þer he bock radde.
    `);
    writeAndRead(`
      Sîne klâwen durh die wolken sint geslagen,
      er stîget ûf mit grôzer kraft,
      ich sih in grâwen tägelîch als er wil tagen,
      den tac, der im geselleschaft
      erwenden wil, dem werden man,
      den ich mit sorgen în verliez.
      ich bringe in hinnen, ob ich kan.
      sîn vil manegiu tugent michz leisten hiez.
    `);
    writeAndRead(`
      Monotonic:
      Τη γλώσσα μου έδωσαν ελληνική
      το σπίτι φτωχικό στις αμμουδιές του Ομήρου.
      Μονάχη έγνοια η γλώσσα μου στις αμμουδιές του Ομήρου.
      από το Άξιον Εστί
      του Οδυσσέα Ελύτη

      Polytonic:
      Τὴ γλῶσσα μοῦ ἔδωσαν ἑλληνικὴ
      τὸ σπίτι φτωχικὸ στὶς ἀμμουδιὲς τοῦ Ὁμήρου.
      Μονάχη ἔγνοια ἡ γλῶσσα μου στὶς ἀμμουδιὲς τοῦ Ὁμήρου.
      ἀπὸ τὸ Ἄξιον ἐστί
      τοῦ Ὀδυσσέα Ἐλύτη
    `);

    writeAndRead(`
      На берегу пустынных волн
      Стоял он, дум великих полн,
      И вдаль глядел. Пред ним широко
      Река неслася; бедный чёлн
      По ней стремился одиноко.
      По мшистым, топким берегам
      Чернели избы здесь и там,
      Приют убогого чухонца;
      И лес, неведомый лучам
      В тумане спрятанного солнца,
      Кругом шумел.
    `);

    writeAndRead(`
      ვეპხის ტყაოსანი შოთა რუსთაველი
      ღმერთსი შემვედრე, ნუთუ კვლა დამხსნას სოფლისა შრომასა, ცეცხლს, წყალსა და მიწასა, ჰაერთა თანა მრომასა; მომცნეს ფრთენი და აღვფრინდე, მივჰხვდე მას ჩემსა ნდომასა, დღისით და ღამით ვჰხედვიდე მზისა ელვათა კრთომაასა.
    `);

    writeAndRead(`
      யாமறிந்த மொழிகளிலே தமிழ்மொழி போல் இனிதாவது எங்கும் காணோம்,
      பாமரராய் விலங்குகளாய், உலகனைத்தும் இகழ்ச்சிசொலப் பான்மை கெட்டு,
      நாமமது தமிழரெனக் கொண்டு இங்கு வாழ்ந்திடுதல் நன்றோ? சொல்லீர்!
      தேமதுரத் தமிழோசை உலகமெலாம் பரவும்வகை செய்தல் வேண்டும்.
    `);

    writeAndRead(`
      ಬಾ ಇಲ್ಲಿ ಸಂಭವಿಸು ಇಂದೆನ್ನ ಹೃದಯದಲಿ
      ನಿತ್ಯವೂ ಅವತರಿಪ ಸತ್ಯಾವತಾರ
      ಮಣ್ಣಾಗಿ ಮರವಾಗಿ ಮಿಗವಾಗಿ ಕಗವಾಗೀ...
      ಮಣ್ಣಾಗಿ ಮರವಾಗಿ ಮಿಗವಾಗಿ ಕಗವಾಗಿ
      ಭವ ಭವದಿ ಭತಿಸಿಹೇ ಭವತಿ ದೂರ
      ನಿತ್ಯವೂ ಅವತರಿಪ ಸತ್ಯಾವತಾರ || ಬಾ ಇಲ್ಲಿ |
    `);

    writeAndRead(`
      Sanskrit: ﻿काचं शक्नोम्यत्तुम् । नोपहिनस्ति माम् ॥
      Sanskrit (standard transcription): kācaṃ śaknomyattum; nopahinasti mām.
      Classical Greek: ὕαλον ϕαγεῖν δύναμαι· τοῦτο οὔ με βλάπτει.
      Greek (monotonic): Μπορώ να φάω σπασμένα γυαλιά χωρίς να πάθω τίποτα.
      Greek (polytonic): Μπορῶ νὰ φάω σπασμένα γυαλιὰ χωρὶς νὰ πάθω τίποτα.
      Etruscan: (NEEDED)
      Latin: Vitrum edere possum; mihi non nocet.
      Old French: Je puis mangier del voirre. Ne me nuit.
      French: Je peux manger du verre, ça ne me fait pas mal.
      Provençal / Occitan: Pòdi manjar de veire, me nafrariá pas.
      Québécois: J'peux manger d'la vitre, ça m'fa pas mal.
      Walloon: Dji pou magnî do vêre, çoula m' freut nén må.
      Champenois: (NEEDED)
      Lorrain: (NEEDED)
      Picard: Ch'peux mingi du verre, cha m'foé mie n'ma.
      Corsican/Corsu: (NEEDED)
      Jèrriais: (NEEDED)
      Kreyòl Ayisyen (Haitï): Mwen kap manje vè, li pa blese'm.
      Basque: Kristala jan dezaket, ez dit minik ematen.
      Catalan / Català: Puc menjar vidre, que no em fa mal.
      Spanish: Puedo comer vidrio, no me hace daño.
      Aragonés: Puedo minchar beire, no me'n fa mal .
      Aranés: (NEEDED)
      Mallorquín: (NEEDED)
      Galician: Eu podo xantar cristais e non cortarme.
      European Portuguese: Posso comer vidro, não me faz mal.
      Brazilian Portuguese (8): Posso comer vidro, não me machuca.
      Caboverdiano/Kabuverdianu (Cape Verde): M' podê cumê vidru, ca ta maguâ-m'.
      Papiamentu: Ami por kome glas anto e no ta hasimi daño.
      Italian: Posso mangiare il vetro e non mi fa male.
      Milanese: Sôn bôn de magnà el véder, el me fa minga mal.
      Roman: Me posso magna' er vetro, e nun me fa male.
      Napoletano: M' pozz magna' o'vetr, e nun m' fa mal.
      Venetian: Mi posso magnare el vetro, no'l me fa mae.
      Zeneise (Genovese): Pòsso mangiâ o veddro e o no me fà mâ.
      Sicilian: Puotsu mangiari u vitru, nun mi fa mali.
      Campinadese (Sardinia): (NEEDED)
      Lugudorese (Sardinia): (NEEDED)
      Romansch (Grischun): Jau sai mangiar vaider, senza che quai fa donn a mai.
      Romany / Tsigane: (NEEDED)
      Romanian: Pot să mănânc sticlă și ea nu mă rănește.
      Esperanto: Mi povas manĝi vitron, ĝi ne damaĝas min.
      Pictish: (NEEDED)
      Breton: (NEEDED)
      Cornish: Mý a yl dybry gwéder hag éf ny wra ow ankenya.
      Welsh: Dw i'n gallu bwyta gwydr, 'dyw e ddim yn gwneud dolur i mi.
      Manx Gaelic: Foddym gee glonney agh cha jean eh gortaghey mee.
      Old Irish (Ogham): ᚛᚛ᚉᚑᚅᚔᚉᚉᚔᚋ ᚔᚈᚔ ᚍᚂᚐᚅᚑ ᚅᚔᚋᚌᚓᚅᚐ᚜
      Old Irish (Latin): Con·iccim ithi nglano. Ním·géna.
      Irish: Is féidir liom gloinne a ithe. Ní dhéanann sí dochar ar bith dom.
      Ulster Gaelic: Ithim-sa gloine agus ní miste damh é.
      Scottish Gaelic: S urrainn dhomh gloinne ithe; cha ghoirtich i mi.
      Anglo-Saxon (Runes): ᛁᚳ᛫ᛗᚨᚷ᛫ᚷᛚᚨᛋ᛫ᛖᚩᛏᚪᚾ᛫ᚩᚾᛞ᛫ᚻᛁᛏ᛫ᚾᛖ᛫ᚻᛖᚪᚱᛗᛁᚪᚧ᛫ᛗᛖ᛬
      Anglo-Saxon (Latin): Ic mæg glæs eotan ond hit ne hearmiað me.
      Middle English: Ich canne glas eten and hit hirtiþ me nouȝt.
      English: I can eat glass and it doesn't hurt me.
      English (IPA): [aɪ kæn iːt glɑːs ænd ɪt dɐz nɒt hɜːt miː] (Received Pronunciation)
      English (Braille): ⠊⠀⠉⠁⠝⠀⠑⠁⠞⠀⠛⠇⠁⠎⠎⠀⠁⠝⠙⠀⠊⠞⠀⠙⠕⠑⠎⠝⠞⠀⠓⠥⠗⠞⠀⠍⠑
      Jamaican: Mi kian niam glas han i neba hot mi.
      Lalland Scots / Doric: Ah can eat gless, it disnae hurt us.
      Glaswegian: (NEEDED)
      Gothic (4): ЌЌЌ ЌЌЌЍ Ќ̈ЍЌЌ, ЌЌ ЌЌЍ ЍЌ ЌЌЌЌ ЌЍЌЌЌЌЌ.
      Old Norse (Runes): ᛖᚴ ᚷᛖᛏ ᛖᛏᛁ ᚧ ᚷᛚᛖᚱ ᛘᚾ ᚦᛖᛋᛋ ᚨᚧ ᚡᛖ ᚱᚧᚨ ᛋᚨᚱ
      Old Norse (Latin): Ek get etið gler án þess að verða sár.
      Norsk / Norwegian (Nynorsk): Eg kan eta glas utan å skada meg.
      Norsk / Norwegian (Bokmål): Jeg kan spise glass uten å skade meg.
      Føroyskt / Faroese: Eg kann eta glas, skaðaleysur.
      Íslenska / Icelandic: Ég get etið gler án þess að meiða mig.
      Svenska / Swedish: Jag kan äta glas utan att skada mig.
      Dansk / Danish: Jeg kan spise glas, det gør ikke ondt på mig.
      Sønderjysk: Æ ka æe glass uhen at det go mæ naue.
      Frysk / Frisian: Ik kin glês ite, it docht me net sear.
      Nederlands / Dutch: Ik kan glas eten, het doet mĳ geen kwaad.
      Kirchröadsj/Bôchesserplat: Iech ken glaas èèse, mer 't deet miech jing pieng.
      Afrikaans: Ek kan glas eet, maar dit doen my nie skade nie.
      Lëtzebuergescht / Luxemburgish: Ech kan Glas iessen, daat deet mir nët wei.
      Deutsch / German: Ich kann Glas essen, ohne mir zu schaden.
      Ruhrdeutsch: Ich kann Glas verkasematuckeln, ohne dattet mich wat jucken tut.
      Langenfelder Platt: Isch kann Jlaas kimmeln, uuhne datt mich datt weh dääd.
      Lausitzer Mundart ("Lusatian"): Ich koann Gloos assn und doas dudd merr ni wii.
      Odenwälderisch: Iech konn glaasch voschbachteln ohne dass es mir ebbs daun doun dud.
      Sächsisch / Saxon: 'sch kann Glos essn, ohne dass'sch mer wehtue.
      Pfälzisch: Isch konn Glass fresse ohne dasses mer ebbes ausmache dud.
      Schwäbisch / Swabian: I kå Glas frässa, ond des macht mr nix!
      Deutsch (Voralberg): I ka glas eassa, ohne dass mar weh tuat.
      Bayrisch / Bavarian: I koh Glos esa, und es duard ma ned wei.
      Allemannisch: I kaun Gloos essen, es tuat ma ned weh.
      Schwyzerdütsch (Zürich): Ich chan Glaas ässe, das schadt mir nöd.
      Schwyzerdütsch (Luzern): Ech cha Glâs ässe, das schadt mer ned.
      Plautdietsch: (NEEDED)
      Hungarian: Meg tudom enni az üveget, nem lesz tőle bajom.
      Suomi / Finnish: Voin syödä lasia, se ei vahingoita minua.
      Sami (Northern): Sáhtán borrat lása, dat ii leat bávččas.
      Erzian: Мон ярсан суликадо, ды зыян эйстэнзэ а ули.
      Northern Karelian: Mie voin syvvä lasie ta minla ei ole kipie.
      Southern Karelian: Minä voin syvvä st'oklua dai minule ei ole kibie.
      Vepsian: (NEEDED)
      Votian: (NEEDED)
      Livonian: (NEEDED)
      Estonian: Ma võin klaasi süüa, see ei tee mulle midagi.
      Latvian: Es varu ēst stiklu, tas man nekaitē.
      Lithuanian: Aš galiu valgyti stiklą ir jis manęs nežeidžia
      Old Prussian: (NEEDED)
      Sorbian (Wendish): (NEEDED)
      Czech: Mohu jíst sklo, neublíží mi.
      Slovak: Môžem jesť sklo. Nezraní ma.
      Polska / Polish: Mogę jeść szkło i mi nie szkodzi.
      Slovenian: Lahko jem steklo, ne da bi mi škodovalo.
      Bosnian, Croatian, Montenegrin and Serbian (Latin): Ja mogu jesti staklo, i to mi ne šteti.
      Bosnian, Montenegrin and Serbian (Cyrillic): Ја могу јести стакло, и то ми не штети.
      Macedonian: Можам да јадам стакло, а не ме штета.
      Russian: Я могу есть стекло, оно мне не вредит.
      Belarusian (Cyrillic): Я магу есці шкло, яно мне не шкодзіць.
      Belarusian (Lacinka): Ja mahu jeści škło, jano mne ne škodzić.
      Ukrainian: Я можу їсти скло, і воно мені не зашкодить.
      Bulgarian: Мога да ям стъкло, то не ми вреди.
      Georgian: მინას ვჭამ და არა მტკივა.
      Armenian: Կրնամ ապակի ուտել և ինծի անհանգիստ չըներ։
      Albanian: Unë mund të ha qelq dhe nuk më gjen gjë.
      Turkish: Cam yiyebilirim, bana zararı dokunmaz.
      Turkish (Ottoman): جام ييه بلورم بڭا ضررى طوقونمز
      Bangla / Bengali: আমি কাঁচ খেতে পারি, তাতে আমার কোনো ক্ষতি হয় না।
      Marathi: मी काच खाऊ शकतो, मला ते दुखत नाही.
      Kannada: ನನಗೆ ಹಾನಿ ಆಗದೆ, ನಾನು ಗಜನ್ನು ತಿನಬಹುದು
      Hindi: मैं काँच खा सकता हूँ और मुझे उससे कोई चोट नहीं पहुंचती.
      Tamil: நான் கண்ணாடி சாப்பிடுவேன், அதனால் எனக்கு ஒரு கேடும் வராது.
      Telugu: నేను గాజు తినగలను మరియు అలా చేసినా నాకు ఏమి ఇబ్బంది లేదు
      Sinhalese: මට වීදුරු කෑමට හැකියි. එයින් මට කිසි හානියක් සිදු නොවේ.
      Urdu(3): میں کانچ کھا سکتا ہوں اور مجھے تکلیف نہیں ہوتی ۔
      Pashto(3): زه شيشه خوړلې شم، هغه ما نه خوږوي
      Farsi / Persian(3): .من می توانم بدونِ احساس درد شيشه بخورم
      Arabic(3): أنا قادر على أكل الزجاج و هذا لا يؤلمني.
      Aramaic: (NEEDED)
      Maltese: Nista' niekol il-ħġieġ u ma jagħmilli xejn.
      Hebrew(3): אני יכול לאכול זכוכית וזה לא מזיק לי.
      Yiddish(3): איך קען עסן גלאָז און עס טוט מיר נישט װײ.
      Judeo-Arabic: (NEEDED)
      Ladino: (NEEDED)
      Gǝʼǝz: (NEEDED)
      Amharic: (NEEDED)
      Twi: Metumi awe tumpan, ɜnyɜ me hwee.
      Hausa (Latin): Inā iya taunar gilāshi kuma in gamā lāfiyā.
      Hausa (Ajami) (2): إِنا إِىَ تَونَر غِلَاشِ كُمَ إِن غَمَا لَافِىَا
      Yoruba(4): Mo lè je̩ dígí, kò ní pa mí lára.
      Lingala: Nakokí kolíya biténi bya milungi, ekosála ngáí mabé tɛ́.
      (Ki)Swahili: Naweza kula bilauri na sikunyui.
      Malay: Saya boleh makan kaca dan ia tidak mencederakan saya.
      Tagalog: Kaya kong kumain nang bubog at hindi ako masaktan.
      Chamorro: Siña yo' chumocho krestat, ti ha na'lalamen yo'.
      Fijian: Au rawa ni kana iloilo, ia au sega ni vakacacani kina.
      Javanese: Aku isa mangan beling tanpa lara.
      Burmese: က္ယ္ဝန္‌တော္‌၊က္ယ္ဝန္‌မ မ္ယက္‌စားနုိင္‌သည္‌။ ၎က္ရောင္‌့ ထိခုိက္‌မ္ဟု မရ္ဟိပာ။ (9)
      Vietnamese (quốc ngữ): Tôi có thể ăn thủy tinh mà không hại gì.
      Vietnamese (nôm) (4): 些 ࣎ 世 咹 水 晶 ও 空 ࣎ 害 咦
      Khmer: ខ្ញុំអាចញុំកញ្ចក់បាន ដោយគ្មានបញ្ហារ
      Lao: ຂອ້ຍກິນແກ້ວໄດ້ໂດຍທີ່ມັນບໍ່ໄດ້ເຮັດໃຫ້ຂອ້ຍເຈັບ.
      Thai: ฉันกินกระจกได้ แต่มันไม่ทำให้ฉันเจ็บ
      Mongolian (Cyrillic): Би шил идэй чадна, надад хортой биш
      Mongolian (Classic) (5): ᠪᠢ ᠰᠢᠯᠢ ᠢᠳᠡᠶᠦ ᠴᠢᠳᠠᠨᠠ ᠂ ᠨᠠᠳᠤᠷ ᠬᠣᠤᠷᠠᠳᠠᠢ ᠪᠢᠰᠢ
      Dzongkha: (NEEDED)
      Nepali: ﻿म काँच खान सक्छू र मलाई केहि नी हुन्‍न् ।
      Tibetan: ཤེལ་སྒོ་ཟ་ནས་ང་ན་གི་མ་རེད།
      Chinese: 我能吞下玻璃而不伤身体。
      Chinese (Traditional): 我能吞下玻璃而不傷身體。
      Taiwanese(6): Góa ē-tàng chia̍h po-lê, mā bē tio̍h-siong.
      Japanese: 私はガラスを食べられます。それは私を傷つけません。
      Korean: 나는 유리를 먹을 수 있어요. 그래도 아프지 않아요
      Bislama: Mi save kakae glas, hemi no save katem mi.
      Hawaiian: Hiki iaʻu ke ʻai i ke aniani; ʻaʻole nō lā au e ʻeha.
      Marquesan: E koʻana e kai i te karahi, mea ʻā, ʻaʻe hauhau.
      Inuktitut (10): ᐊᓕᒍᖅ ᓂᕆᔭᕌᖓᒃᑯ ᓱᕋᙱᑦᑐᓐᓇᖅᑐᖓ
      Chinook Jargon: Naika məkmək kakshət labutay, pi weyk ukuk munk-sik nay.
      Navajo: Tsésǫʼ yishą́ągo bííníshghah dóó doo shił neezgai da.
      Cherokee (and Cree, Chickasaw, Cree, Micmac, Ojibwa, Lakota, Náhuatl, Quechua, Aymara, and other American languages): (NEEDED)
      Garifuna: (NEEDED)
      Gullah: (NEEDED)
      Lojban: mi kakne le nu citka le blaci .iku'i le se go'i na xrani mi
      Nórdicg: Ljœr ye caudran créneþ ý jor cẃran.
    `);

    writeAndRead(Array.from({length: 5000}, () => '☃').join(' '), 'Read and write a big string');
    describe('Some correct UTF-8 text', function () {
      writeAndRead("κόσμε");
    });
    describe("Boundary condition test cases", function () {
      describe('First possible sequence of a certain length', function () {
        writeAndRead("�");
        writeAndRead("");
        writeAndRead("ࠀ");
        writeAndRead("𐀀");
        writeAndRead("�����");
        writeAndRead("������");
      });

      describe('Last possible sequence of a certain length', function () {
        writeAndRead("");
        writeAndRead("߿");
        writeAndRead("￿");
        writeAndRead("����");
        writeAndRead("�����");
        writeAndRead("������");
      });

      describe('Other boundary conditions', function () {
         writeAndRead("퟿");
         writeAndRead("");
         writeAndRead("�");
         writeAndRead("􏿿");
         writeAndRead("����");
      });
    });

    describe('Malformed sequences', function () {
      describe('Unexpected continuation bytes', function () {
        writeAndRead("�");
        writeAndRead("�");

        writeAndRead("��");
        writeAndRead("���");
        writeAndRead("����");
        writeAndRead("�����");
        writeAndRead("������");
        writeAndRead("�������");
      });

      describe('Sequence of all 64 possible continuation bytes (0x80-0xbf):', function () {
        writeAndRead(`
          ����������������
          ����������������
          ����������������
          ����������������
        `);
      });

      describe('Lonely start characters', function () {
        writeAndRead("� � � � � � � � � � � � � � � � � � � � � � � � � � � � � � � � ");
        writeAndRead("� � � � � � � � � � � � � � � � ");
        writeAndRead("� � � � � � � � ")
        writeAndRead("� � � � ");
        writeAndRead("� � ");
      });

      describe('Sequences with last continuation byte missing', function () {
        writeAndRead("�");
        writeAndRead("��");
        writeAndRead("���");
        writeAndRead("����");
        writeAndRead("�����");
        writeAndRead("�");
        writeAndRead("��");
        writeAndRead("���");
        writeAndRead("����");
        writeAndRead("�����");
        writeAndRead("� � ");
      });

      describe('Concatenation of incomplete sequences', function () {
        "������������������������������"
      });
    });
  });
});


#!/usr/bin/env python3
import json

with open('i18n/tr.json', 'r', encoding='utf-8') as f:
    data = json.load(f)

c4_lessons = {
  "c4_l1": {
    "title": "Kalibre Edilmi\u015f K\u0131r\u0131lganl\u0131k",
    "duration": "5 dk",
    "steps": {
      "0": {
        "type": "concept",
        "heading": "Yak\u0131nl\u0131k e\u015fle\u015ftirilmi\u015f a\u00e7\u0131kl\u0131kla b\u00fcyar \u2014 h\u0131zl\u0131 a\u00e7\u0131kl\u0131kla de\u011fil.",
        "body": "Yak\u0131nl\u0131k zamanla in\u015fa edilmiyor. Derinlikle in\u015fa ediliyor \u2014 spesifik olarak, hem derinlik hem y\u00f6n a\u00e7\u0131s\u0131ndan e\u015fle\u015ftirilmi\u015f a\u00e7\u0131kl\u0131kla. Biri ger\u00e7ek bir \u015fey payla\u015ft\u0131\u011f\u0131nda, di\u011feri kabaca ayn\u0131 duygusal a\u011f\u0131rl\u0131kta ger\u00e7ek bir \u015fey payla\u015f\u0131r. Bu al\u0131\u015fveri\u015f kar\u015f\u0131l\u0131kl\u0131 oldu\u011funda yak\u0131nl\u0131k birikir. Olmad\u0131\u011f\u0131nda, biri di\u011ferinden daha derindeyken, di\u011feri geri \u00e7ekilir.\n\nBu y\u00fczden \u00e7ok fazlas\u0131n\u0131 \u00e7ok h\u0131zl\u0131 payla\u015fmak ba\u011f yaratm\u0131yor \u2014 rahats\u0131zl\u0131k yarat\u0131yor. Kar\u015f\u0131 taraf o derinli\u011fe kaydolmad\u0131. D\u00fc\u015f\u00fck sosyal fark\u0131ndal\u0131k sinyali veriyor.\n\nKalibre edilmi\u015f k\u0131r\u0131lganl\u0131k anlam\u0131: derinli\u011fini e\u015fle\u015ftir. K\u00fc\u00e7\u00fck, spesifik bir kusur kabul ederse \u2014 yemek yapamaz, park edemez \u2014 ayn\u0131 duygusal a\u011f\u0131rl\u0131kta bir \u015fey payla\u015f. Daha fazlas\u0131 de\u011fil.",
        "examples": {
          "0": { "label": "\u00c7ok derin, \u00e7ok h\u0131zl\u0131 (ka\u00e7\u0131n)", "text": "\"D\u00fcr\u00fcst olmak gerekirse yeni insanlarla tan\u0131\u015f\u0131rken \u00e7ok kayg\u0131lan\u0131yorum. Biraz a\u015f\u0131r\u0131 d\u00fc\u015f\u00fcnc\u00fcyduktan ve son aylar zor ge\u00e7ti.\"" },
          "1": { "label": "E\u015fle\u015ftirilmi\u015f (bunu yap)", "text": "\"Ayn\u0131. Ger\u00e7ekten suyu yakt\u0131m. Gurur duymuyorum.\"" }
        }
      },
      "1": {
        "type": "do_dont",
        "context": "Yemek yapamad\u0131\u011f\u0131n\u0131 itiraf ediyor",
        "dont": "\"Ben de ayn\u0131y\u0131m, mutfakta tam bir felaketim, ve d\u00fcr\u00fcst olmak gerekirse son zamanlarda hayatta da \u2014 garip birka\u00e7 ay ge\u00e7irdim\"",
        "do": "\"Ayn\u0131. Ger\u00e7ekten suyu yakt\u0131m. Gurur duymuyorum.\"",
        "why": "K\u00fc\u00e7\u00fck, spesifik bir \u00f6zellik payla\u015ft\u0131. Hay\u0131r demek bunu e\u015fle\u015ftirilmemi\u015f duygusal derinlik i\u00e7in bir kap\u0131 olarak kullan\u0131yor. Evet demek a\u011f\u0131rl\u0131\u011f\u0131n\u0131 tam olarak e\u015fle\u015ftiriyor: spesifik, biraz oto-ele\u015ftirel, tam."
      },
      "2": {
        "type": "quiz",
        "question": "\"Yeni yemekler denemeye garip \u015fekilde kayg\u0131lan\u0131yorum\" diyor. En iyi e\u015fle\u015ftirilmi\u015f yan\u0131t?",
        "options": {
          "0": {
            "text": "\"Bunu \u00e7ok anl\u0131yorum, d\u00fcr\u00fcst olmak gerekirse bir\u00e7ok \u015fey hakk\u0131nda kayg\u0131 ya\u015f\u0131yorum\"",
            "correct": False,
            "explanation": "K\u00fc\u00e7\u00fck, spesifik bir \u00f6zellik payla\u015ft\u0131. Genel kayg\u0131ya t\u0131rmand\u0131rd\u0131n. Bu onun sundu\u011fundan daha derin ve geni\u015f."
          },
          "1": {
            "text": "\"Ben de ayn\u0131y\u0131m \u2014 gurur duymad\u0131\u011f\u0131m denemeyece\u011fim yiyeceklerin bir listesi var.\"",
            "correct": True,
            "explanation": "E\u015fle\u015ftirilmi\u015f derinlik. Spesifik, biraz oto-fark\u0131ndal\u0131kl\u0131, tam. Ayn\u0131 duygusal a\u011f\u0131rl\u0131k."
          },
          "2": {
            "text": "\"Bu kadar sevimli! Bunu sevdim.\"",
            "correct": False,
            "explanation": "Tamamlay\u0131c\u0131, kar\u015f\u0131l\u0131kl\u0131 de\u011fil. Hi\u00e7bir \u015fey payla\u015fmad\u0131n. Al\u0131\u015fveri\u015f dengesiz."
          }
        }
      },
      "3": {
        "type": "mission",
        "title": "Kalibre Edilmi\u015f Payla\u015f\u0131m\u0131n\u0131 Bul",
        "instruction": "Ger\u00e7ekten k\u00f6t\u00fc oldu\u011fun k\u00fc\u00e7\u00fck, spesifik, tehdit edici olmayan bir \u015feyi belirle. 1-2 c\u00fcmlede s\u00f6ylemeyi pratik yap \u2014 \u00f6z\u00fcr dilemeden, a\u00e7\u0131klama yapmadan.",
        "tips": {
          "0": "Spesifik belirsizden iyi: \"park etmede berbat\u0131m\" > \"biraz felaketim\"",
          "1": "Ger\u00e7ek olmal\u0131 \u2014 performatif k\u0131r\u0131lganl\u0131k an\u0131nda fark ediliyor",
          "2": "Ama\u00e7 insan olmak, k\u0131r\u0131k de\u011fil"
        }
      }
    }
  },
  "c4_l2": {
    "title": "Geri \u00c7ekme",
    "duration": "4 dk",
    "steps": {
      "0": {
        "type": "concept",
        "heading": "Bir \u015fey m\u00fcvakkat olmayabilece\u011fi gibi hissettirdi\u011finde insanlar onu daha \u00e7ok istiyor.",
        "body": "\u0130nsanlar\u0131n tehdit edilen ya da k\u0131s\u0131tlanan \u00f6zg\u00fcrl\u00fc\u011fe tepkisinde tutarl\u0131 bir kal\u0131p var: k\u0131s\u0131tlanan \u015feyi daha az de\u011fil, daha fazla istiyorlar. Bu y\u00fczden \"s\u0131n\u0131rl\u0131 s\u00fcre\" aciliyet yarat\u0131yor. Neden \"bunu alamazs\u0131n\" insanlar\u0131 peinde ko\u015fturuyor. K\u0131s\u0131tlaman\u0131n kendisi sinyaldir.\n\n\u00c7ekim g\u00fcc\u00fcnde ima edilen eri\u015filebilirlik ayn\u0131 \u015fekilde i\u015fliyor. Biri s\u00fcrekli, ko\u015fulsuz ilgi g\u00f6sterdi\u011finde \u2014 hep orada, hep s\u0131cak, hep m\u00fcvakkat \u2014 daha fazlas\u0131n\u0131 istemek i\u00e7in bir \u015fey yok. Arz s\u0131n\u0131rs\u0131z. Aciliyet kayboluyor.\n\nIma edilen eri\u015filebilirli\u011fi geri \u00e7ekmek \u2014 Sand\u0131\u011f\u0131ndan daha az ilgilenildi\u011fini d\u00fc\u015f\u00fcnd\u00fcren ya da dikkatinin ko\u015fulsuz olmad\u0131\u011f\u0131n\u0131 g\u00f6steren \u2014 dinami\u011fi do\u011frudan aktive eder.",
        "examples": {
          "0": { "label": "\u00c7er\u00e7eve", "text": "\"Sana daha \u00f6nce mesaj atacakt\u0131m ama bu konu\u015fman\u0131n bir yere gidip gitmedi\u011finden emin de\u011filtim.\"" },
          "1": { "label": "Ko\u015fullu ilgi", "text": "\"Bekledi\u011fimden daha ilgi \u00e7ekicisin. Bu ya iyi ya da tehlikeli.\"" },
          "2": { "label": "Y\u00fckselen bahisler", "text": "\"Bunu asl\u0131nda s\u0131k yapmam. \u015eu ana kadar de\u011fmeye de\u011fer yap\u0131yorsun.\"" }
        }
      },
      "1": {
        "type": "do_dont",
        "context": "Birka\u00e7 g\u00fcnd\u00fcr konu\u015fma iyi gidiyor",
        "dont": "Her zaman an\u0131nda m\u00fcvakkat olmak, her zaman s\u0131cak, hi\u00e7bir belirsizlik yaratmadan",
        "do": "\"Dn sana mesaj atmamaya \u00e7ok yakla\u015ft\u0131m. Bunun hata olup olmad\u0131\u011f\u0131na hala karar veriyorum.\"",
        "why": "S\u00fcrekli, ko\u015fulsuz eri\u015filebilirlik s\u0131n\u0131rs\u0131z arz sinyali veriyor. Geri \u00e7ekme hafif bir k\u0131tl\u0131k tan\u0131t\u0131yor \u2014 ilgisizlik de\u011fil, ko\u015fulluluk. Onun ilgi d\u00fczeyi varsay\u0131lm\u0131yor, de\u011ferlendiriliyor."
      },
      "2": {
        "type": "quiz",
        "question": "\"Cevap vermeniz neden bu kadar uzun s\u00fcrd\u00fc?\" diyor. En iyi yan\u0131t?",
        "options": {
          "0": {
            "text": "\"Hay\u0131r! Mesguldum :)\"",
            "correct": False,
            "explanation": "Hayat\u0131n i\u00e7in \u00f6z\u00fcr dilemek dikkatini bor\u00e7lu oldu\u011funu sinyaliyor. Dinamik an\u0131nda tersine d\u00f6n\u00fcyor."
          },
          "1": {
            "text": "\"Bu konu\u015fman\u0131n devam etmeye de\u011fer olup olmad\u0131\u011f\u0131na karar veriyordum. Karar hala bekleniyor.\"",
            "correct": True,
            "explanation": "Oyunbaz ama sinyali veriyor: dikkatlin ko\u015fullu. Onu korumak zorunda. Tamamen farkl\u0131 bir \u00e7er\u00e7eve."
          },
          "2": {
            "text": "\"Telefonumda her zaman de\u011filim\"",
            "correct": False,
            "explanation": "\u00d6z\u00fcr dilemekten daha iyi, ama yass\u0131. N\u00f6tr gerilim yaratm\u0131yor. Geri \u00e7ekme gerilim yarat\u0131yor."
          }
        }
      },
      "3": {
        "type": "mission",
        "title": "Bir Mesaj\u0131 Beklet",
        "instruction": "Cevaplamak i\u00e7in a\u00e7\u0131k bir f\u0131rsat\u0131n oldu\u011funda, 2 saat beklet. Cevap verdi\u011finde dikkatinin otomatik de\u011fil ko\u015fullu oldu\u011funu ima eden bir \u015fey s\u00f6yle.",
        "tips": {
          "0": "Gecikmeyi a\u00e7\u0131klama \u2014 bu garip yapar",
          "1": "Ko\u015fulluluk imas\u0131 i\u00e7erikte olmal\u0131, meta'da de\u011fil",
          "2": "Test: ba\u015fka i\u015flerin oldu\u011fu gibi mi g\u00f6r\u00fcn\u00fcyor? Evet ise iyi."
        }
      }
    }
  },
  "c4_l3": {
    "title": "\u00c7er\u00e7eve Kontrolu",
    "duration": "5 dk",
    "steps": {
      "0": {
        "type": "concept",
        "heading": "\u0130nsanlar ger\u00e7ekli\u011fi ya\u015famaz. Yorumlar\u0131n\u0131 ya\u015far.",
        "body": "Ayn\u0131 olay \u00e7er\u00e7eveye ba\u011fl\u0131 olarak z\u0131t \u015feyleri ifade edebilir. Bir iltifat \u00e7evresindeki \u00e7er\u00e7eveye ba\u011fl\u0131 ger\u00e7ek mi yoksa yal\u0131n m\u0131 hissettiriyor. Takma \u00e7er\u00e7eveye g\u00f6re oyunbaz ya da zalim hissettiriyor. \u0130\u00e7erik anlam\u0131 yaratm\u0131yor \u2014 \u00e7er\u00e7eve yarat\u0131yor.\n\nKonu\u015fmada biri her zaman \u00e7er\u00e7eveyi belirliyor. Ya sen yapars\u0131n, ya da kim \u00f6nce belirlemi\u015fse onunkini benimsersin. Dinami\u011fi adland\u0131ran ki\u015fi her iki taraf\u0131n da etkile\u015fimi nas\u0131l ya\u015fad\u0131\u011f\u0131n\u0131 kontrol ediyor. E\u011fer konu\u015fmay\u0131 oyunbaz rekabet olarak tan\u0131mlarsan, bu olur. O bunu tek tarafl\u0131 takip olarak tan\u0131mlarsa, bu olur \u2014 yeniden \u00e7er\u00e7evelemezsen.\n\nHedef: ikiniz de ilgin\u00e7 insanlar olarak birbirinizi ke\u015ffediyorsunuz \u00e7er\u00e7evesi \u2014 tek tarafl\u0131 takip ya da ilgisizlik de\u011fil.",
        "examples": {
          "0": { "label": "O s\u00f6yl\u00fcyor: \"Tam bir \u00e7\u00f6p\u00e7ats\u0131n\"", "text": "Onun \u00e7er\u00e7evesinde: itham. Senin \u00e7er\u00e7evende: \"Sadece ilgin\u00e7 insanlarla.\" \u2014 bunu ona iltifat olarak yeniden \u00e7er\u00e7eveler." },
          "1": { "label": "O s\u00f6yl\u00fcyor: \"Beni etkilemeye \u00e7al\u0131\u015f\u0131yorsun sadece\"", "text": "Onun \u00e7er\u00e7evesinde: meydan okuma. Senin \u00e7er\u00e7evende: \"Etkilemeye de\u011fer olup olmad\u0131\u011f\u0131n\u0131 \u00f6\u011frenmek istiyorum.\" \u2014 de\u011ferlendirmeyi ters d\u00f6nd\u00fcr\u00fcr." }
        }
      },
      "1": {
        "type": "do_dont",
        "context": "\"\u00c7ok k\u0131z g\u00f6r\u00fcnd\u00fc\u011f\u00fcn tipi gibi\" diyor",
        "dont": "\"Hay\u0131r hay\u0131r! Asl\u0131nda \u00e7ok se\u00e7ici ben :)\"",
        "do": "\"\u0130lgin\u00e7 insanlarla konu\u015fuyorum. Bu farkl\u0131 bir \u015fey.\"",
        "why": "Hay\u0131r demek onun \u00e7er\u00e7evesinde oynuyor \u2014 bir su\u00e7lamaya kar\u015f\u0131 kendini savunuyorsun. Evet demek t\u00fcm \u00f6nc\u00fcl\u00fc yeniden \u00e7er\u00e7eveler: kategori hacim de\u011fil, kalite. \u015eimdi sen onu de\u011ferlendiriyorsun, tersi de\u011fil."
      },
      "2": {
        "type": "quiz",
        "question": "\"Sana inanm\u0131yorum\" diyor. En iyi \u00e7er\u00e7eve kontrolu yan\u0131t\u0131?",
        "options": {
          "0": {
            "text": "\"Yemin ederim d\u00fcr\u00fcst\u00fcm! Neden yalan s\u00f6yleyeyim?\"",
            "correct": False,
            "explanation": "Savunmac\u0131. Onun \u00e7er\u00e7evesinin i\u00e7indesin \u2014 seni hen\u00fcz de\u011ferlendirme hakk\u0131 kazan\u0131rken kendini ispat etmeye \u00e7al\u0131\u015f\u0131yorsun."
          },
          "1": {
            "text": "\"Tamam. An\u0131nda anlars\u0131n.\"",
            "correct": True,
            "explanation": "N\u00f6tr ve sakin. Onun \u015f\u00fcphecili\u011finden tehdit almad\u0131n. Bu sakinlik yeniden \u00e7er\u00e7evedir \u2014 hakikatun onun inanmas\u0131na ba\u011fl\u0131 de\u011fil."
          },
          "2": {
            "text": "\"Tamam, sana inanman\u0131 ne sa\u011flar?\"",
            "correct": False,
            "explanation": "Ona itibarl\u0131l\u0131\u011f\u0131n\u0131n \u015fartlar\u0131n\u0131 koymas\u0131n\u0131 s\u00f6yl\u00fcyorsun. \u015eimdi \u00e7er\u00e7even \u00fczerininde a\u00e7\u0131k yetkisi var."
          }
        }
      },
      "3": {
        "type": "mission",
        "title": "Dinami\u011fi Adland\u0131r",
        "instruction": "Sonraki konu\u015fmanda, o bir \u00e7er\u00e7eve koydu\u011funda fark et. \u0130\u00e7inde oynamak yerine, farkl\u0131 birinden cevap ver. \u00c7er\u00e7eveyle tart\u0131\u015fma \u2014 sadece girme.",
        "tips": {
          "0": "Sakinlik en g\u00fc\u00e7l\u00fc \u00e7er\u00e7eve kaymas\u0131 \u2014 tehdit almad\u0131\u011f\u0131n\u0131 ima ediyor",
          "1": "Kazanmak zorunda de\u011filsin. Sadece \u00e7er\u00e7eveyi kaybetmemek zorundasin.",
          "2": "O bir \u00e7er\u00e7eve koyarsa ve savunmac\u0131 cevap verirsen, \u00e7er\u00e7eve onundur."
        }
      }
    }
  },
  "c4_l4": {
    "title": "Testlerini Ge\u00e7mek",
    "duration": "4 dk",
    "steps": {
      "0": {
        "type": "concept",
        "heading": "\u0130nsanlar g\u00f6rd\u00fcklerinin ger\u00e7ek olup olmad\u0131\u011f\u0131n\u0131 anlamak i\u00e7in test eder.",
        "body": "Test etme davran\u0131\u015f\u0131 kaba de\u011fil. Mant\u0131kl\u0131. Erken \u00e7ekim g\u00fcbcunda insanlar en iyi versiyonlar\u0131n\u0131 sunar. Test etme \u2014 \u015f\u00fcphecilik, geri it me, k\u00fc\u00e7\u00fck meydan okumalar \u2014 sergilenen niteliklerin ger\u00e7ek mi yoksa performans m\u0131 oldu\u011funu kontrol ediyor.\n\nTestle ger\u00e7ekten sordu\u011fu soru \u015fu: bu ki\u015finin sahip g\u00f6r\u00fcnd\u00fc\u011f\u00fc nitelikler ger\u00e7ekten var m\u0131, yoksa bast\u0131rd\u0131\u011f\u0131mda \u00e7\u00f6k\u00fccek mi?\n\n\u00c7o\u011fu erkek ya boyun e\u011ferek (aniden uyumlu, aniden \u00f6z\u00fcr diler) ya da a\u015f\u0131r\u0131ya ka\u00e7arak (aniden savunmac\u0131 ya da so\u011fuk) ba\u015far\u0131s\u0131z oluyor. Do\u011fru hamle uyumlu kalmak \u2014 ayn\u0131 \u00e7er\u00e7eveden teste cevap vermek. Sertli\u011fi performans etmek de\u011fil. Testi ge\u00e7meye \u00e7al\u0131\u015fmak de\u011fil. Sadece: iki mesaj \u00f6nce kim oldu\u011funda gibi ayn\u0131 ki\u015fi ol.",
        "examples": {
          "0": { "label": "Test: \"Herkesle b\u00f6ylesin muhtemelen\"", "text": "Ba\u015far\u0131s\u0131zl\u0131k: \"Hay\u0131r de\u011filim! Asl\u0131nda \u00e7ok se\u00e7iciyim\" \u2014 hakl\u0131 \u00e7\u0131kar\u0131r. Ge\u00e7er: \"Evet, tutarl\u0131 \u015fekilde kendimim.\" \u2014 uyumlu kal\u0131r, n\u00f6trle\u015ftirir." },
          "1": { "label": "Test: \"Ortak \u00e7ok \u015feyimiz oldu\u011funu sanm\u0131yorum\"", "text": "Ba\u015far\u0131s\u0131zl\u0131k: \"Hay\u0131r var! \u0130kimiz de [ayn\u0131 \u015fey]i seviyoruz!\" \u2014 savunmac\u0131. Ge\u00e7er: \"Belki. Hala an\u0131nda \u00f6\u011freniyorum.\" \u2014 sakin, \u00e7er\u00e7eveyi a\u00e7\u0131k tutar." }
        }
      },
      "1": {
        "type": "do_dont",
        "context": "\"Bunu muhtemelen herkese s\u00f6yl\u00fcyorsun\" diyor",
        "dont": "\"Hay\u0131r hay\u0131r! Sen ger\u00e7ekten di\u011fer k\u0131zlardan farkl\u0131s\u0131n\"",
        "do": "\"Ger\u00e7ek d\u00fc\u015f\u00fcnd\u00fc\u011f\u00fcm \u015feyleri s\u00f6ylerim. \u0130nan\u0131p inanmaman senin karar\u0131n.\"",
        "why": "Hay\u0131r demek savunmac\u0131 ve hakl\u0131 \u00e7\u0131kar\u0131r \u2014 bir tepki ald\u0131. Evet demek sakin ve uyumlu. Onun \u015f\u00fcphecili\u011finden tehdit alm\u0131yorsun. Bu sakinlik test edilen kan\u0131tt\u0131."
      },
      "2": {
        "type": "quiz",
        "question": "\"Bunun ger\u00e7ek oldu\u011funa inanm\u0131yorum\" diyor. En iyi yan\u0131t?",
        "options": {
          "0": {
            "text": "\"Ne?? Normal\u00e9in alt\u0131nda olduk\u00e7a garip davran\u0131r\u0131m, s\u00f6z veriyorum\"",
            "correct": False,
            "explanation": "Daha az tehditkar g\u00f6r\u00fcnmeye \u00e7al\u0131\u015f\u0131yorsun. \u015eimdi seni rahats\u0131z etti\u011fini biliyor."
          },
          "1": {
            "text": "\"Ger\u00e7ek ve d\u00fczg\u00fcn z\u0131t de\u011fil. Sadece ne d\u00fc\u015f\u00fcnd\u00fc\u011f\u00fcm\u00fc biliyorum.\"",
            "correct": True,
            "explanation": "Sakin, uyumlu, onun \u00e7er\u00e7evesini kabul etmiyor. Onu s\u00f6ylemesinden \u00f6nce ayn\u0131 ki\u015fisin."
          },
          "2": {
            "text": "\"Tamam o zaman u\u011fra\u015fmayay\u0131m :)\"",
            "correct": False,
            "explanation": "Testi i\u00e7in ona ceza verme. Bu kendi ba\u015far\u0131s\u0131zl\u0131k modudir."
          }
        }
      },
      "3": {
        "type": "mission",
        "title": "Testi Fark Et",
        "instruction": "Biri \u015f\u00fcpheyle geri iter gitmez, cevaplamadan \u00f6nce dur. Kendini savunmak \u00fczere misin? Evet ise, ayn\u0131 mesaj\u0131n daha sakin versiyonunu bul.",
        "tips": {
          "0": "Ama\u00e7 testi kazanmak de\u011fil. Tepki vermemek.",
          "1": "Sakinlik arad\u0131\u011f\u0131 kan\u0131tt\u0131r.",
          "2": "Savunmac\u0131 hissediyorsan, bu kendi kesinli\u011fin nerede ince oldu\u011funa dair faydal\u0131 veri"
        }
      }
    }
  },
  "c4_l5": {
    "title": "\u0130\u00e7 \u015eakalar Yaratmak",
    "duration": "3 dk",
    "steps": {
      "0": {
        "type": "concept",
        "heading": "Payla\u015f\u0131lan kahkaha yak\u0131nl\u0131k yarat\u0131yor \u2014 fiziksel temas\u0131n yapt\u0131\u011f\u0131 gibi.",
        "body": "G\u00fclmek beyinde \u00f6zel bir \u015fey yap\u0131yor: kimlerle g\u00fcld\u00fc\u011f\u00fcne do\u011fru ger\u00e7ek bir yak\u0131nl\u0131k ve s\u0131cakl\u0131k hissi \u00fcreten bir endorfin sal\u0131n\u0131m\u0131 tetikliyor. Metaforik yak\u0131nl\u0131k de\u011fil \u2014 payla\u015f\u0131lan fiziksel temas\u0131n aktive etti\u011fi ayn\u0131 n\u00f6rokimyasal yol.\n\nPayla\u015f\u0131lan mizah daha da ileri gidiyor. \u0130\u00e7 bir \u015faka bir i\u00e7-grup yarat\u0131yor: bu \u015feyi anlayan bir \"biz\" var ve di\u011fer herkes anl\u0131yor. Bu i\u00e7-grup olu\u015fumu \u2014 k\u00fc\u00e7\u00fck, yeni bile olsa \u2014 kimlik d\u00fczeyinde yak\u0131nl\u0131k yaratman\u0131n en h\u0131zl\u0131 yollar\u0131ndan biri. Konu\u015fmada iki yabanc\u0131 olmaktan bir \u015feyi olan iki insan olmaya ge\u00e7ersin.\n\n\u0130\u00e7 \u015fakalar\u0131 komik olmaya \u00e7al\u0131\u015farak yaratm\u0131yorsun. Konu\u015fmada garip bir \u015fey oldu\u011funda onu adland\u0131rarak yarat\u0131yorsun \u2014 devam etmek yerine ona e\u011filerek. \u015faka kap\u0131 kla\u011f\u0131rda de\u011fil. Sonradan onu tekrar referans ald\u0131\u011f\u0131nda callback'te.",
        "examples": {
          "0": { "label": "Yaratmak", "text": "Otod\u00fczeltme hatas\u0131 yap\u0131yor \u2192 \"Bunu saklad\u0131m. Bu senin yeni \u015feyin.\"" },
          "1": { "label": "Callback (sonra)", "text": "\"Hala [daha \u00f6nceki garip \u015fey] d\u00fc\u015f\u00fcn\u00fcyorum.\"" },
          "2": { "label": "Sonucunu geldigi sinyal", "text": "O \u00f6nce referans al\u0131yor. Art\u0131k \u015fakayla o da ilgili." }
        }
      },
      "1": {
        "type": "do_dont",
        "context": "Kaza ile garip gelen bir \u015fey s\u00f6yl\u00fcyor",
        "dont": "D\u00fczg\u00fcnce ge\u00e7mek, konu\u015fmay\u0131 profesyonel tutmak",
        "do": "\"Tamam bunu bug\u00fcn okumay\u0131 beklemedi\u011fim \u015feylerin listesine ekliyorum.\"",
        "why": "Ge\u00e7ip gitmek an\u0131 ka\u00e7\u0131r\u0131yor. Ona e\u011filmek \u2014 adland\u0131rmak, bir an yapmak \u2014 d\u00f6nmeye bir \u015fey yarat\u0131yor. \u0130\u00e7 \u015faka sonraki callback."
      },
      "2": {
        "type": "quiz",
        "question": "Tesad\u00fcfen komik bir yaz\u0131 hatas\u0131 yapt\u0131. Onu fark ettin ve g\u00fcld\u00fc. 20 mesaj sonra ne yapars\u0131n?",
        "options": {
          "0": {
            "text": "Hi\u00e7bir \u015fey \u2014 an ge\u00e7ti",
            "correct": False,
            "explanation": "Callback t\u00fcm mesele. \u0130\u00e7-grup onu tekrar referans ald\u0131\u011f\u0131nda in\u015fa ediliyor \u2014 konu\u015fmay\u0131 takip etti\u011fini g\u00f6steriyor."
          },
          "1": {
            "text": "\"Hala [yaz\u0131 hatas\u0131n\u0131] d\u00fc\u015f\u00fcn\u00fcyorum. Olmaz.\"",
            "correct": True,
            "explanation": "Callback i\u00e7 \u015fakay\u0131 yarat\u0131yor. \u015eimdi belirli bir \u015feyin etraf\u0131nda bir \"biz\" kurdun."
          },
          "2": {
            "text": "Ba\u015fka bir \u015fey hakk\u0131nda ba\u015fka bir \u015faka yap",
            "correct": False,
            "explanation": "Yeni \u015fakalar iyi ama var olan\u0131 in\u015fa etmiyorlar. Ayn\u0131 \u015feye d\u00f6nmenin birle\u015fik etkisi i\u00e7 \u015fakay\u0131 yaratan."
          }
        }
      },
      "3": {
        "type": "mission",
        "title": "Adland\u0131racak Bir \u015eey Bul",
        "instruction": "Sonraki konu\u015fmanda, garip bir an ara \u2014 yaz\u0131 hatas\u0131, beklenmedik bir g\u00f6r\u00fc\u015f, uymayan bir \u015fey. Adland\u0131r. Sonra d\u00f6n.",
        "tips": {
          "0": "Komedyen olmaya \u00e7al\u0131\u015fm\u0131yorsun. Sadece \u015feyleri fark ediyorsun.",
          "1": "Callback ilk adland\u0131rmadan daha \u00f6nemli",
          "2": "O \u00f6nce referans al\u0131rsa \u2014 sonuc\u00fcst."
        }
      }
    }
  },
  "c4_l6": {
    "title": "Derin Dalmak",
    "duration": "6 dk",
    "steps": {
      "0": {
        "type": "concept",
        "heading": "Yak\u0131nl\u0131k zamanla in\u015fa edilmiyor. Birlikte ger\u00e7ek bir yere giderek in\u015fa ediliyor.",
        "body": "Yabancilara giderek ki\u015fisel sorular soran \u00e7iftlerin \u00e7al\u0131\u015fma sonunda \u00e7o\u011funun y\u0131llard\u0131r tan\u0131d\u0131klar\u0131 insanlardan daha yak\u0131n hissetti\u011fini g\u00f6steren \u00fcnl\u00fc bir \u00e7al\u0131\u015fma var.\n\nBulgu basit ama sezgiye ayk\u0131r\u0131: yak\u0131nl\u0131k s\u00fcrenin de\u011fil, derinlik ve kar\u015f\u0131l\u0131kl\u0131l\u0131\u011f\u0131n fonksiyonu. Ger\u00e7ek bir konu\u015fman\u0131n iki saatinde birisiyle ger\u00e7ekten yak\u0131n hissedebilirsin. Birini be\u015f y\u0131l tan\u0131yabilir ve hala y\u00fczeyde olabilirsin.\n\nForm\u00fcl: ger\u00e7ek bir \u015fey sor. O sordu\u011funda kendisi cevapla. Rahats\u0131z\u0131n bir seviye \u00f6tesine ge\u00e7. Orada seninle bulu\u015fmas\u0131na izin ver.",
        "examples": {
          "0": { "label": "Y\u00fczey \u2192 ger\u00e7ek", "text": "\"Ne yap\u0131yorsun?\" \u2192 \"Bunu neden se\u00e7tin?\" \u2192 \"Plan buydu mu yoksa mi b\u00fcyle oldu?\"" },
          "1": { "label": "Konu\u015fmay\u0131 takip et", "text": "O ilgin\u00e7 bir \u015fey s\u00f6yledi\u011finde \u2014 ger\u00e7ekten takip et. Yeni konuya y\u00f6nlendirme. \u0130\u00e7inde kal." },
          "2": { "label": "Orada onunla bulu\u015f", "text": "Ger\u00e7ek bir yere gitti\u011finde, e\u015fle\u015ftir. \u015eakalara ka\u00e7ma." }
        }
      },
      "1": {
        "type": "do_dont",
        "context": "20'lerinin sonunda kariyer de\u011fi\u015ftirdi\u011finden bahsediyor",
        "dont": "\"Harika, ne\u2019ye ge\u00e7tin?\"",
        "do": "\"Karar an\u0131n neydi? \u00c7o\u011fu insan yapmadan \u00f6nce y\u0131llarca bunu d\u00fc\u015f\u00fcn\u00fcyor.\"",
        "why": "Hay\u0131r demek bunu bir bilgi al\u0131\u015fveri\u015fi olarak de\u011ferlendiriyor. Evet demek karar\u0131n insan taraf\u0131na gidiyor \u2014 an, korku, bedeli ne. Ger\u00e7ek konu\u015fma orada."
      },
      "2": {
        "type": "quiz",
        "question": "\"Bu \u015fehre iki y\u0131l \u00f6nce yaln\u0131z ta\u015f\u0131nd\u0131m ve \u00e7ok zordu\" diyor. En iyi yan\u0131t?",
        "options": {
          "0": {
            "text": "\"Bu \u00e7ok cesur! \u015eimdi buray\u0131 seviyor musun?\"",
            "correct": False,
            "explanation": "H\u0131zl\u0131 onay sonra y\u00f6nlendirme. Az \u00f6nce s\u00f6yledi\u011fi ger\u00e7ek \u015feyin yan\u0131ndan ge\u00e7tin."
          },
          "1": {
            "text": "\"'Zordu' k\u0131sm\u0131 ne? Yaln\u0131z olmak m\u0131, yoksa ger\u00e7ek yenilik mi, yoksa ba\u015fka bir \u015fey mi?\"",
            "correct": True,
            "explanation": "Onu duydun ve do\u011frusuna y\u00f6neldin, ge\u00e7medin. Ger\u00e7ekte nas\u0131l oldu\u011funu soruyorsun \u2014 cevaplamak i\u00e7in ger\u00e7ek bir yere gitmek zorunda."
          },
          "2": {
            "text": "\"Ben de bir kez \u015fehir de\u011fi\u015ftirdim, ne kadar ayar gerektiriyor!\"",
            "correct": False,
            "explanation": "O s\u00f6yledi\u011fini bitirmeden \u00f6nce kendine y\u00f6nelttin."
          }
        }
      },
      "3": {
        "type": "mission",
        "title": "Konu\u015fmay\u0131 Takip Et",
        "instruction": "Sonraki konu\u015fmanda, alt\u0131nda ger\u00e7ek bir \u015fey olan bir \u015fey s\u00f6yledi\u011finde \u2014 yeni konuya y\u00f6nelme. Takip et. Ger\u00e7ekten nas\u0131l oldu\u011funu sor.",
        "tips": {
          "0": "\"Nas\u0131ld\u0131?\" konu\u015fmada en az kullan\u0131lan sorulardan biri",
          "1": "Ger\u00e7ek bir yere giderse, \u015fakaya ka\u00e7ma",
          "2": "Ger\u00e7ek k\u0131s\u0131mda kalmaya istekli olman, onun da orada olmas\u0131n\u0131 g\u00fcvenli k\u0131lan"
        }
      }
    }
  },
  "c4_l7": {
    "title": "\u0130\u015fe Yarayan \u0130ltifat",
    "duration": "4 dk",
    "steps": {
      "0": {
        "type": "concept",
        "heading": "Spesifik \u00f6v\u00fclme ger\u00e7ekten dikkat etti\u011fini ima eder. Genel \u00f6v\u00fclme ise etmedi\u011fini.",
        "body": "Genel iltifatlar s\u0131cakl\u0131k yerine \u015f\u00fcphecilik tetikliyor. Bir \u015fey herkese s\u00f6ylenebilecek oldu\u011funda, beyin bunu \u015f\u00f6yle kaydediyor: bu ki\u015fi bunu s\u00f6ylemek i\u00e7in dikkat etmek zorunda de\u011fildi. Yani muhtemelen etmedi.\n\nSpesifik \u00f6v\u00fclme tersini sinyaliyor. Onun yapt\u0131\u011f\u0131, se\u00e7ti\u011fi ya da \u00e7\u00f6zd\u00fc\u011f\u00fc bir \u015feye at\u0131fta bulunan iltifat, ger\u00e7ekten onu g\u00f6zlemi\u015f olmay\u0131 gerektiriyor. Spesifiklik kan\u0131tt\u0131r. Ve kan\u0131t \u00f6v\u00fcnceyi performatif yerine inand\u0131r\u0131c\u0131 k\u0131lan.\n\nEn iyi iltifatlar beklemedi\u011fi \u015feyler. Muhtemelen kimsenin fark etmeyece\u011fini d\u00fc\u015f\u00fcnd\u00fc\u011f\u00fc bir \u015feyi fark etti\u011fin.",
        "examples": {
          "0": { "label": "Genel (de\u011fersizle\u015ftirildi)", "text": "\"Muhte\u015femsin.\" \u2014 Bunu duymu\u015ftur. S\u0131f\u0131r g\u00f6zlemi gerektiriyor." },
          "1": { "label": "Spesifik (i\u015fe yar\u0131yor)", "text": "\"A\u00e7\u0131klama bi\u00e7imin \u2014 karmasi\u011fi\u0131 tamamen a\u00e7\u0131k hissettirdin. Ger\u00e7ek bir beceri bu.\"" },
          "2": { "label": "Beklenmedik (yap\u0131\u015f\u0131yor)", "text": "\"Bir yere giden sorular sormakta ger\u00e7ekten iyisin. \u00c7o\u011fu insan bunu yapm\u0131yor.\"" }
        }
      },
      "1": {
        "type": "do_dont",
        "context": "Konu\u015fmada anlatt\u0131\u011f\u0131 zor bir durumu hallett\u0131",
        "dont": "\"Bu kadar g\u00fc\u00e7l\u00fc ve m\u00fckemmelsin onunla ba\u015fa \u00e7\u0131kmak i\u00e7in\"",
        "do": "\"Bunu ba\u015fkas\u0131n\u0131n sorunu haline getirmemen \u2014 asl\u0131nda nadirdir.\"",
        "why": "Hay\u0131r demek herkesin verebilece\u011fi genel \u00f6v\u00fclme. Evet demek onun yapt\u0131\u011f\u0131 spesifik bir \u015feyi \u2014 bir se\u00e7im, bir davran\u0131\u015f \u2014 adland\u0131r\u0131yor ve ger\u00e7ekten dinlemi\u015f olmay\u0131 gerektiriyor. Bu spesifiklik t\u00fcm fark."
      },
      "2": {
        "type": "quiz",
        "question": "Az \u00f6nce tamamlad\u0131\u011f\u0131 karma\u015f\u0131k bir projeyi anlatt\u0131. En iyi iltifat hangisi?",
        "options": {
          "0": {
            "text": "\"O kadar zeki ve yetenklisin!\"",
            "correct": False,
            "explanation": "Herkese s\u00f6ylenebilir. S\u0131f\u0131r g\u00f6zlem gerektirir. C\u00fcmleyi bitirmeden \u00f6nce de\u011fersizle\u015ftirecek."
          },
          "1": {
            "text": "\"Her \u015fey hareket halindeyken [bahsetti\u011fi spesifik \u015feyi] bir arada tutman \u2014 bu kolay de\u011fil. \u00c7o\u011fu insan bu topu d\u00fc\u015f\u00fcr\u00fcr.\"",
            "correct": True,
            "explanation": "Ger\u00e7ekten anlatt\u0131\u011f\u0131 spesifik bir \u015feye at\u0131fta bulunuyor. Dinledi\u011fini g\u00f6steriyor. G\u00f6zlem kan\u0131tt\u0131r."
          },
          "2": {
            "text": "\"Bu \u00e7ok zorlu, kendinden gurur duymal\u0131s\u0131n!\"",
            "correct": False,
            "explanation": "Genel onay. S\u0131cak ama spesifik de\u011fil. S\u00f6ylenenini ger\u00e7ekten duyup duymad\u0131\u011f\u0131n\u0131 belli etmiyor."
          }
        }
      },
      "3": {
        "type": "mission",
        "title": "Bir G\u00f6zlem \u0130ltifat\u0131",
        "instruction": "Sonraki konu\u015fmanda, ger\u00e7ekten fark etti\u011fin spesifik bir \u015fey bul. Bunu \u00f6v \u2014 g\u00f6r\u00fcn\u00fc\u015f\u00fcn\u00fc de\u011fil, genel seni de\u011fil. Spesifik \u015feyi.",
        "tips": {
          "0": "En iyi iltifatlar kimsenin fark etmeyece\u011fini d\u00fc\u015f\u00fcnd\u00fc\u011f\u00fc bir \u015feye at\u0131fta bulunur",
          "1": "Davran\u0131\u015f ve karakter > g\u00f6r\u00fcn\u00fc\u015f",
          "2": "Herkese s\u00f6yleyebiliyorsan, do\u011fru de\u011fil"
        }
      }
    }
  },
  "c4_l8": {
    "title": "Kontrol Etmeden Y\u00f6nlendirmek",
    "duration": "5 dk",
    "steps": {
      "0": {
        "type": "concept",
        "heading": "Otonomi \u2014 se\u00e7imlerinin kendine ait hissettirmesi \u2014 temel bir insan ihtiyac\u0131.",
        "body": "\u0130nsanlar g\u00f6zg\u00f6ze\u011fini k\u0131s\u0131tlayan de\u011fil, geni\u015fleten partnerlere daha fazla ba\u011fl\u0131. Bu bir tercih de\u011fil \u2014 temel. Se\u00e7imler ger\u00e7ek se\u00e7imler gibi hissettirdi\u011finde, insanlar onlara yat\u0131r\u0131m yapar. Se\u00e7imler empoze ya da manevra edildi\u011finde, insanlar direnir.\n\nBu y\u00f6nlendirme ile kontrol aras\u0131ndaki fark. Y\u00f6nlendirme, ger\u00e7ek di\u011fer sonu\u00e7lara a\u00e7\u0131kl\u0131kla y\u00f6n sunar. \"Bir fikrim var \u2014 \u00e7at\u0131 bar Cumartesi. Ama daha iyi bir \u015fey varsa a\u00e7\u0131\u011f\u0131m\" bir y\u00f6nlendirmedir. \"Cumartesi \u00e7at\u0131 bar\" kontrold\u00fcr.\n\nEn \u00e7ekici kararl\u0131l\u0131k versiyonu: a\u00e7\u0131k bir fikrim var, ne isteyece\u011fini d\u00fc\u015f\u00fcnerek se\u00e7tim ve farkl\u0131 g\u00f6r\u00fcyorsan a\u00e7\u0131\u011f\u0131m. Bu kararl\u0131l\u0131k VE otonomi deste\u011fi. Ayn\u0131 anda ikisi.",
        "examples": {
          "0": { "label": "Kontrol (s\u00fcrt\u00fc\u015fme)", "text": "\"[Yere] gitmeliyiz. Seveceksin.\" \u2014 Alan yok, girdi yok, tercihlerini varsay\u0131yor." },
          "1": { "label": "Y\u00f6nlendirme (isteklilik)", "text": "\"[Hakk\u0131nda s\u00f6yledi\u011fin \u015fey] baz\u0131nda ger\u00e7ekten sevece\u011fini d\u00fc\u015f\u00fcnd\u00fc\u011f\u00fcm bir yer var. Denemek ister misin, yoksa oraya gitti\u011fin oldu mu?\" \u2014 y\u00f6n ve girdi var." }
        }
      },
      "1": {
        "type": "do_dont",
        "context": "ilk bulu\u015fmay\u0131 planlamak",
        "dont": "\"Cuma 19:00'da [restorana] gidiyoruz.\" \u2014 ger\u00e7ek gibi ifade, girdi yok",
        "do": "\"Yak\u0131n\u0131nda uygun oldu\u011funu d\u00fc\u015f\u00fcnd\u00fc\u011f\u00fcm iyi bir [yer t\u00fcr\u00fc] var \u2014 Cuma ak\u015fam\u0131? Gitti\u011fin ya da daha iyi bir \u015fey varsa a\u00e7\u0131\u011f\u0131m.\"",
        "why": "Hay\u0131r demek onun temsilini tamamen kald\u0131r\u0131yor. Evet demek net bir plan ve girdi davetini birle\u015ftiriyor. Hem tutulmu\u015f hem \u00f6zg\u00fcr hissediyor. Bu kombinasyon y\u00f6nlendirmeyi \u00e7ekici yapan."
      },
      "2": {
        "type": "quiz",
        "question": "\"Bilmiyorum, sen ne yapmak istiyorsun?\" diyor. En iyi yan\u0131t?",
        "options": {
          "0": {
            "text": "\"Sen istedi\u011finii se\u00e7 ! Herhangi bir \u015feyle iyiyim :)\"",
            "correct": False,
            "explanation": "Liderlikten tamamen vazge\u00e7me. Y\u00f6n istedi. \"Herhangi bir \u015fey\" tam tersini yap\u0131yor."
          },
          "1": {
            "text": "\"Denemek istedi\u011fim bir yer var \u2014 [spesifik a\u00e7\u0131klama]. Bu sana uygun mu?\"",
            "correct": True,
            "explanation": "Spesifik fikirle net bir karar al\u0131yor. Onu vazge\u00e7meden yan\u0131t\u0131n\u0131 davet ediyor."
          },
          "2": {
            "text": "\"Sen karar ver, b\u00f6lgeyi daha iyi tan\u0131yorsun.\"",
            "correct": False,
            "explanation": "Karar\u0131 ona iade ediyor. Seni istedi. Onu geri vermek \u00f6z\u00fcc\u00fc de\u011fil, kararss\u0131z olarak g\u00f6r\u00fcn\u00fcyor."
          }
        }
      },
      "3": {
        "type": "mission",
        "title": "Girdi Davet Eden Bir Plan Yap",
        "instruction": "Bir dahaki planlarken, spesifik bir \u015fey \u00f6ner \u2014 sonra ger\u00e7ekten onun girdisine yer b\u0131rak. Bir formalite olarak de\u011fil. Ger\u00e7ekten d\u00fc\u015f\u00fcn.",
        "tips": {
          "0": "Y\u00f6nlendirme bir fikre sahip olmakta. A\u00e7\u0131kl\u0131k kabul gerektirmiyor.",
          "1": "Daha iyi bir \u00f6nerisi varsa, al \u2014 bu da liderlik",
          "2": "Kararss\u0131zl\u0131k d\u00fc\u015f\u00fck ilgi olarak okunur. Girdi a\u00e7\u0131kl\u0131\u011f\u0131yla karar g\u00fcven olarak okunur."
        }
      }
    }
  },
  "c4_l9": {
    "title": "Uzun Oyun",
    "duration": "5 dk",
    "steps": {
      "0": {
        "type": "concept",
        "heading": "Tan\u0131\u015fanl\u0131k be\u011feni \u00fcretiyor \u2014 fark\u0131ndal\u0131k olmadan bile.",
        "body": "\u0130nsanlar\u0131n \u00f6nceden kar\u015f\u0131la\u015ft\u0131klar\u0131 \u015feyleri de\u011ferlendirme bi\u00e7iminde tutarl\u0131 bir etki var: tekrarlanan maruz kalma, herhangi bir bilin\u00e7li an\u0131 kar\u015fl\u0131k\u0131ndan ba\u011f\u0131ms\u0131z olarak olumlu de\u011ferlendirmeyi artt\u0131r\u0131yor. \u0130nsanlar y\u00fczleri, nesneleri ve kelimeleri daha pozitif de\u011ferlendiriyor sadece onlar\u0131 \u00f6nce g\u00f6rm\u00fc\u015f olduklar\u0131 i\u00e7in \u2014 g\u00f6rm\u00fckleri hat\u0131rlamasalar bile.\n\nPratikte: zaman i\u00e7inde tutarl\u0131, d\u00fc\u015f\u00fck bask\u0131l\u0131 varl\u0131k, tek bir etkile\u015fimden \u00e7ok daha fazla i\u015f yap\u0131yor. Sadece doruk anlarla kazanm\u0131yorsun. Orada olan, devam eden ve tan\u0131\u015fanl\u0131\u011f\u0131n birikmesine izin veren ki\u015fi olmakla kazaniyorsun.\n\nYat\u0131r\u0131m modeli ba\u015fka bir katman ekliyor: insanlar\u0131n ili\u015fkiye ba\u011fl\u0131l\u0131\u011f\u0131 ona yat\u0131r\u0131mlar\u0131yla orant\u0131l\u0131 olarak b\u00fcy\u00fcyor \u2014 zaman, duygu, payla\u015f\u0131lan deneyim.",
        "examples": {
          "0": { "label": "K\u0131sa oyun d\u00fc\u015f\u00fcnmek", "text": "Her mesaj m\u00fckemmel inmek zorunda. Her konu\u015fma t\u0131rmanmak zorunda. Her etkile\u015fim kader belirleyici." },
          "1": { "label": "Uzun oyun d\u00fc\u015f\u00fcnmek", "text": "Zaman i\u00e7inde tutarl\u0131, ger\u00e7ek kat\u0131l\u0131m. Baz\u0131 konu\u015fmalar ortalama. \u00d6nemli olan kal\u0131p." }
        }
      },
      "1": {
        "type": "do_dont",
        "context": "Doruk etkile\u015fim olmayan iyi ama g\u00f6rkemli olmayan bir konu\u015fmadan sonra",
        "dont": "Doruk etkile\u015fim olmad\u0131\u011f\u0131 i\u00e7in kaybetmek, ya da enerjiyi yakalamaya \u00e7al\u0131\u015fan kayg\u0131l\u0131 bir mesaj g\u00f6ndermek",
        "do": "Bir iki g\u00fcn sonra yeni bir \u015feyle d\u00f6n. Ayn\u0131 ki\u015fi, farkl\u0131 an.",
        "why": "Uzun oyun tek konu\u015fmalarda in\u015fa edilmiyor. Kal\u0131pta in\u015fa ediliyor. Ortalama bir konu\u015fmadan sonra do\u011fal d\u00f6n\u00fc\u015f sinyali veriyor: her etkile\u015fimi notlamiyorum. Sadece buradayim."
      },
      "2": {
        "type": "quiz",
        "question": "Son konu\u015fma iyi ama sonda s\u00f6nd\u00fc. 2 g\u00fcn ge\u00e7ti. Ne yapars\u0131n?",
        "options": {
          "0": {
            "text": "Hi\u00e7bir \u015fey \u2014 konu\u015fma zaten bitti, yeniden a\u00e7mak \u00e7aresiz g\u00f6r\u00fcn\u00fcr",
            "correct": False,
            "explanation": "Yeniden kat\u0131lmak i\u00e7in m\u00fckemmel an beklemek k\u0131sa oyun d\u00fc\u015f\u00fcnmek. Uzun oyun m\u00fckemmel yeniden gi\u015bler gerektirmiyor."
          },
          "1": {
            "text": "Yeni ve ba\u011f\u0131ms\u0131z bir \u015feyle mesaj at \u2014 son konu\u015fman\u0131n devam\u0131 de\u011fil",
            "correct": True,
            "explanation": "2 g\u00fcn sonra do\u011fal, ba\u011f\u0131ms\u0131z bir mesaj sinyali veriyor: bu sadece \u00e7al\u0131\u015fma bi\u00e7imim. Her etkile\u015fimi a\u015f\u0131r\u0131 d\u00fc\u015f\u00fcnm\u00fcyorum. Tutarl\u0131 varl\u0131k."
          },
          "2": {
            "text": "\"Hey! Senden bir s\u00fcred\u00fcr haber almad\u0131m :)\"",
            "correct": False,
            "explanation": "Pasif ve hafif talep\u00e7i. Ba\u011f\u0131ms\u0131z kanca daha iyi \u2014 cevap vermesi i\u00e7in bir \u015fey veriyor."
          }
        }
      },
      "3": {
        "type": "mission",
        "title": "\u0130ki G\u00fcnl\u00fck D\u00f6n\u00fc\u015f",
        "instruction": "S\u00f6nd\u00fc ya da a\u00e7\u0131k bir sonraki ad\u0131m olmadan biten bir konu\u015fma bul. \u0130ki g\u00fcnden itibaren, son konu\u015fman\u0131n nas\u0131l bitti\u011fine hi\u00e7 at\u0131fta bulunmadan bir yeni, ba\u011f\u0131ms\u0131z mesaj g\u00f6nder.",
        "tips": {
          "0": "Yeniden giri\u015f mesaj\u0131 yeni bir konu\u015fma gibi hissettirmeli, devam\u0131 gibi de\u011fil",
          "1": "Bo\u015flu\u011fa de\u011finme \u2014 bu garip yapar",
          "2": "Kalite s\u0131kl\u0131\u011f\u0131n \u00fczerinde: bir iyi mesaj \u00fc\u00e7 ortalamadan iyi"
        }
      }
    }
  },
  "c4_l10": {
    "title": "Entegrasyon",
    "duration": "6 dk",
    "steps": {
      "0": {
        "type": "concept",
        "heading": "Bunlar teknikler de\u011fil. \u0130nsanlarla ilgilenmenin bir yolu.",
        "body": "Bunda ger\u00e7ekten iyi birinin eforsuz g\u00f6r\u00fcnmesinin nedeni teknikleri \u00e7al\u0131\u015ft\u0131rmas\u0131 de\u011fil. Tekniklerin i\u015fletim sistemleri haline gelmesi \u2014 yapaca\u011f\u0131n \u015feylerden do\u011fal olarak etkile\u015fme bi\u00e7imine d\u00f6n\u00fc\u015fecek kadar i\u00e7selle\u015ftirilmi\u015f.\n\nSpesifiklik: ger\u00e7ekten dikkat ediyorsun.\nZamanlama: i\u015flerin oluyor.\nKar\u015f\u0131l\u0131kl\u0131l\u0131k: istedi\u011fin kadar veriyorsun.\nBelirsizlik: ger\u00e7ekten ilgin\u00e7sin, tam okunabilir de\u011filsin.\nDerinlik: ger\u00e7ek bir yere gitmeye isteklisin.\n\u00c7er\u00e7eve: kimin oldu\u011funu biliyorsun ve savunmak zorunda de\u011filsin.\nK\u0131r\u0131lganl\u0131k: insans\u0131n, uygun \u00f6l\u00e7\u00fcde.\nLiderlik: fikirleriniz var ve onay gerektirmiyorsunuz.\nUzun oyun: her etkile\u015fim i\u00e7in performans sergilemiyorsunuz.\n\nBunlar\u0131n hi\u00e7biri numara de\u011fil. Bunlar nitelikler. Ama\u00e7, do\u011fal olarak g\u00f6r\u00fcnmeleri i\u00e7in onlar\u0131 ger\u00e7ekten geli\u015ftirmek.",
        "examples": {
          "0": { "label": "Bile\u015fik etki", "text": "Spesifiklik + zamanlama + kar\u015f\u0131l\u0131kl\u0131l\u0131k + \u00e7er\u00e7eve hepsi ayn\u0131 anda mevcut oldu\u011funda, konu\u015fma tamamen farkl\u0131 bir enerji ta\u015f\u0131yor." },
          "1": { "label": "Entegrasyon testi", "text": "Son konu\u015fman\u0131 oku. Hangi prensipler do\u011fal \u00e7\u0131k\u0131yor? Hangileri sadece hat\u0131rlad\u0131\u011f\u0131nda g\u00f6r\u00fcn\u00fcyor?" }
        }
      },
      "1": {
        "type": "do_dont",
        "context": "Yeni biriyle konu\u015fmaya ba\u015flamak \u00fczeresin",
        "dont": "Mesaj atmadan \u00f6nce bir teknik kontrol listesinden ge\u00e7mek",
        "do": "Bir insan gibi mesaj at \u2014 sonra sonras\u0131nda g\u00f6zden ge\u00e7ir. Eksik ne? Ne vard\u0131? Zamanla ayarla.",
        "why": "Kontrol listesi yakla\u015f\u0131m\u0131 konu\u015fmalar\u0131 sert yapar. Gozden ge\u00e7irme yakla\u015f\u0131m\u0131 nitelikleri zamanla in\u015fa eder. Entegrasyon bir durum de\u011fil, bir y\u00f6n."
      },
      "2": {
        "type": "quiz",
        "question": "Bu prensiplerin ger\u00e7ekten entegre oldu\u011funu anlamann\u0131n en iyi yolu?",
        "options": {
          "0": {
            "text": "Hepsini adland\u0131rabiliyorsun ve her birini ne zaman kullanaca\u011f\u0131n\u0131 a\u00e7\u0131klayabiliyorsun",
            "correct": False,
            "explanation": "Onlar hakk\u0131nda bilmek onlar\u0131 kullanmak anlam\u0131na gelmiyor. Pek \u00e7ok insan prensipleri anl\u0131yor ve bask\u0131 alt\u0131nda hi\u00e7birini uygulamay\u0131yor."
          },
          "1": {
            "text": "D\u00fcn yapt\u0131\u011f\u0131n bir konu\u015fmay\u0131 okuyorsun ve \u00e7o\u011fu denemeden g\u00f6r\u00fcn\u00fcyor",
            "correct": True,
            "explanation": "Entegrasyon davran\u0131\u015fta g\u00f6r\u00fcn\u00fcyor, haf\u0131zada de\u011fil. Do\u011fal olarak oradayken, i\u00e7selle\u015ftirilmi\u015fler."
          },
          "2": {
            "text": "M\u00fccehere b\u00f6l\u00fcm\u00fcn\u00fc %100 tamamlad\u0131n",
            "correct": False,
            "explanation": "Tamamlama materyal ile ilgilendi\u011fini g\u00f6steriyor. Entegrasyon ger\u00e7ekte davran\u0131\u015f\u0131n\u0131 de\u011fi\u015ftirdi\u011fi anlam\u0131na geliyor."
          }
        }
      },
      "3": {
        "type": "mission",
        "title": "G\u00f6zden Ge\u00e7irme",
        "instruction": "Son \u00fc\u00e7 konu\u015fman\u0131 oku. Hangi prensiplerin do\u011fal \u00e7\u0131kt\u0131\u011f\u0131n\u0131 ve hangilerinin tamamen eksik oldu\u011funu i\u015faretle. Bu bo\u015fluklar sonraki 30 g\u00fcn\u00fcn\u00fc.",
        "tips": {
          "0": "Burada d\u00fcr\u00fcstl\u00fck z\u0131rhelanmadan daha \u00f6nemli",
          "1": "Eksik prensipler sadece in\u015fa edilmemi\u015f al\u0131\u015fkanl\u0131klar \u2014 karakter kusurlar\u0131 de\u011fil",
          "2": "Bir bo\u015fluk se\u00e7. \u00dczerinde \u00e7al\u0131\u015f. Sonra di\u011ferini."
        }
      }
    }
  }
}

data['challenges']['lessons'].update(c4_lessons)

with open('i18n/tr.json', 'w', encoding='utf-8') as f:
    json.dump(data, f, ensure_ascii=False, indent=2)

print("Done! c4 lessons added")
print("All keys:", list(data['challenges']['lessons'].keys()))

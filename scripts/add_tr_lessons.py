#!/usr/bin/env python3
import json

with open('i18n/tr.json', 'r', encoding='utf-8') as f:
    data = json.load(f)

lessons = {
  "c3_l1": {
    "title": "Neden \u00c7o\u011fu Davet Ba\u015far\u0131s\u0131z Olur",
    "duration": "4 dk",
    "steps": {
      "0": {
        "type": "concept",
        "heading": "Belirsiz niyetler neredeyse hi\u00e7 uygulamaya ge\u00e7miyor.",
        "body": "\"Bir ara tak\u0131l\u0131r\u0131z\" ba\u015far\u0131s\u0131z oluyor \u2014 \u00e7\u00fcnk\u00fc g\u00fcven eksikli\u011fi de\u011fil \u2014 ama kimseye \u00fczerinde \u00e7al\u0131\u015facak bir \u015fey vermiyor. Sana da dahil.\n\nNsiyetlerin nas\u0131l hayata ge\u00e7ti\u011finde yerle\u015fik bir kal\u0131p var. Belirsiz hedefler \u2014 \"spor salonuna gitmeliyim\" \u2014 \u00e7ok d\u00fc\u015f\u00fck takip oranlar\u0131na sahip. Somut e\u011fer-o zaman senaryolar\u0131 \u2014 \"Sal\u0131 sabah\u0131 i\u015fe gitmeden \u00f6nce spor salonuna gidece\u011fim\" \u2014 \u00e7ok daha y\u00fcksek oranlara sahip. Beyin, planlama ve ba\u011fl\u0131l\u0131k davran\u0131\u015f\u0131n\u0131 etkinle\u015ftirmek i\u00e7in sim\u00fcle edebilece\u011fi belirli bir senaryoya ihtiya\u00e7 duyuyor.\n\nAyn\u0131 mekanizma biri randevuya davet etmek i\u00e7in de ge\u00e7erli. \"Bir ara tak\u0131l\u0131r\u0131z\" sim\u00fcle edilebilir bir senaryo yaratm\u0131yor. O hayal edemiyor. Sen de edemiyorsun. Bu y\u00fczden hi\u00e7bir \u015fey olmuyor \u2014 ilgisi olmad\u0131\u011f\u0131 i\u00e7in de\u011fil, cevab\u0131 \u00e7\u0131palayacak zihinsel bir imge olmad\u0131\u011f\u0131 i\u00e7in.\n\nDavet, cevaplamadan \u00f6nce bulu\u015fmay\u0131 hayal edebilece\u011fi kadar somut olmal\u0131.",
        "examples": {
          "0": { "label": "Belirsiz (zihinsel imge yok)", "text": "\"Bir ara tak\u0131l\u0131r\u0131z.\"" },
          "1": { "label": "Belirsiz (ko\u015fullu)", "text": "\"Bo\u015fsan belki kahve i\u00e7ebiliriz ya da bir \u015feyler yapabiliriz?\"" },
          "2": { "label": "Somut (hayal edebiliyor)", "text": "\"\u015eehir merkezine yak\u0131n iyi bir ramen yeri var \u2014 Per\u015fembe? Tokyo hikayesinin geri kalan\u0131n\u0131 anlat\u0131r\u0131m.\"" }
        }
      },
      "1": {
        "type": "do_dont",
        "context": "3 g\u00fcnd\u00fcr konu\u015fuyorsunuz, iyi bir kimya var",
        "dont": "\"Bir \u015feyler i\u00e7elim! Bu hafta sonu m\u00fcsaksan?\"",
        "do": "\"Yak\u0131n\u0131nda do\u011fal \u0131\u015f\u0131kl\u0131 g\u00fczel bir \u015farap bar var \u2014 Cuma ak\u015fam\u0131? Haftay\u0131 rahat bir \u015fekilde kapatmak i\u00e7in.\"",
        "why": "Hay\u0131r demek s\u0131ra ko\u015fullu, zihinsel imge sunmuyor ve t\u00fcm inisiyatifi bunun nas\u0131l g\u00f6r\u00fcnece\u011fini \u00e7\u00f6zmesi i\u00e7in ona b\u0131rak\u0131yor.\n\nEvet demek belirli bir yer, belirli bir zaman ve vibe i\u00e7in bir \u00e7er\u00e7eve sunuyor. Hayal edebiliyor. Cevaplamadan \u00f6nce karar\u0131n b\u00fcy\u00fck k\u0131sm\u0131 zaten verilmi\u015f oluyor."
      },
      "2": {
        "type": "quiz",
        "question": "Hangi davet en \u00e7ok evet alma ihtimaline sahip?",
        "options": {
          "0": {
            "text": "\"Tak\u0131lal\u0131m! Bu hafta sonu m\u00fcsaksan?\"",
            "correct": False,
            "explanation": "Ko\u015fullu, vizyon yok, belirli bir senaryo yok. Bunun nas\u0131l g\u00f6r\u00fcnece\u011fini hayal etme zihinsel i\u015fini o yapmak zorunda."
          },
          "1": {
            "text": "\"Yak\u0131nda bir \u00e7at\u0131 bar var \u2014 Pazar \u00f6\u011fleden sonra? Haftay\u0131 bitirmek i\u00e7in g\u00fczel bir yol.\"",
            "correct": True,
            "explanation": "Belirli yer, belirli zaman, enerji i\u00e7in bir \u00e7er\u00e7eve. Sim\u00fcle edebiliyor. Sim\u00fclasyon ba\u011fl\u0131l\u0131\u011f\u0131n \u00f6nc\u00fcls\u00fc."
          },
          "2": {
            "text": "\"Hi\u00e7 bask\u0131 yoksa kahve i\u00e7mek ister misin?\"",
            "correct": False,
            "explanation": "\"Hi\u00e7 bask\u0131 yok\" reddedilmeni bekledi\u011fini g\u00f6steriyor. Niteleyici daveti cevaplamadan bile alt\u00fcst ediyor."
          }
        }
      },
      "3": {
        "type": "mission",
        "title": "Somut Bir Davet Yaz",
        "instruction": "Konu\u015ftu\u011fun biri i\u00e7in somut bir davet yaz. Belirli yer, belirli zaman, orada olmak isteyece\u011fi bir neden.",
        "tips": {
          "0": "Somut s\u00fcsl\u00fcye baskul\u0131r \u2014 iyi bir taco yeri belirsiz \"iyi restoran\"a baskul\u0131r",
          "1": "Yap\u0131labilirse konu\u015fman\u0131zdan bir \u015feye g\u00f6nderme yap",
          "2": "Geri oku: bulu\u015fmay\u0131 hayal edebiliyor mu? Evet ise haz\u0131r."
        }
      }
    }
  },
  "c3_l2": {
    "title": "3 Par\u00e7al\u0131 Form\u00fcl",
    "duration": "5 dk",
    "steps": {
      "0": {
        "type": "concept",
        "heading": "Somut, spesifik dil zihinsel bir resim yarat\u0131r. Soyut dil hi\u00e7bir \u015fey yaratmaz.",
        "body": "Zihinsel imgeler \u00fcreten dil farkl\u0131 \u2014 ve daha ak\u0131lda kal\u0131c\u0131 \u2014 \u015fekilde i\u015fleniyor. \"Manzaral\u0131 bir \u00e7at\u0131 bar\" g\u00f6rsel i\u015flemeyi aktive ediyor. \"Bir yerde tak\u0131lmak\" aktive etmiyor.\n\nBelirli bir senaryo anlatt\u0131\u011f\u0131nda o sim\u00fcle ediyor. Cevaplamadan \u00f6nce beyin bulu\u015fman\u0131n k\u0131sa bir zihinsel versiyonunu \u00e7al\u0131\u015ft\u0131r\u0131yor. Bu sim\u00fclasyon iyi hissettirirse \u2014 yer do\u011fru, zamanlama uyuyor, bu spesifik tarih i\u00e7in bir neden var \u2014 evet kolayca geliyor.\n\nForm\u00fcl \u00fc\u00e7 par\u00e7adan olu\u015fuyor:\n\n[Belirli yer] + [Belirli zaman] + [Konu\u015fman\u0131zdan ki\u015fisel ba\u011flant\u0131]\n\nKi\u015fisel ba\u011flant\u0131 \u00e7o\u011fu insan\u0131n atland\u0131\u011f\u0131 k\u0131s\u0131m. Bu bulu\u015fmay\u0131 sizin spesifik konu\u015fman\u0131zla ilgili yapan \u015fey \u2014 herkesle yap\u0131lan jenerik bir kahve de\u011fil.",
        "examples": {
          "0": { "label": "Form\u00fcl\u00fc kullanarak", "text": "\"Yak\u0131nda iyi bir ramen yeri var \u2014 Per\u015fembe ak\u015fam\u0131? Seyahat hikayesinin geri kalan\u0131n\u0131 anlat\u0131r\u0131m.\"" },
          "1": { "label": "Callback kancayla", "text": "\"Yak\u0131n\u0131nda do\u011fal \u0131\u015f\u0131kl\u0131 g\u00fczel bir \u015farap bar var \u2014 Pazar \u00f6\u011fleden sonra? Zevkimin ger\u00e7ekten o kadar k\u00f6t\u00fc olup olmad\u0131\u011f\u0131na sen karar ver.\"" },
          "2": { "label": "Hafif versiyon", "text": "\"[Yak\u0131n\u0131nda] iyi bir kahve yeri \u2014 Cumartesi sabah\u0131? Bir saat.\"" }
        }
      },
      "1": {
        "type": "do_dont",
        "context": "Rekabet\u00e7i olmakla dalga ge\u00e7iyordunuz",
        "dont": "\"Bir ara rekabet\u00e7i bir \u015fey yapmal\u0131y\u0131z haha\"",
        "do": "\"Yak\u0131nda kendini \u00e7ok ciddiye alan bir mini golf yeri var \u2014 Cumartesi? Ger\u00e7ekten rekabet\u00e7i mi yoksa sadece \u00f6yle mi s\u00f6yl\u00fcyorsun g\u00f6relim.\"",
        "why": "Hay\u0131r demek belirsiz ve \"haha\" daveti zay\u0131flat\u0131yor. Evet demek belirli bir yer, belirli bir g\u00fcn kullan\u0131yor ve do\u011frudan konu\u015fma dinamilinize ba\u011flan\u0131yor."
      },
      "2": {
        "type": "quiz",
        "question": "Hangi mesaj 3 par\u00e7al\u0131 form\u00fcl\u00fc en iyi kullan\u0131yor?",
        "options": {
          "0": {
            "text": "\"Bu hafta sonu bir \u015feyler i\u00e7elim!\"",
            "correct": False,
            "explanation": "Belirli yer yok, belirli g\u00fcn yok. \"Bu hafta sonu\" 48 saatlik bir belirsizlik."
          },
          "1": {
            "text": "\"[Sokakta] iyi bir kokteyl bar var \u2014 Cuma 8'de? K\u0131z karde\u015f hikayesinin geri kalan\u0131n\u0131 duymak istiyorum.\"",
            "correct": True,
            "explanation": "Belirli yer, belirli zaman, konu\u015fmadan ki\u015fisel kanca. Hayal edebiliyor. Callback sinyali veriyor: bu bize \u00f6zel, herhangi bir bulu\u015fma de\u011fil."
          },
          "2": {
            "text": "\"Bu hafta e\u011flenceli bir \u015fey yapmak ister misin? Olduk\u00e7a esnekimdir.\"",
            "correct": False,
            "explanation": "\"Esnek\" istedi\u011fi her \u015feyi yapaca\u011f\u0131n\u0131 sinyali veriyor. Bu davetten t\u00fcm enerjiyi al\u0131yor."
          }
        }
      },
      "3": {
        "type": "mission",
        "title": "Davetini Olu\u015ftur",
        "instruction": "\u015eu an s\u00fcrd\u00fcrd\u00fc\u011f\u00fcn bir konu\u015fma i\u00e7in, 3 par\u00e7ayla daveti yaz: belirli yer, belirli zaman, ki\u015fisel kanca.",
        "tips": {
          "0": "Kanca k\u00fc\u00e7\u00fck olabilir \u2014 \"o tavsiye i\u00e7in sana bir kahve borcum var\" yeterli",
          "1": "G\u00fcn + kabaca zaman (ak\u015fam/\u00f6\u011fleden sonra) yeterli \u2014 tam saati bilmene gerek yok",
          "2": "Belirli bir yerin yoksa yak\u0131n\u0131nda birini ara. 30 saniye."
        }
      }
    }
  },
  "c3_l3": {
    "title": "Yumu\u015fak Hay\u0131rlarla Ba\u015fa \u00c7\u0131kma",
    "duration": "4 dk",
    "steps": {
      "0": {
        "type": "concept",
        "heading": "\"Bu hafta mesgulim\" neredeyse hi\u00e7 seninle ilgili de\u011fildir.",
        "body": "Biri hay\u0131r dedi\u011finde, beynin h\u0131zl\u0131 bir varsay\u0131m\u0131 var: karakterle ilgili hale getir. \u0130lgilenmiyor. Seni sevmiyor. Durumsal a\u00e7\u0131klama \u2014 zamanlama, ko\u015fullar, ya\u015fam\u0131n akmas\u0131 \u2014 ki\u015fisel olan\u0131n lehine atlan\u0131yor.\n\nBu sistematik bir hata. S\u00fcrt\u00fc\u015fmeyi ki\u015fisel reddedilme yerine durumsal fakt\u00f6rlere ba\u011flayan insanlar bununla daha iyi ba\u015fa \u00e7\u0131k\u0131yor.\n\n\"Bu hafta mesgulim\" durumsal bir sinyal \u2014 zamanlama, ilgi de\u011fil. \"Asl\u0131nda biriyle \u00e7\u0131k\u0131yorum\" bir e\u011filimsel sinyal \u2014 m\u00fcvakkat de\u011fil.\n\nFark\u0131 bilmek bir sonraki hamleyi belirliyor. Durumsal bir hay\u0131r, farkl\u0131 bir zamanla tek bir nazik y\u00f6nlendirme al\u0131yor. Hepsi bu. \u00dc\u00e7 y\u00f6nlendirme de\u011fil.",
        "examples": {
          "0": { "label": "Durumsal (bir kez y\u00f6nlendir)", "text": "\"Asl\u0131nda bu hafta olduk\u00e7a mesgulim\"" },
          "1": { "label": "Senin y\u00f6nlendirmen", "text": "\"Sorun de\u011fil \u2014 gelecek hafta? Sal\u0131 ya da Per\u015fembe uygunum.\"" },
          "2": { "label": "E\u011filimsel (kabul et)", "text": "\"Asl\u0131nda biriyle \u00e7\u0131k\u0131yorum\"" }
        }
      },
      "1": {
        "type": "do_dont",
        "context": "Cumartesi kahve i\u00e7meye davet ettin. \"Bu hafta sonu mesgul olabilirim, henUz emin de\u011filim\" dedi.",
        "dont": "\"Oh sorun de\u011fil!! Bo\u015f oldu\u011funda haber ver, acele yok :)\"",
        "do": "\"Sorun de\u011fil \u2014 gelecek hafta? Sal\u0131 ak\u015fam\u0131 ya da Per\u015fembe uygunum.\"",
        "why": "Hay\u0131r demek t\u00fcm inisiyatifi ona b\u0131rak\u0131yor ve zaman\u0131n\u0131n art\u0131klar\u0131n\u0131 kabul edece\u011fini sinyaliyor. Evet demek \u00e7er\u00e7evi tutar \u2014 ayn\u0131 enerji, farkl\u0131 zamanlama \u2014 ve ona belirli bir se\u00e7im sunar. Sadece bir y\u00f6nlendirme."
      },
      "2": {
        "type": "quiz",
        "question": "\"Bu hafta deli gibi ama gelecek hafta sonu uygunum\" diyor. Ne s\u00f6ylersin?",
        "options": {
          "0": {
            "text": "\"Hahak\u00e4! Ne zaman uygun oldu\u011funu s\u00f6yle :)\"",
            "correct": False,
            "explanation": "Bunun ne zaman olaca\u011f\u0131n\u0131n t\u00fcm kontrolunu az \u00f6nce ona verdin. Bir daha g\u00fcndeme getirmeyebilir."
          },
          "1": {
            "text": "\"Cumartesi mi Pazar m\u0131? \u0130kisi de uyar \u2014 plan yapabilmem i\u00e7in Per\u015fembeye kadar haber ver.\"",
            "correct": True,
            "explanation": "\u00c7er\u00e7eveyi korudu. \u0130kili se\u00e7im, hafif son tarih. Birine ba\u011flanmas\u0131 kolay."
          },
          "2": {
            "text": "\"Tamam sorun de\u011fil, bir ara tekrar deneriz!\"",
            "correct": False,
            "explanation": "Yine \"bir ara\". Belirsizli\u011fe d\u00f6nd\u00fc. Enerji tamamen kayboluyor."
          }
        }
      },
      "3": {
        "type": "mission",
        "title": "Tek Y\u00f6nlendirme Kural\u0131",
        "instruction": "Bu hafta biri sana yumu\u015fak bir hay\u0131r verirse, belirli alternatif bir zamanla bir kez y\u00f6nlendir. Tekrar ka\u00e7\u0131n\u0131rlarsa \u2014 tamamen ve t\u00fcm onurunla b\u0131rak.",
        "tips": {
          "0": "Bir y\u00f6nlendirme = g\u00fcvenli. \u0130ki y\u00f6nlendirme = kovalama.",
          "1": "Y\u00f6nlendirme orijinal davettten daha hafif hissettirmeli, daha a\u011f\u0131r de\u011fil",
          "2": "Iki kez ka\u00e7\u0131n\u0131rsa \u015fu an yeterince ilgili de\u011fil. Bu sorun de\u011fil."
        }
      }
    }
  },
  "c3_l4": {
    "title": "Takip Etme Kural\u0131",
    "duration": "3 dk",
    "steps": {
      "0": {
        "type": "concept",
        "heading": "\u0130nsanlar kaybedebilecekleri \u015feylerden, kazanabilecekleri \u015feylerden daha \u00e7ok etkileniyor.",
        "body": "Zaten kabul etti\u011fin bir \u015feyi kaybetme olas\u0131l\u0131\u011f\u0131, yeni bir \u015fey teklif edilmesinden farkl\u0131 bir aciliyet aktive ediyor. Kay\u0131p e\u015fde\u011fer kazan\u00e7tan yakla\u015f\u0131k iki kat daha yo\u011fun hissettiriyor.\n\nOnaylanm\u0131\u015f bir bulu\u015fmadan 24 saat \u00f6nce lojistik bir kontrol bunu yapar. Zaten kabul etti. Bulu\u015fma zihninde ger\u00e7ek. K\u0131sa, lojistik bir mesaj \u2014 kayg\u0131l\u0131 de\u011fil, sadece organizasyonel \u2014 bunun ger\u00e7ekle\u015fti\u011fini hat\u0131rlat\u0131r. Bu kovalamaktan farkl\u0131.\n\nYapmamal\u0131klar\u0131n: ayn\u0131 sabah heyecanl\u0131 \"hala oluyor mu?? :)\" mesaj\u0131 g\u00f6ndermek. Bu t\u00fcm hafta bunu d\u00fc\u015f\u00fcnd\u00fc\u011f\u00fcn\u00fc sinyaliyor. Yapmal\u0131klar\u0131n: 24 saat \u00f6nce, 15 kelimeden az, sadece lojistik bir kontrol.",
        "examples": {
          "0": { "label": "Kontrol", "text": "\"Yar\u0131n hala oluyor mu? Aksini duymad\u0131k\u00e7a rezervasyonu 7:30 i\u00e7in yapaca\u011f\u0131m.\"" },
          "1": { "label": "G\u00f6ndermeyece\u011fin", "text": "\"Hey!! Yar\u0131n hala iyi mi?? \u00c7ok heyecanl\u0131y\u0131m :)\"" },
          "2": { "label": "Do\u011frulamazsa", "text": "Planlar\u0131n vard\u0131. Ba\u015fka bir \u015fey yaptin. Tamamen iyisin." }
        }
      },
      "1": {
        "type": "do_dont",
        "context": "4 g\u00fcn \u00f6nce Cumartesi ak\u015fam yeme\u011fini kabul etti. \u015eimdi Cuma \u00f6\u011fleden sonra.",
        "dont": "\"Hey!! Yar\u0131n hala iyi mi?? \u00c7ok heyecanl\u0131y\u0131m :)\"",
        "do": "\"Yar\u0131n hala oluyor mu? Aksini duymad\u0131k\u00e7a rezervasyonu 7:30 i\u00e7in yapaca\u011f\u0131m.\"",
        "why": "Hay\u0131r demek a\u00e7\u0131k\u00e7a kayg\u0131l\u0131 \u2014 lojistik bir kontrolde heyecan g\u00f6steriyorsun. Evet demek organizasyonel ve varsay\u0131msal. \"Aksini duymad\u0131k\u00e7a\" ne olursa olsun ilerleyece\u011fini ima ediyor, bu da ba\u015fka i\u015flerin oldu\u011funu sinyaliyor."
      },
      "2": {
        "type": "quiz",
        "question": "Sal\u0131 ak\u015fam yeme\u011fini kabul etti. Pazartesi \u00f6\u011flen ve hala onaylamad\u0131. Ne g\u00f6nderirsin?",
        "options": {
          "0": {
            "text": "\"Hey yar\u0131n hala oluyor mu? Haber ver! :)\"",
            "correct": False,
            "explanation": "\"Haber ver\" t\u00fcm g\u00fcct\u00fc ona b\u0131rak\u0131yor. Emoji kayg\u0131l\u0131 bir noktalama i\u015fareti."
          },
          "1": {
            "text": "\"Aksini s\u00f6ylemezsen bu gece saat 7 i\u00e7in rezervasyon yap\u0131yorum.\"",
            "correct": True,
            "explanation": "Lojistik, g\u00fcvenli. \u0130lerliyor. Sadece onaylamas\u0131 ya da y\u00f6nlendirmesi gerekiyor."
          },
          "2": {
            "text": "Hi\u00e7bir \u015fey \u2014 ilgileniyorsa kendisi onaylar",
            "correct": False,
            "explanation": "Pasif. Bir zaman \u00fczerinde anlat\u015ft\u0131\u011f\u0131n\u0131z\u0131 hat\u0131rlamayabilir. Bir lojistik kontrol kovalamak de\u011fil."
          }
        }
      },
      "3": {
        "type": "mission",
        "title": "Sadece-Lojistik Kontrol",
        "instruction": "Bir dahaki onaylanm\u0131\u015f bulu\u015fmanda, tam 24 saat \u00f6nce bir kontrol g\u00f6nder. 15 kelimeden az. Sadece lojistik. Hi\u00e7bir duygusal \u015fey.",
        "tips": {
          "0": "Zaman + yer + onay. Hepsi bu.",
          "1": "\"Cok heyecanland\u0131m\" yok \u2014 bu enerji de\u011fil kayg\u0131 aktar\u0131r",
          "2": "Kontrolunden sonra sessizle\u015firse: s\u00f6ylemeden iptal etti. Kendine sayg\u0131 g\u00f6ster ve devam et."
        }
      }
    }
  }
}

data['challenges']['lessons'] = lessons

with open('i18n/tr.json', 'w', encoding='utf-8') as f:
    json.dump(data, f, ensure_ascii=False, indent=2)

print("Part 1 done - c3 lessons written")
print("Lessons keys:", list(data['challenges']['lessons'].keys()))

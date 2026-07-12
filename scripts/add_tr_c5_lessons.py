#!/usr/bin/env python3
import json

with open('i18n/tr.json', 'r', encoding='utf-8') as f:
    data = json.load(f)

c5_lessons = {
  "c5_l1": {
    "title": "Metinde \u0130lgi Sinyalleri",
    "duration": "4 dk",
    "steps": {
      "0": {
        "type": "concept",
        "heading": "\u0130lgi doku\u015fta g\u00f6r\u00fcn\u00fcyor \u2014 insanlar\u0131n ne s\u00f6yledi\u011finde de\u011fil, nas\u0131l s\u00f6yledi\u011finde.",
        "body": "Kar\u015f\u0131l\u0131kl\u0131 ilgili iki ki\u015finin birbiri dil kal\u0131plar\u0131n\u0131 yans\u0131tmaya ba\u015flad\u0131\u011f\u0131 iyi belgelenmi\u015f bir fenomen var \u2014 bilin\u00e7li olarak de\u011fil, ama ger\u00e7ek dikkatin do\u011fal sonucu olarak. Ritmi, enerjiyi, c\u00fcmle yap\u0131s\u0131n\u0131 e\u015fle\u015ftiriyorlar. Bu yak\u0131nla\u015fma, mesajlar\u0131n i\u00e7eri\u011finden daha g\u00fcvenilir bi\u00e7imde kar\u015f\u0131l\u0131kl\u0131 ilgiyi \u00f6ng\u00f6r\u00fcyor.\n\nMetinde, ilgi okunabilir spesifik \u015fekillerde g\u00f6r\u00fcn\u00fcyor: yan\u0131t s\u00fcresi k\u0131sal\u0131yor. Mesajlar uzuyor. Sorular kendili\u011finden geri geliyor. Daha \u00f6nce s\u00f6yledi\u011fin \u015feylere at\u0131fta bulunuyor \u2014 takip ediyordu. Sorulmad\u0131\u011f\u0131n ayr\u0131nt\u0131lar ekliyor. Konu\u015fma do\u011fal olarak biterken konu\u015fmay\u0131 devam ettirme nedenleri buluyor.\n\nBunlar a\u00e7\u0131klamalar de\u011fil. Davran\u0131\u015f kaymas\u0131 \u2014 her iki taraf da e\u011fildi\u011fi i\u00e7in konu\u015fma bir \u015feye do\u011fru hareket ediyor. Herhangi biriniz a\u00e7\u0131k\u00e7a bir \u015fey s\u00f6ylemeden \u00f6nce al\u0131\u015fveri\u015fin dokusunda okuyabilirsin.",
        "examples": {
          "0": { "label": "Y\u00fcksek ilgi dokusu", "text": "H\u0131zl\u0131 yan\u0131tlar / uzun mesajlar / geri gelen sorular / daha \u00f6nce s\u00f6yledi\u011fin \u015feylere at\u0131flar / ekstra ayr\u0131nt\u0131 g\u00f6n\u00fcll\u00fc olarak sunuyor" },
          "1": { "label": "D\u00fc\u015f\u00fck ilgi dokusu", "text": "Yava\u015f yan\u0131tlar / k\u0131sa mesajlar / geri gelen soru yok / tek heceli cevaplar / konu\u015fma devam ettirme gayreti olmadan sona eriyor" }
        }
      },
      "1": {
        "type": "do_dont",
        "context": "Yak\u0131n bir konu\u015fmay\u0131 okumak",
        "dont": "Tek mesajlardan ya da ne s\u00f6yledi\u011finden ilgiyi okumaya \u00e7al\u0131\u015fmak",
        "do": "Kal\u0131b\u0131 oku: yan\u0131t gecikmesi, mesaj uzunlu\u011fu, soru oran\u0131, istenmeyen eklemeler. Bu sinyal.",
        "why": "Tek mesajlar yan\u0131lt\u0131c\u0131 olabilir \u2014 insanlar\u0131n k\u00f6t\u00fc g\u00fcnleri, kuru mizahlar\u0131, farkl\u0131 mesajla\u015fma stilleri var. Birden fazla al\u0131\u015fveri\u015fteki kal\u0131p, herhangi bir tek mesajdan \u00e7ok daha g\u00fcvenilir."
      },
      "2": {
        "type": "quiz",
        "question": "H\u0131zl\u0131 yan\u0131t veriyor ama her zaman geri soru sormadan k\u0131sa, tam cevaplar veriyor. Kal\u0131p ne \u00f6neriyor?",
        "options": {
          "0": {
            "text": "Y\u00fcksek ilgi \u2014 h\u0131zl\u0131 yan\u0131t veriyor",
            "correct": False,
            "explanation": "Yan\u0131t s\u00fcresi bir sinyal, tam resim de\u011fil. Geri soru yok ve devam etmeyen tam cevaplar d\u00fc\u015f\u00fck ilgi sinyalleri."
          },
          "1": {
            "text": "Belirsiz \u2014 ama geri soru olmamas\u0131 dikkate de\u011fer",
            "correct": True,
            "explanation": "H\u0131zl\u0131 yan\u0131tlar sadece onun mesajla\u015fma stili olabilir. Tutarl\u0131 geri soru yoklu\u011fu daha anlaml\u0131. Kombinasyon nazik kat\u0131l\u0131m, ger\u00e7ek ilgi de\u011fil anlam\u0131na gelebilir."
          },
          "2": {
            "text": "D\u00fc\u015f\u00fck ilgi \u2014 k\u0131sa cevaplar ilgili olmad\u0131\u011f\u0131n\u0131 g\u00f6steriyor",
            "correct": False,
            "explanation": "K\u0131sa cevaplar tek ba\u015fina yeterli de\u011fil. Baz\u0131 insanlar k\u0131sa yaz\u0131yor ve \u00e7ok ilgileniyorlar. Birden fazla sinyaldeki kal\u0131p \u00f6nemli."
          }
        }
      },
      "3": {
        "type": "mission",
        "title": "Kal\u0131b\u0131 Oku",
        "instruction": "\u0130ki konu\u015fma se\u00e7: umut verici g\u00f6r\u00fcnen biri ve donuk g\u00f6r\u00fcnen biri. Dokuyu k\u0131yasla: yan\u0131t s\u00fcresi, mesaj uzunlu\u011fu, geri sorular, ekstra ayr\u0131nt\u0131. Ger\u00e7ekten farkl\u0131 olan ne?",
        "tips": {
          "0": "Tek mesajlara de\u011fil kal\u0131plara bak\u0131yorsun",
          "1": "Nesnel olmaya \u00e7al\u0131\u015f \u2014 ba\u015fkas\u0131n\u0131n konu\u015fmas\u0131 gibi oku",
          "2": "Donuk olanda muhtemelen adland\u0131rabilece\u011fin spesifik doku ipucu var"
        }
      }
    }
  },
  "c5_l2": {
    "title": "\u0130lgilenmeme Sinyalleri",
    "duration": "4 dk",
    "steps": {
      "0": {
        "type": "concept",
        "heading": "Sosyal \u00e7ekilme \u00f6ng\u00f6r\u00fclebilir bir kal\u0131p izliyor. Erkenden okumay\u0131 \u00f6\u011fren.",
        "body": "\u0130lgilenmemek genellikle a\u00e7\u0131klanm\u0131yor \u2014 kayar. \u0130nsanlar genellikle \"ilgimi yitiriyorum\" demiyor. Sadece farkl\u0131 yan\u0131t vermeye ba\u015fl\u0131yorlar. Sinyaller kademeli ve tutarl\u0131: yan\u0131t s\u00fcresi art\u0131yor, mesaj uzunlu\u011fu azal\u0131yor, geri sorular kayboluyor, gelecekteki planlardan bahis kayboluyor.\n\nBunlar bilin\u00e7li kararlar de\u011fil. Davran\u0131\u015f kaymas\u0131 \u2014 birinin dikkatinin ba\u015fka yere ta\u015f\u0131nmas\u0131n\u0131n do\u011fal sonucu. \u0130ste\u011fe ba\u011fl\u0131 sinyaller, bu y\u00fczden g\u00fcvenilir.\n\nHata, bunlar\u0131 ge\u00e7ici olarak yorumlamak ve d\u00fczeltmeye \u00e7al\u0131\u015fmak. \"Belki sadece mesguldir\" bazen do\u011frudur. Ama \"di\u011fer her \u015feye yan\u0131t verirken 10 g\u00fcnd\u00fcr mesgul\" veri.\n\n\u0130lgilenmemeyi erken okumak neredeyse hi\u00e7bir \u015feye malolmuyor. Zaman\u0131n\u0131 y\u00f6nlendiriyorsun. Okumamak \u2014 a\u00e7\u0131klamak, daha fazla mesaj atmak, daha fazla \u00e7aba g\u00f6stermek \u2014 \u00e7ok pahal\u0131ya mal oluyor.",
        "examples": {
          "0": { "label": "Erken sinyal", "text": "Yan\u0131tlar 10 dakikan\u0131n alt\u0131ndan tutarl\u0131 bir \u015fekilde birka\u00e7 saate \u00e7\u0131kt\u0131." },
          "1": { "label": "Do\u011frulanm\u0131\u015f sinyal", "text": "Yan\u0131tlar konu\u015fmay\u0131 devam ettirmek yerine bitiren tam c\u00fcmleler." },
          "2": { "label": "Net sinyal", "text": "5+ ard\u0131\u015f\u0131k mesajda geri soru yok." }
        }
      },
      "1": {
        "type": "do_dont",
        "context": "Ge\u00e7en hafta boyunca k\u0131sa yan\u0131tlar veriyor ve yan\u0131tlamak \u00e7ok daha uzun s\u00fcr\u00fcyor",
        "dont": "Yeniden kat\u0131lmak i\u00e7in daha ilgin\u00e7 mesajlar g\u00f6ndermek ya da \"her \u015fey yolunda m\u0131?\" sormak",
        "do": "Tek temiz bir kanca mesaj g\u00f6nder. Kal\u0131p de\u011fi\u015fmezse \u2014 sinyali kabul et.",
        "why": "Biri \u00e7ekilirken daha fazla \u00e7aba g\u00f6stermek odak\u0131 okuyamad\u0131\u011f\u0131n\u0131 \u2014 ve onlar\u0131n kat\u0131l\u0131m\u0131na verdikleri\u011finden daha fazla ihtiyac\u0131n oldu\u011funu sinyaliyor. Son bir kanca sayg\u0131l\u0131. Art\u0131\u015fan giri\u015fim serisi de\u011fil."
      },
      "2": {
        "type": "quiz",
        "question": "Son 6 mesaj\u0131na 1-2 kelimelik cevaplar verdi ve soru yok. En do\u011fru okuma?",
        "options": {
          "0": {
            "text": "Sadece mesgul \u2014 konu\u015fmay\u0131 devam ettir",
            "correct": False,
            "explanation": "Mesgul insanlar bazen k\u0131sa yan\u0131t veriyor. 6 mesajda s\u0131f\u0131r soruyla tutarl\u0131 k\u0131sa yan\u0131tlar bir tesad\u00fcf de\u011fil, kal\u0131p."
          },
          "1": {
            "text": "D\u00fc\u015f\u00fck kat\u0131l\u0131m net sinyali. Son bir kanca, sonra b\u0131rak.",
            "correct": True,
            "explanation": "Kal\u0131p a\u00e7\u0131k. Bir son temiz deneme mant\u0131kl\u0131. Kal\u0131p de\u011fi\u015fmezse, sinyal ger\u00e7ek."
          },
          "2": {
            "text": "Seni test ediyor \u2014 devam et",
            "correct": False,
            "explanation": "Test davran\u0131\u015f\u0131 genellikle tek seferlik bir geri itmedir, haftal\u0131k tutarl\u0131 \u00e7ekilme de\u011fil. \u0130lgilenmemeyi test olarak a\u00e7\u0131klamak genellikle dilekle\u015ftirici d\u00fc\u015f\u00fcncedir."
          }
        }
      },
      "3": {
        "type": "mission",
        "title": "Bir Konu\u015fmadaki Kal\u0131b\u0131 Adland\u0131r",
        "instruction": "Bir \u015feylerin de\u011fi\u015fti\u011fi bir konu\u015fma bul. De\u011fi\u015fmeden \u00f6nce ve sonra 10 mesaj\u0131 geri oku. Dokuda tam olarak ne de\u011fi\u015fti\u011fini adland\u0131r.",
        "tips": {
          "0": "D\u00fcr\u00fcst ol \u2014 muhtemelen zaten biliyordun",
          "1": "Ama\u00e7 k\u00f6t\u00fc hissetmek de\u011fil. Ama\u00e7 daha erken, daha do\u011fru okumak",
          "2": "Erken do\u011fru okuma \u00f6nemli zaman ve enerji kazan\u0131m\u0131 sa\u011fl\u0131yor"
        }
      }
    }
  },
  "c5_l3": {
    "title": "S\u0131cak ve So\u011fuk Davran\u0131\u015f",
    "duration": "5 dk",
    "steps": {
      "0": {
        "type": "concept",
        "heading": "Tutars\u0131zl\u0131k genellikle bir strateji de\u011fil. Genellikle bir korkudur.",
        "body": "S\u0131cak ve so\u011fuk davran\u0131\u015f \u2014 ger\u00e7ek s\u0131cakl\u0131k ard\u0131ndan ani \u00e7ekilme, tutars\u0131z m\u00fcvakkatlik, yak\u0131nl\u0131k sonras\u0131 uzakl\u0131k \u2014 genellikle \"z\u00f6r g\u00f6r\u00fcnme\" olarak yanl\u0131\u015f okunuyor. Neredeyse hi\u00e7 \u00f6yle de\u011fil.\n\nBa\u011flanma ara\u015ft\u0131rmalar\u0131 onlarca y\u0131ld\u0131r buna tutarl\u0131: erken hayatta tahmin edilemeyen bak\u0131c\u0131l\u0131k ya\u015fayan insanlar kayg\u0131l\u0131 ba\u011flanma stili geli\u015ftiriyor \u2014 ger\u00e7ekten yak\u0131nl\u0131k istiyorlar ama bitece\u011finden korkuyorlar, bu y\u00fczden di\u011fer ki\u015fi \u00f6nce \u00e7ekilmeden \u00f6nce kendileri uzakl\u0131k yarat\u0131yor. S\u0131cak/so\u011fuk kal\u0131p bir oyun de\u011fil. Bir korku tepkisi.\n\nBunu anlamak yan\u0131t verme \u015feklinizi de\u011fi\u015ftiriyor. Strateji olarak ele al\u0131rsan, i\u00e7ine giriyorsun \u2014 o \u00e7ekildi\u011finde daha fazla \u00e7aba g\u00f6steriyorsun, bu da onun korkusunu do\u011frular\u0131yor. Korku olarak anlarsan, kovalamak yerine yerinde durabilirsin \u2014 ki bu asl\u0131nda kayg\u0131l\u0131 ba\u011flanman\u0131n daha g\u00fcvende hissetmek i\u00e7in ihtiyac\u0131 olan \u015fey.",
        "examples": {
          "0": { "label": "S\u0131cak/so\u011fuk kal\u0131p", "text": "\u00dc\u00e7 g\u00fcnl\u00fck yo\u011fun kat\u0131l\u0131m \u2192 ani uzakl\u0131k \u2192 sen \u00e7ekildi\u011finde yeniden s\u0131cakl\u0131k \u2192 yeniden kat\u0131ld\u0131\u011f\u0131nda uzakl\u0131k." },
          "1": { "label": "Fark", "text": "\"Z\u00f6r g\u00f6r\u00fcnmek\" hesapl\u0131. Kayg\u0131l\u0131 ba\u011flanma iste\u011fe ba\u011fl\u0131 de\u011fil. Doku farkl\u0131 hissettiriyor \u2014 biri kasasl\u0131 g\u00f6r\u00fcn\u00fcyor, di\u011feri ger\u00e7ek kafa kar\u0131\u015f\u0131kl\u0131\u011f\u0131 gibi." }
        }
      },
      "1": {
        "type": "do_dont",
        "context": "Ge\u00e7en hafta \u00e7ok kat\u0131l\u0131mc\u0131yd\u0131 ve bu hafta herhangi a\u00e7\u0131k bir neden olmadan so\u011fudu",
        "dont": "Daha fazla mesaj g\u00f6ndermek ya da yeniden kat\u0131lmak i\u00e7in \u00e7abay\u0131 artt\u0131rmak",
        "do": "Yerinde dur. \u0130stersen bir mesaj. Enerji d\u00fczeyini ona g\u00f6re de\u011fi\u015ftirme.",
        "why": "Kovalamak korkuyu do\u011frular: yak\u0131nl\u0131k dengesiz ve geri \u00e7ekilecek, bu y\u00fczden \u00f6nce ben \u00e7ekileyim. Yerinde durmak \u2014 so\u011fuk de\u011fil, umutsuz de\u011fil \u2014 farkl\u0131 bir \u015fey sinyaliyor: tutarl\u0131y\u0131m. Bu asl\u0131nda yard\u0131mc\u0131 olan \u015fey."
      },
      "2": {
        "type": "quiz",
        "question": "5 g\u00fcn \u00e7ok s\u0131cakt\u0131, sonra 3 g\u00fcn sessiz kald\u0131. Az \u00f6nce s\u0131cak bir mesaj g\u00f6nderdi. Ne oluyor?",
        "options": {
          "0": {
            "text": "Z\u00f6r g\u00f6r\u00fcn\u00fcyor \u2014 bu ilgini canl\u0131 tutuyor",
            "correct": False,
            "explanation": "M\u00fcmk\u00fcn, ama daha yayg\u0131n a\u00e7\u0131klama kayg\u0131l\u0131 ba\u011flanma \u2014 yak\u0131nla\u015ft\u0131, korktu, \u00e7ekildi ve art\u0131k daha g\u00fcvende hissedince yeniden ula\u015f\u0131yor. D\u00f6ng\u00fc kovalanarak kar\u015f\u0131lan\u0131rsa devam edecek."
          },
          "1": {
            "text": "Muhtemelen kayg\u0131l\u0131 ba\u011flanma \u2014 yak\u0131nla\u015ft\u0131, korktu, \u00e7ekildi ve art\u0131k daha g\u00fcvende hissedince yeniden ula\u015f\u0131yor",
            "correct": True,
            "explanation": "Kal\u0131pla en tutarl\u0131. Yan\u0131t ayn\u0131: yerinde kal, kat\u0131l\u0131mc\u0131 ama t\u0131rmanmadan, kal\u0131b\u0131n stabile edip etmedi\u011fine bak."
          },
          "2": {
            "text": "D\u00fc\u015f\u00fck ilgi \u2014 sadece can s\u0131k\u0131ld\u0131\u011f\u0131nda mesaj at\u0131yor",
            "correct": False,
            "explanation": "Ba\u015ftaki 5 g\u00fcnl\u00fck ger\u00e7ek s\u0131cakl\u0131k can s\u0131k\u0131nt\u0131s\u0131ndan fazlas\u0131n\u0131 \u00f6neriyor. D\u00f6ng\u00fc kal\u0131b\u0131 ilgisizlikten \u00e7ok ba\u011flanma dinami\u011fine i\u015faret ediyor."
          }
        }
      },
      "3": {
        "type": "mission",
        "title": "D\u00f6ng\u00fcy\u00fc Haritala",
        "instruction": "S\u0131cak/so\u011fuk kal\u0131b\u0131 olan bir konu\u015fman var ise \u2014 haritala. S\u0131cakl\u0131k ne zaman oldu? \u00c7ekilmeyi ne tetikledi? Geri d\u00f6n\u00fc\u015ften \u00f6nce ne geldi? D\u00f6ng\u00fcy\u00fc ara.",
        "tips": {
          "0": "\u00c7ekilme tetikleyicisini tan\u0131mlamaya \u00e7al\u0131\u015f\u0131yorsun, a\u00e7\u0131klamaya de\u011fil",
          "1": "Yak\u0131nl\u0131k \u2192 \u00e7ekilme \u2192 geri d\u00f6n\u00fc\u015f kayg\u0131l\u0131 ba\u011flanma d\u00f6ng\u00fcs\u00fc",
          "2": "Senin i\u015fin yerinde kalmak, d\u00fczeltmek de\u011fil"
        }
      }
    }
  },
  "c5_l4": {
    "title": "Sessizlik Ne Anlama Geliyor",
    "duration": "4 dk",
    "steps": {
      "0": {
        "type": "concept",
        "heading": "Belirsiz durumlarda beyin varsay\u0131lan olarak olumsuz yoruma ge\u00e7iyor. Genellikle yanl\u0131\u015f.",
        "body": "Belirsiz bilgiyi i\u015fleme bi\u00e7iminde tutarl\u0131 bir asimetri var: olumsuz sinyaller e\u015fde\u011fer a\u011f\u0131rl\u0131ktaki olumlu sinyallerden daha g\u00fc\u00e7l\u00fc kayded iliyor. Bu uyumu \u2014 bir tehdidi ka\u00e7\u0131rmak bir f\u0131rsat\u0131 ka\u00e7\u0131rmaktan daha pahal\u0131yd\u0131. Ama modern ba\u011flamlarda, sistematik bir hata \u00fcretiyor: varsay\u0131lan olarak belirsiz sinyalleri olumsuz yorumluyoruz.\n\nSessizlik bunun en yayg\u0131n kurban\u0131. 4 saattir yan\u0131t vermiyor. Beyin \u015funlar\u0131 \u00f6neriyor: ilgisini yitiriyor. G\u00f6rd\u00fc ve yan\u0131t vermedi. Ba\u015fkas\u0131yla konu\u015fuyor. Bunlar sonu\u00e7lar de\u011fil \u2014 beynin belirsizli\u011fi en k\u00f6t\u00fc senaryolarla doldurmas\u0131.\n\nSessizlikteki ger\u00e7ek sinyal-g\u00fcr\u00fclt\u00fc oran\u0131 hissettirdi\u011finden \u00e7ok daha d\u00fc\u015f\u00fck. \u00c7o\u011fu sessizli\u011fin s\u0131k\u0131c\u0131 a\u00e7\u0131klamalar\u0131 var: mesgul oldu, yan\u0131tlamay\u0131 unuttu, ne s\u00f6yleyece\u011fini bilmedi. Bu okumaya g\u00f6re davranmak \u2014 takip mesajlar\u0131, rotay\u0131 d\u00fczeltmek, artan kayg\u0131 \u2014 tam korktu\u011fun sonucu \u00fcretiyor.",
        "examples": {
          "0": { "label": "Beyninin s\u00f6yledi\u011fi", "text": "\"6 saattir yan\u0131t vermiyor. A\u00e7\u0131k\u00e7a ilgisini yitirdi.\"" },
          "1": { "label": "Muhtemelen do\u011fru olan", "text": "\"Mesgul oldu, yan\u0131tlamay\u0131 unuttu, sonra d\u00f6necek, uykuda, bir \u015fey \u00e7\u0131kt\u0131.\"" },
          "2": { "label": "Test", "text": "6 saattir sessizse ama Instagram hikayesi yeni geldiyse \u2014 bu veri. Hi\u00e7bir y\u00f6nde kan\u0131t yoksa \u2014 bekle." }
        }
      },
      "1": {
        "type": "do_dont",
        "context": "Konu\u015fma ortas\u0131nda g\u00f6nderdi\u011fin mesaja 5 saattir yan\u0131t vermiyor",
        "dont": "Takip mesaj\u0131 g\u00f6ndermek, ya da \"mesaj\u0131m\u0131 g\u00f6rd\u00fcn m\u00fc?\", ya da yeniden kat\u0131lmak i\u00e7in yeni konu",
        "do": "Hi\u00e7bir \u015fey. Olumsuzluk \u00f6ny arg\u0131s\u0131 sana yanl\u0131\u015f bir okuma veriyor. Bekle.",
        "why": "Olumsuz yoruma g\u00f6re hareket etmek sorunu yarat\u0131yor. Yan\u0131tlamak \u00fczere olabilirdi. \u015eimdi onun yan\u0131t\u0131ndan \u00f6nce iki mesaj g\u00f6nderdin, bu da tam ka\u00e7\u0131nmaya \u00e7al\u0131\u015ft\u0131\u011f\u0131n kayg\u0131 dinami\u011fini sinyaliyor."
      },
      "2": {
        "type": "quiz",
        "question": "\u0130yi bir konu\u015fmadan sonra 8 saattir yan\u0131t vermedi. Yorumun?",
        "options": {
          "0": {
            "text": "\u0130lgisini yitiriyor \u2014 8 saat uzun bir zaman",
            "correct": False,
            "explanation": "8 saat birinin g\u00fcn\u00fcnde normal bir zaman. \u0130\u015f, uyku, ba\u015fka \u015feyler. Olumsuzluk \u00f6ny arg\u0131s\u0131 bunu g\u00fcr\u00fclt\u00fc iken sinyal olarak okuyor."
          },
          "1": {
            "text": "Belirsiz \u2014 herhangi bir \u015fey olabilir. Harekete ge\u00e7me.",
            "correct": True,
            "explanation": "\u0130yi bir konu\u015fmadan sonra 8 saatlik sessizlik ger\u00e7ekten belirsiz. Do\u011fru hamle beklemek, yanl\u0131\u015f olabilecek bir yoruma yan\u0131t vermek de\u011fil."
          },
          "2": {
            "text": "Sabrimi test ediyor \u2014 rah at\u015fiz olmad\u0131\u011f\u0131m\u0131 g\u00f6stermek i\u00e7in ula\u015fmal\u0131y\u0131m",
            "correct": False,
            "explanation": "\"Test ediyor\" \"ilgisini yitiriyor\" ayna-ima hatas\u0131 \u2014 ikisi de belirsizli\u011fi bir hikayeyle dolduruyor. Ger\u00e7ek veri i\u00e7in bekle."
          }
        }
      },
      "3": {
        "type": "mission",
        "title": "Ger\u00e7ek Zamanda \u00d6ny arg\u0131y\u0131 Yakala",
        "instruction": "Sessizlikten sonra bir takip g\u00f6ndermek istedi\u011finde \u2014 \u00fczerine hareket etti\u011fin yorumu yaz. Kan\u0131t m\u0131 yoksa varsay\u0131m m\u0131? 24 saat bekle. Sonra yorumun do\u011fru olup olmad\u0131\u011f\u0131n\u0131 kontrol et.",
        "tips": {
          "0": "Yazmak otomatik tepki d\u00f6ng\u00fcs\u00fcn\u00fc yava\u015flat\u0131r",
          "1": "\"Yan\u0131t vermedi\" ile \"ilgisini yitiriyor\" aras\u0131ndaki bo\u015flu\u011fu fark et \u2014 bu \u00f6ny arg\u0131",
          "2": "\u00c7o\u011fu sessizlik m\u00fcdahalesiz \u00e7\u00f6z\u00fcl\u00fcyor"
        }
      }
    }
  },
  "c5_l5": {
    "title": "Kirmizi Bayraklar vs Z\u00f6r G\u00f6r\u00fcnmek",
    "duration": "5 dk",
    "steps": {
      "0": {
        "type": "concept",
        "heading": "\"Z\u00f6r g\u00f6r\u00fcnmek\" neredeyse her zaman yanl\u0131\u015f te\u015fhis ediliyor.",
        "body": "Bu konudaki ara\u015ft\u0131rma y\u0131llard\u0131r a\u00e7\u0131k: ayr\u0131ms\u0131z m\u00fcvakkat olmamak \u2014 herkes i\u00e7in so\u011fuk ya da ula\u015fmas\u0131 zor olmak \u2014 birini daha \u00e7ekici yapm\u0131yor. D\u00fc\u015f\u00fck sosyal arzu edilebilirlik sinyali veriyor. Ger\u00e7ek sosyal de\u011fere sahip hi\u00e7 kimse herkese ula\u015f\u0131lmazd\u0131r.\n\nNe i\u015fe yar\u0131yor se\u00e7ici zorluk: genel olarak ger\u00e7ekten mesgul ya da ula\u015f\u0131lmaz olmak, belirli ki\u015fiye spesifik ilgi g\u00f6sterirken. Y\u00fcksek genel se\u00e7icilik + ger\u00e7ek spesifik ilginin kombinasyonu dinami\u011fi yarat\u0131yor. Bu ger\u00e7ek bir nitelik, sergilenen de\u011fil.\n\nPratik sorun \"z\u00f6r g\u00f6r\u00fcn\u00fcyor\" genellikle d\u00fc\u015f\u00fck ilgi i\u00e7in varsay\u0131lan a\u00e7\u0131klama. Temel ayr\u0131mlar: Z\u00f6r g\u00f6r\u00fcnmek, mevcut oldu\u011funuzda s\u0131cak ilgiyi, ba\u011flanm\u0131\u015fken ger\u00e7ek kat\u0131l\u0131m\u0131, sadece di\u011fer zamanlarda stratejik m\u00fcvakkat olmamay\u0131 i\u00e7erir. D\u00fc\u015f\u00fck ilgi tutarl\u0131 m\u00fcvakkat olmamak, mevcut oldu\u011funuzda s\u0131cakl\u0131k yok, ba\u011flanm\u0131\u015fken minimal kat\u0131l\u0131m gibi g\u00f6r\u00fcn\u00fcyor.",
        "examples": {
          "0": { "label": "Z\u00f6r g\u00f6r\u00fcnmek (nadir)", "text": "Yan\u0131t vermesi yava\u015f, ama kat\u0131ld\u0131\u011f\u0131nda: s\u0131cak, ilgili, etkile\u015fimi de\u011ferli k\u0131l\u0131yor. Mevcut oldu\u011funda ger\u00e7ek s\u0131cakl\u0131kla stratejik m\u00fcvakkat olmamak." },
          "1": { "label": "D\u00fc\u015f\u00fck ilgi (yayg\u0131n)", "text": "Yan\u0131t vermesi yava\u015f, ve kat\u0131ld\u0131\u011f\u0131nda: k\u0131sa cevaplar, soru yok, konu\u015fmay\u0131 bitiren yan\u0131tlar. Ba\u011flamlar aras\u0131nda tutarl\u0131." }
        }
      },
      "1": {
        "type": "do_dont",
        "context": "Tutarl\u0131 \u015fekilde yan\u0131t vermesi yava\u015f, yan\u0131tlar k\u0131sa, konu\u015fmaya hi\u00e7bir zaman katk\u0131 sa\u011flamiyor",
        "dont": "\"Z\u00f6r g\u00f6r\u00fcn\u00fcyor\" deyip daha fazla \u00e7aba g\u00f6stermek",
        "do": "Sinyali kabul et. Son bir temiz kanca mesaj. Kal\u0131p de\u011fi\u015fmezse \u2014 d\u00fc\u015f\u00fck ilgi.",
        "why": "D\u00fc\u015f\u00fck ilgiyi stratejik davran\u0131\u015f olarak yanl\u0131\u015f te\u015fhis etmek asimetrik bir duruma yat\u0131r\u0131m yapmaya devam etmeye yol a\u00e7\u0131yor. Maliyet birikir. Erken do\u011fru okuma hepsini kazan\u0131r."
      },
      "2": {
        "type": "quiz",
        "question": "Her \u015feye 3-4 saat bekliyor, ama yapt\u0131\u011f\u0131nda uzun mesajlar yaz\u0131yor ve ger\u00e7ek sorular soruyor. Ne oluyor?",
        "options": {
          "0": {
            "text": "D\u00fc\u015f\u00fck ilgi \u2014 a\u00e7\u0131k\u00e7a o kadar kat\u0131l\u0131mc\u0131 de\u011fil",
            "correct": False,
            "explanation": "Yan\u0131t s\u00fcresi bir sinyal. Ger\u00e7ek sorularla uzun, kat\u0131l\u0131mc\u0131 mesajlar y\u00fcksek ilgi dokusu. Genel kal\u0131p ger\u00e7ek ilgiye i\u015faret ediyor, yava\u015f mesajla\u015fma stiliyle."
          },
          "1": {
            "text": "Muhtemelen ger\u00e7ek ilgi \u2014 kat\u0131l\u0131m kalitesi yan\u0131t s\u00fcresini ge\u00e7ersiz k\u0131l\u0131yor",
            "correct": True,
            "explanation": "Mevcut oldu\u011funda y\u00fcksek kaliteli kat\u0131l\u0131m daha g\u00fcvenilir sinyal. Sadece yava\u015f yazabilir. Yava\u015f yan\u0131tlar + zengin kat\u0131l\u0131m bilinen bir kal\u0131p \u2014 d\u00fc\u015f\u00fck ilgi de\u011fil."
          },
          "2": {
            "text": "Z\u00f6r g\u00f6r\u00fcn\u00fcyor \u2014 e\u015fle\u015ftirmek i\u00e7in daha az m\u00fcvakkat ol",
            "correct": False,
            "explanation": "Hi\u00e7bir \u015fey performans gibi g\u00f6r\u00fcnm\u00fcyor \u2014 mevcut oldu\u011funda ger\u00e7ekten kat\u0131l\u0131yor. Yan\u0131t s\u00fcresini e\u015fle\u015ftirmek iyi, ama bu kasasl\u0131 strateji de\u011fi\u015fikli\u011fi gerektirmiyor."
          }
        }
      },
      "3": {
        "type": "mission",
        "title": "Ayr\u0131m\u0131 Uygula",
        "instruction": "Ilgi d\u00fczeyi konusunda belirsiz oldu\u011fun bir konu\u015fma al. Ayr\u0131m\u0131 uygula: mevcut oldu\u011funda kat\u0131l\u0131m kalitesi y\u00fcksek mi yoksa d\u00fc\u015f\u00fck m\u00fc? Bu ger\u00e7ek sinyal.",
        "tips": {
          "0": "Mevcut oldu\u011fundaki kat\u0131l\u0131m kalitesi > kat\u0131l\u0131m s\u0131kl\u0131\u011f\u0131",
          "1": "Mevcut oldu\u011funda s\u0131cak + yava\u015f = m\u00fcmk\u00fcn z\u00f6r g\u00f6r\u00fcnmek ya da sadece yava\u015f yazar",
          "2": "Mevcut oldu\u011funda so\u011fuk + yava\u015f = d\u00fc\u015f\u00fck ilgi"
        }
      }
    }
  },
  "c5_l6": {
    "title": "Ne Zaman T\u0131rmanmal\u0131, Ne Zaman \u00c7ekilmeli",
    "duration": "5 dk",
    "steps": {
      "0": {
        "type": "concept",
        "heading": "Zamanlama hatalar\u0131 iyi konu\u015fmalar\u0131n bir yere gitme nedenidir.",
        "body": "Metin tabanl\u0131 \u00e7ekim g\u00fcb\u00fcnde en yayg\u0131n ba\u015far\u0131s\u0131zl\u0131k modu k\u00f6t\u00fc teknik de\u011fil \u2014 yanl\u0131\u015f zamanda iyi teknik. O hala karar verirken t\u0131rmanmak. \u0130t\u0131\u015f ol\u0131rken geri \u00e7ekilmek. \u00c7ok erken ya da konu\u015fmada \u00e7ok uzun kald\u0131ktan sonra randevuya davet etmek.\n\nKalibrasyonn onun mevcut durumunu do\u011fru okuma ve bunun yerine \u00f6nceden belirlenmi\u015f bir senaryo \u00e7al\u0131\u015ft\u0131rmak yerine buna yan\u0131t verme becerisidir. \u00d6\u011frenilebilir bir beceri. Do\u011fru \u015feylere bakarsaniz sinyaller neredeyse her zaman okunabilir.\n\nT\u0131rmanma uygun: kat\u0131l\u0131m kalitesi y\u00fcksek, ger\u00e7ek sorular geri geliyor, istenmeyen ayr\u0131nt\u0131 ekliyor, yan\u0131t s\u00fcresi h\u0131zl\u0131 ve tutarl\u0131, konu\u015fman\u0131n do\u011fal bir ileri momenti var.\n\nGeri \u00e7ekilme uygun: kat\u0131l\u0131m kalitesi d\u00fc\u015f\u00fcyor, konu\u015fma ger\u00e7ek al\u0131\u015fveri\u015f yerine bak\u0131m haline geliyor, tamamlay\u0131c\u0131 ama kapal\u0131 u\u00e7lu cevaplar veriyor, hi\u00e7bir ger\u00e7ek t\u0131rmanma olmadan uzun s\u00fcrel\u00fc temasta bulundunuz.",
        "examples": {
          "0": { "label": "T\u0131rmanma sinyalleri", "text": "H\u0131zl\u0131 yan\u0131tlar + uzun mesajlar + ger\u00e7ek geri sorular + ileri momentum. Randevuya davet et." },
          "1": { "label": "Geri \u00e7ekilme sinyalleri", "text": "Konu\u015fma duraksad\u0131 + k\u0131sa cevaplar + hi\u00e7bir \u015fey sormad\u0131. Geri \u00e7ekil, alan\u0131n i\u015f yapmas\u0131na izin ver." }
        }
      },
      "1": {
        "type": "do_dont",
        "context": "Konu\u015fma 3 g\u00fcnd\u00fcr harika gitti \u2014 iyi enerji, geri sorular, uzun mesajlar",
        "dont": "Dinami\u011fin iyi hissettirdi\u011fi i\u00e7in konu\u015fmay\u0131 s\u00fcrd\u00fcrmek",
        "do": "T\u0131rman. Randevuya davet et. Sinyaller bunu g\u00f6steriyor.",
        "why": "Iyi konu\u015fma enerjisi sonsuza kadar s\u00fcrmez \u2014 momenti var. Sinyal oradayken bir yere ta\u015f\u0131mazsan, duraksay\u0131p bozuluyor. Do\u011fru anda t\u0131rmanmak i\u00e7in do\u011fru an\u0131 okumak en y\u00fcksek de\u011ferli kalibrasyon becerilerinden."
      },
      "2": {
        "type": "quiz",
        "question": "Kat\u0131l\u0131mc\u0131, uzun yan\u0131tlar veriyordu \u2014 ama son \u00fc\u00e7\u00fc belirgin \u015fekilde k\u0131sa ve tamamlay\u0131c\u0131. Do\u011fru hamle?",
        "options": {
          "0": {
            "text": "Randevuya davet et \u2014 hala oradayken vur",
            "correct": False,
            "explanation": "Sinyal de\u011fi\u015fti. \u00dc\u00e7 ard\u0131\u015f\u0131k kat\u0131l\u0131m d\u00fc\u015f\u00fc\u015f\u00fc momentumun artt\u0131\u011f\u0131n\u0131 de\u011fil azald\u0131\u011f\u0131n\u0131 \u00f6neriyor. Azalan momentuma t\u0131rmanmak genellikle d\u00fc\u015f\u00fc\u015f\u00fc h\u0131zland\u0131r\u0131r."
          },
          "1": {
            "text": "Geri \u00e7ekil \u2014 biraz alan\u0131n i\u015f yapmas\u0131na izin ver, sonra yeniden kat\u0131l",
            "correct": True,
            "explanation": "Kat\u0131l\u0131m kalitesi d\u00fc\u015f\u00fcnce, s\u00fcrd\u00fcrmek ya da t\u0131rmanmak d\u00fczelmiyor. K\u0131sa bir geri \u00e7ekilme onun g\u00f6n\u00fcll\u00fc olarak yeniden kat\u0131lmas\u0131 i\u00e7in alan yarat\u0131yor \u2014 bu momentumu s\u0131f\u0131rl\u0131yor."
          },
          "2": {
            "text": "Yeniden kat\u0131lmak i\u00e7in daha ilgin\u00e7 bir mesaj g\u00f6nder",
            "correct": False,
            "explanation": "Kat\u0131l\u0131m d\u00fc\u015f\u00fcnce daha fazla \u00e7aba g\u00f6stermek klasik hata. D\u00fc\u015f\u00fc\u015f\u00fc fark etti\u011fini ve d\u00fczeltmeye \u00e7al\u0131\u015ft\u0131\u011f\u0131n\u0131 sinyaliyor \u2014 bu bol lukluk de\u011fil kayg\u0131 iletiyor."
          }
        }
      },
      "3": {
        "type": "mission",
        "title": "Odaya Oku \u2014 Bir Konu\u015fma",
        "instruction": "Aktif bir konu\u015fma se\u00e7. Son 10 mesaj\u0131 oku. Kat\u0131l\u0131m kalitesi y\u00fckseliyor mu, d\u00fcz m\u00fc, yoksa d\u00fc\u015f\u00fcyor mu? Bu okumaya g\u00f6re \u2014 do\u011fru hamle ne?",
        "tips": {
          "0": "Y\u00fckseliyor: bir yere ta\u015f\u0131. Randevuya davet et ya da konu\u015fmay\u0131 derinle\u015ftir.",
          "1": "D\u00fcz: yeni bir \u015fey tan\u0131t ya da geri \u00e7ekil.",
          "2": "D\u00fc\u015f\u00fcyor: geri \u00e7ekil. Alan\u0131n i\u015f yapmas\u0131na izin ver."
        }
      }
    }
  }
}

data['challenges']['lessons'].update(c5_lessons)

with open('i18n/tr.json', 'w', encoding='utf-8') as f:
    json.dump(data, f, ensure_ascii=False, indent=2)

print("Done! All c5 lessons added")
print("All keys:", list(data['challenges']['lessons'].keys()))

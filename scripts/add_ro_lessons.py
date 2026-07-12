#!/usr/bin/env python3
# -*- coding: utf-8 -*-
import json
import os

os.chdir('/Users/nihat/coupleai')

with open('i18n/ro.json', 'r', encoding='utf-8') as f:
    data = json.load(f)

lessons = {
  "c3_l1": {
    "title": "De ce esuează cele mai multe invitații la întâlnire",
    "duration": "4 min",
    "steps": {
      "0": {
        "heading": "Intențiile vagi nu sunt aproape niciodată puse în practică.",
        "body": "\"Ne-am putea vedea cândva\" eșuează \u2014 nu din lipsă de curaj \u2014 ci pentru că nu oferă nimănui nimic concret cu care să lucreze. Nici ție, nici ei.\n\nExistă un tipar bine documentat legat de modul în care oamenii dau curs intențiilor. Obiectivele vagi \u2014 \"ar trebui să merg la sală\" \u2014 au o rată foarte scăzută de urmărire. Scenariile concrete de tipul \"dacă-atunci\" \u2014 \"mă duc la sală marți dimineață înainte de muncă\" \u2014 au rate dramatic mai mari. Creierul are nevoie de un scenariu specific pe care să îl poată simula pentru a activa comportamentele de planificare și angajament.\n\nAcelași mecanism se aplică și când inviți pe cineva la o întâlnire. \"Ne-am putea vedea cândva\" nu creează un scenariu simulabil. Ea nu și-l poate imagina. Nici tu. Deci nu se întâmplă nimic \u2014 nu pentru că nu e interesată, ci pentru că nu există nicio imagine mentală la care să ancoreze un da.\n\nInvitația trebuie să fie suficient de specifică încât ea să poată vizualiza întâlnirea înainte să răspundă.",
        "examples": {
          "0": {"label": "Vagă (fără imagine mentală)", "text": "\"Ne-am putea vedea cândva.\""},
          "1": {"label": "Vagă (condiționată)", "text": "\"Ai vrea poate să luăm o cafea sau ceva, dacă ești liberă?\""},
          "2": {"label": "Specifică (ea o poate vizualiza)", "text": "\"E un loc bun de ramen lângă centru \u2014 joi? Îți povestesc restul din Tokyo.\""}
        }
      },
      "1": {
        "context": "Vorbiți de 3 zile, chimie bună",
        "dont": "\"Ar trebui să luăm ceva de băut! Sunt liber în weekend dacă ești și tu?\"",
        "do": "\"E un bar de vinuri cu lumină naturală grozavă lângă zona ta \u2014 vineri seara? Un mod ușor de a încheia săptămâna.\"",
        "why": "Varianta de evitat e condiționată de programul ei, nu oferă nicio imagine mentală și pune toată inițiativa pe ea.\n\nVarianta bună are un loc specific, un moment specific și un cadru pentru atmosferă. Ea și-l poate imagina. Ăsta e aproape tot ce îi trebuie pentru a lua decizia înainte să răspundă."
      },
      "2": {
        "question": "Care invitație are cele mai mari șanse să primească un da?",
        "options": {
          "0": {"text": "\"Ar trebui să ne vedem! Sunt liber în weekend dacă ești și tu?\"", "explanation": "Condiționată, fără viziune, fără scenariu specific. Ea trebuie să depună efortul mental de a-și imagina cum ar arăta asta."},
          "1": {"text": "\"E un bar cu terasă lângă centru \u2014 duminică după-amiază? Un mod ușor de a încheia săptămâna.\"", "explanation": "Loc specific, moment specific, un cadru pentru energie. Ea îl poate simula. Simularea este precursorul angajamentului."},
          "2": {"text": "\"Ai vrea să luăm o cafea cândva? Nicio presiune dacă nu.\"", "explanation": "\"Nicio presiune\" semnalează că te aștepți la refuz. Calificativul subminează invitația înainte ca ea să răspundă."}
        }
      },
      "3": {
        "title": "Scrie o Invitație Concretă",
        "instruction": "Scrie o invitație specifică pentru cineva cu care vorbești. Loc specific, moment specific, un motiv pentru care ea ar vrea să fie acolo.",
        "tips": {
          "0": "Specificul bate fantezia \u2014 un loc bun de tacos bate un vag \"restaurant frumos\"",
          "1": "Referă-te la ceva din conversația voastră, dacă poți",
          "2": "Citește-o înapoi: ea poate vizualiza întâlnirea? Dacă da, e gata."
        }
      }
    }
  },
  "c3_l2": {
    "title": "Formula în 3 Părți",
    "duration": "5 min",
    "steps": {
      "0": {
        "heading": "Limbajul concret și specific creează o imagine mentală. Limbajul abstract nu creează nimic.",
        "body": "Limbajul care produce imagini mentale e procesat diferit \u2014 și mai memorabil \u2014 decât limbajul abstract. \"Un bar cu terasă și priveliști frumoase\" activează procesarea vizuală. \"Un loc unde să ne vedem\" nu.\n\nAtunci când descrii un scenariu specific, ea îl simulează. Creierul ei rulează o versiune mentală rapidă a întâlnirii înainte să răspundă. Dacă acea simulare se simte bine \u2014 locul sună potrivit, momentul e convenabil, există un motiv pentru care e tocmai această dată \u2014 da-ul vine ușor.\n\nFormula are trei părți:\n\n[Loc specific] + [Moment specific] + [Un hook personal din conversația voastră]\n\nHook-ul personal e partea pe care cei mai mulți o sar. E ceea ce face ca această întâlnire să fie despre conversația voastră specifică \u2014 nu o cafea generică cu oricine. \"Îți povestesc restul din acea poveste\" sau \"Îmi poți spune dacă gustul meu muzical e chiar atât de prost\" \u2014 creează continuitate. Această întâlnire e o prelungire naturală a ceea ce se întâmplă deja.",
        "examples": {
          "0": {"label": "Folosind formula", "text": "\"E un loc bun de ramen lângă centru \u2014 joi seara? Îți povestesc restul din poveste de la călătorie.\""},
          "1": {"label": "Cu un hook de revenire", "text": "\"E un bar de vinuri cu lumină naturală grozavă lângă zona ta \u2014 duminică după-amiază? Îmi poți spune dacă gustul meu e chiar atât de prost.\""},
          "2": {"label": "Versiunea relaxată", "text": "\"Loc bun de cafea lângă [zonă] \u2014 sâmbătă dimineață? O oră.\""}
        }
      },
      "1": {
        "context": "V-ați tot glumit că sunteți competitivi",
        "dont": "\"Ar trebui să facem ceva competitiv cândva haha\"",
        "do": "\"E un loc de minigolf lângă centru care se ia mult prea în serios \u2014 sâmbătă? Să vedem dacă ești cu adevărat competitivă sau doar spui că ești.\"",
        "why": "Varianta de evitat e vagă și \"haha\" subminează invitația. Varianta bună folosește un loc specific, o zi specifică și se leagă direct de dinamica conversației voastre. Acel callback face ca întâlnirea să pară pasul natural următor, nu o propunere bruscă."
      },
      "2": {
        "question": "Care mesaj folosește cel mai bine formula în 3 părți?",
        "options": {
          "0": {"text": "\"Să luăm ceva de băut în weekend!\"", "explanation": "Niciun loc specific, nicio zi specifică. \"În weekend\" înseamnă 48 de ore de vagitate."},
          "1": {"text": "\"E un bar de cocktailuri pe [stradă] \u2014 vineri la 8? Vreau să aud restul poveștii despre sora ta.\"", "explanation": "Loc specific, moment specific, hook personal din conversația lor. Ea îl poate vizualiza. Callback-ul semnalează: e despre noi, nu orice întâlnire."},
          "2": {"text": "\"Vrei să facem ceva distractiv săptămâna asta? Sunt destul de flexibil.\"", "explanation": "\"Flexibil\" semnalează că vei face ce vrea ea. Asta elimină toată energia din invitație."}
        }
      },
      "3": {
        "title": "Construiește-ți Invitația",
        "instruction": "Pentru o conversație pe care o ai chiar acum, scrie invitația cu toate cele 3 părți: loc specific, moment specific, hook personal.",
        "tips": {
          "0": "Hook-ul poate fi mic \u2014 \"Îți datorez o cafea pentru acea recomandare\" funcționează",
          "1": "Ziua + o oră aproximativă (seara/după-amiază) e suficient \u2014 nu ai nevoie de ora exactă",
          "2": "Dacă nu ai un loc specific, caută unul lângă ea. 30 de secunde."
        }
      }
    }
  },
  "c3_l3": {
    "title": "Cum Gestionezi Refuzurile Blânde",
    "duration": "4 min",
    "steps": {
      "0": {
        "heading": "\"Sunt ocupată săptămâna asta\" nu e aproape niciodată despre tine.",
        "body": "Când cineva spune nu, creierul are un reflex rapid: să facă totul despre caracter. Nu e interesată. Nu îi place de tine. Explicația situațională \u2014 momentul, circumstanțele, viața care se întâmplă \u2014 e sărită în favoarea celei personale.\n\nAcesta e o eroare sistematică. Oamenii care atribuie fricțiunea unor factori situaționali, mai degrabă decât respingerii personale, o gestionează mai bine, persistă adecvat și au rezultate mai bune. Cei care atribuie totul caracterului fie cedează la primul obstacol, fie ignoră semnalele legitime pentru că au încetat să mai citească datele.\n\n\"Sunt ocupată săptămâna asta\" e un semnal situațional \u2014 momentul, nu interesul. \"De fapt, sunt într-o relație\" e un semnal dispozițional \u2014 nu e disponibilă, punct.\n\nȘtiind diferența îți determină următoarea mișcare. Un refuz situațional primește o singură redirecționare elegantă cu un alt moment. Atât. Nu trei redirecționări. Nu \"când ești liberă\" (care pune toată inițiativa pe ea). O singură alternativă specifică, oferită fără presiune.",
        "examples": {
          "0": {"label": "Situațional (redirecționează o dată)", "text": "\"Săptămâna asta sunt destul de ocupată, de fapt\""},
          "1": {"label": "Redirecționarea ta", "text": "\"Nicio problemă \u2014 săptămâna viitoare? Sunt disponibil marți sau joi.\""},
          "2": {"label": "Dispozițional (acceptă)", "text": "\"De fapt, sunt cu cineva\""}
        }
      },
      "1": {
        "context": "Ai invitat-o sâmbătă la cafea. Ea a spus \"s-ar putea să fiu ocupată în weekend, nu știu sigur.\"",
        "dont": "\"Oh nicio problemă!! Spune-mi când ești liberă, nu te grăbi 😊\"",
        "do": "\"Nicio problemă \u2014 săptămâna viitoare? Sunt disponibil marți seara sau joi.\"",
        "why": "Varianta de evitat pune toată inițiativa pe ea și semnalează că vei accepta orice fărâmă de timp îți oferă. Varianta bună menține cadrul \u2014 aceeași energie, alt moment \u2014 și îi oferă o alegere specifică. O singură redirecționare."
      },
      "2": {
        "question": "Ea spune \"săptămâna asta e nebunie dar sunt liberă weekendul viitor.\" Ce îi spui?",
        "options": {
          "0": {"text": "\"Super! Spune-mi când ți se potrivește 🙂\"", "explanation": "Tocmai ai renunțat la orice control asupra când se va întâmpla asta. S-ar putea să nu mai aducă niciodată subiectul."},
          "1": {"text": "\"Sâmbătă sau duminică? Pot oricare \u2014 spune-mi până joi ca să mă pot organiza.\"", "explanation": "A menținut cadrul. Alegere binară, termen limită ușor. Ușor pentru ea să se angajeze la una."},
          "2": {"text": "\"Bine, nicio grijă, mai încercăm cândva!\"", "explanation": "\"Cândva\" din nou. Înapoi la vag. Energia dispare complet."}
        }
      },
      "3": {
        "title": "Regula Unei Singure Redirecționări",
        "instruction": "Dacă cineva îți dă un refuz blând săptămâna asta, redirecționează o singură dată cu un moment alternativ specific. Dacă evită din nou \u2014 lasă-l baltă, complet, cu toată demnitatea.",
        "tips": {
          "0": "O redirecționare = încredere. Două redirecționări = alergat după cineva.",
          "1": "Redirecționarea ar trebui să se simtă mai ușoară decât invitația originală, nu mai grea",
          "2": "Dacă evită de două ori, nu e suficient de interesată în momentul ăsta. E în regulă."
        }
      }
    }
  },
  "c3_l4": {
    "title": "Regula Follow-Up-ului",
    "duration": "3 min",
    "steps": {
      "0": {
        "heading": "Oamenii sunt mai motivați de ce ar putea pierde decât de ce ar putea câștiga.",
        "body": "Perspectiva de a rata ceva la care ai deja acordul activează un tip diferit de urgență decât a ți se oferi ceva nou. Pierderea se simte mai imediată decât un câștig echivalent \u2014 de aproximativ două ori mai intensă. Asta modelează decizii în moduri pe care oamenii nu le conștientizează adesea.\n\nO verificare logistică cu 24 de ore înainte de o întâlnire confirmată funcționează pe asta. Ea a acceptat deja. Întâlnirea e reală în mintea ei. Un mesaj scurt, logistic \u2014 nu anxios, ci organizatoric \u2014 îi amintește că se întâmplă. Asta e diferit de a alerga după cineva.\n\nCe nu faci: nu trimiți un mesaj entuziast \"mai suntem pe fir?? 😊\" în dimineața respectivă. Asta semnalează că te-ai gândit la asta toată săptămâna și ai nevoie de reasigurare. Ce faci: o singură verificare logistică, cu 24 de ore înainte, sub 15 cuvinte. Dacă ea nu confirmă până atunci \u2014 a anulat fără să o spună. Mergi mai departe. Complet.",
        "examples": {
          "0": {"label": "Verificarea", "text": "\"Mai suntem pe fir pentru mâine? Fac rezervarea pentru 7:30 dacă nu aud altceva.\""},
          "1": {"label": "Ce nu trimiți", "text": "\"Hei!! Mâine e bine?? Sunt atât de nerăbdător 😊🙏\""},
          "2": {"label": "Dacă ea nu confirmă", "text": "Aveai planuri. Ai făcut altceva. Ești complet ok."}
        }
      },
      "1": {
        "context": "Ea a acceptat cina de sâmbătă acum 4 zile. E vineri după-amiază.",
        "dont": "\"Hei!! Mâine e bine?? Sunt atât de nerăbdător 😊🙏\"",
        "do": "\"Mai suntem pe fir pentru mâine? Fac rezervarea pentru 7:30 dacă nu aud altceva.\"",
        "why": "Varianta de evitat e vizibil anxioasă \u2014 performezi entuziasmul la o simplă verificare logistică. Varianta bună e organizatorică și asumptivă. \"Dacă nu aud altceva\" implică că mergi înainte indiferent, ceea ce semnalează că ai alte lucruri de făcut."
      },
      "2": {
        "question": "Ea a acceptat cina de marți. E luni la prânz și nu a confirmat. Ce trimiți?",
        "options": {
          "0": {"text": "\"Hei, mai suntem pe fir pentru mâine? Spune-mi! 😊\"", "explanation": "\"Spune-mi\" îi dă toată puterea ei. Emoji-ul e punctuație anxioasă."},
          "1": {"text": "\"Fac rezervare pentru ora 19:00 dacă nu îmi spui altfel.\"", "explanation": "Logistic, încrezător. Mergi înainte. Ea doar trebuie să confirme sau să redirecționeze."},
          "2": {"text": "Nimic \u2014 dacă e interesată va confirma singură", "explanation": "Pasiv. S-ar putea să nu-și amintească că ați stabilit o oră. O singură verificare logistică nu înseamnă să alergi după cineva."}
        }
      },
      "3": {
        "title": "Verificarea Logistică",
        "instruction": "Data viitoare când ai o întâlnire confirmată, trimite o singură verificare exact cu 24 de ore înainte. Sub 15 cuvinte. Exclusiv logistică. Nimic emoțional.",
        "tips": {
          "0": "Oră + loc + confirmare. Atât.",
          "1": "Niciun \"sunt atât de nerăbdător\" \u2014 asta transferă anxietate, nu energie",
          "2": "Dacă ea tace după verificarea ta: a anulat fără să o spună. Respectă-te suficient cât să mergi mai departe."
        }
      }
    }
  },
  "c4_l1": {
    "title": "Vulnerabilitate Calibrată",
    "duration": "5 min",
    "steps": {
      "0": {
        "heading": "Apropierea crește prin dezvăluire reciprocă \u2014 nu prin dezvăluire rapidă.",
        "body": "Intimitatea nu se construiește cu timpul. Se construiește prin profunzime \u2014 mai precis, prin dezvăluire care se potrivește atât ca profunzime, cât și ca direcție. Când o persoană împărtășește ceva real, cealaltă împărtășește ceva real la aproximativ aceeași greutate emoțională. Când schimbul e reciproc, apropierea se acumulează. Când nu e \u2014 când cineva merge mai adânc decât celălalt, sau mai adânc decât situația o cere \u2014 celălalt se retrage.\n\nDe aceea a împărtăși prea mult prea repede nu creează conexiune \u2014 creează disconfort. Persoana care ascultă nu s-a înscris la acea profunzime. Asta semnalează conștiință socială scăzută. Se simt obligați, nu atrași.\n\nVulnerabilitatea calibrată înseamnă: potrivește-te cu adâncimea ei. Dacă ea admite o mică imperfecțiune specifică \u2014 gătit prost, nu poate parca în marșarier, plânge la reclame \u2014 împărtășești una la aceeași greutate emoțională. Nu mai mult. Nu o performanță de deschidere. Pur și simplu: iată un lucru real, la același nivel la care mi-ai dat tu.",
        "examples": {
          "0": {"label": "Prea adânc, prea repede (evită)", "text": "\"Sincer îmi e destul de greu cu oameni noi. Sunt un tip care se gândește prea mult și a fost o perioadă dificilă.\""},
          "1": {"label": "Potrivit (fă asta)", "text": "\"La fel. Am ars apa, serios. Nu sunt mândru.\""}
        }
      },
      "1": {
        "context": "Ea admite că e îngrozitoare la gătit",
        "dont": "\"Sincer la fel, sunt un dezastru în bucătărie, și sincer și în viață în general în ultima vreme \u2014 câteva luni ciudate\"",
        "do": "\"La fel. Am ars apa, serios. Nu sunt mândru.\"",
        "why": "Ea a împărtășit o mică ciudățenie specifică. Varianta de evitat o folosește ca ușă pentru profunzime emoțională nepotrivită \u2014 asta nu e reciprocitate, e descărcare. Varianta bună se potrivește exact cu greutatea ei: specifică, ușor autoironică, completă."
      },
      "2": {
        "question": "Ea spune \"sunt ciudat de anxioasă în privința mâncărurilor noi.\" Cel mai bun răspuns potrivit?",
        "options": {
          "0": {"text": "\"Total înțeleg, și eu am dificultăți cu anxietatea în general, sincer\"", "explanation": "Ea a împărtășit o mică ciudățenie specifică. Tu ai escaladat la anxietate generală. E mai profund și mai larg decât ce a oferit ea. Creează disconfort."},
          "1": {"text": "\"La fel \u2014 am o listă de mâncăruri pe care refuz să le încerc și de care nu sunt mândru.\"", "explanation": "Profunzime potrivită. Specifică, ușor conștientă de sine, completă. Aceeași greutate emoțională. Ea se simte înțeleasă fără să se simtă responsabilă pentru tine."},
          "2": {"text": "\"E atât de relatable! Ador asta la tine.\"", "explanation": "Compliment, nu reciprocitate. Nu ai împărtășit nimic. Schimbul e dezechilibrat."}
        }
      },
      "3": {
        "title": "Găsește-ți Dezvăluirea Calibrată",
        "instruction": "Identifică un lucru mic, specific, neamenințător la care ești sincer prost. Exersează să îl spui în 1\u20132 propoziții \u2014 fără scuze, fără elaborare.",
        "tips": {
          "0": "Specificul bate vagul: \"sunt îngrozitor la parcat în marșarier\" > \"sunt cam un dezastru\"",
          "1": "Trebuie să fie real \u2014 vulnerabilitatea performată se citește imediat",
          "2": "Scopul e să pari uman, nu distrus"
        }
      }
    }
  },
  "c4_l2": {
    "title": "Retragerea",
    "duration": "4 min",
    "steps": {
      "0": {
        "heading": "Când ceva pare că s-ar putea să nu fie disponibil, oamenii îl doresc mai mult.",
        "body": "Există un tipar consistent în modul în care oamenii răspund la libertatea amenințată sau restricționată: vor mai mult lucrul restricționat, nu mai puțin. De aceea \"timp limitat\" creează urgență. De aceea \"nu poți avea asta\" îi face pe oameni să urmărească. Restricția în sine e semnalul.\n\nÎn atracție, disponibilitatea implicită funcționează la fel. Când cineva pare consistent și necondiționat interesat \u2014 mereu acolo, mereu cald, mereu disponibil \u2014 nu mai există nimic de dorit mai mult. Oferta e nelimitată. Urgența dispare.\n\nRetragerea disponibilității implicite \u2014 sugerând că ești mai puțin interesat decât credea ea, sau că atenția ta nu e necondiționată \u2014 activează dinamica direct. Nu prefăcându-te că nu ești interesat. Făcând interesul tău condiționat de ceva real.\n\n\"Eram pe cale să îți scriu mai devreme, dar sincer nu știam dacă această conversație merge undeva\" nu e o minciună dacă e adevărat. Semnalează: nu sunt automat disponibil. Trebuie să meriți asta.",
        "examples": {
          "0": {"label": "Cadrul", "text": "\"Eram pe cale să îți scriu, dar nu știam dacă asta merge undeva.\""},
          "1": {"label": "Interes condiționat", "text": "\"Ești mai interesantă decât mă așteptam. E fie bine, fie periculos.\""},
          "2": {"label": "Mize ridicate", "text": "\"Nu fac asta des. Tu meriți până acum.\""}
        }
      },
      "1": {
        "context": "Conversația merge bine de câteva zile",
        "dont": "Să fii mereu imediat disponibil, mereu cald, fără a introduce nicio incertitudine",
        "do": "\"Aproape că nu ți-am mai scris ieri. Încă mă gândesc dacă a fost o greșeală.\"",
        "why": "Disponibilitatea consistentă și necondiționată semnalează ofertă nelimitată. Retragerea introduce o raritate ușoară \u2014 nu indiferență, ci condiționalitate. Nivelul ei de interes e evaluat, nu asumat."
      },
      "2": {
        "question": "Ea spune \"de ce ai întârziat atât cu răspunsul?\" Cel mai bun răspuns?",
        "options": {
          "0": {"text": "\"Scuze! Eram ocupat 😅\"", "explanation": "A-ți cere scuze că ai o viață semnalează că te simți dator cu atenția ta. Dinamica se inversează imediat."},
          "1": {"text": "\"Mă gândeam dacă merită să continui conversația. Verdictul e încă în aer.\"", "explanation": "Jucăuș, dar semnalează: atenția ta e condiționată. Ea trebuie să fie suficient de interesantă pentru a o menține. Ăsta e un cadru complet diferit."},
          "2": {"text": "\"Nu sunt mereu pe telefon 🤷\"", "explanation": "Mai bine decât să îți ceri scuze, dar plat. Neutrul nu creează tensiune. Retragerea creează tensiune."}
        }
      },
      "3": {
        "title": "Lasă un Mesaj să Aștepte",
        "instruction": "Data viitoare când ai o deschidere clară de a răspunde, las-o să aștepte 2 ore. Când răspunzi, spune ceva care implică că atenția ta e condiționată, nu automată.",
        "tips": {
          "0": "Nu explica întârzierea \u2014 asta o face ciudată",
          "1": "Implicarea condiționalității trebuie să fie în conținut, nu în meta",
          "2": "Test: sună ca și cum ai alte lucruri de făcut? Dacă da, bine."
        }
      }
    }
  },
  "c4_l3": {
    "title": "Controlul Cadrului",
    "duration": "5 min",
    "steps": {
      "0": {
        "heading": "Oamenii nu experimentează realitatea. Experimentează interpretarea lor despre ea.",
        "body": "Același eveniment poate însemna lucruri opuse în funcție de cum e cadrat. Un compliment se simte sincer sau lingușitor în funcție de cadrul din jurul lui. Tachinarea se simte jucăușă sau crudă în funcție de cadru. Conținutul nu e cel care creează sensul \u2014 cadrul e.\n\nÎn conversație, cineva stabilește mereu cadrul. Fie tu, fie adopți cadrul celui care l-a stabilit primul. Persoana care numește dinamica controlează modul în care amândoi trăiesc interacțiunea. Dacă definești conversația ca o competiție jucăușă, asta devine. Dacă ea o definește ca urmărire unilaterală, asta devine \u2014 dacă nu reîncadrezi.\n\nControlul cadrului nu înseamnă a fi dominant. Înseamnă a nu ceda interpretarea celui care a vorbit primul. Când ea face o mișcare \u2014 un test, o provocare, un cadru \u2014 nu trebuie să joci în interiorul lui. Poți pur și simplu răspunde dintr-un cadru diferit.\n\nScopul e un cadru în care amândoi sunteți oameni interesanți care se descoperă reciproc \u2014 nu urmărire unilaterală, nu indiferență.",
        "examples": {
          "0": {"label": "Ea spune: \"Ești un fel de seducător\"", "text": "În cadrul ei: acuzație. Cadrul tău: \"Doar cu cei care fac asta interesant.\" \u2014 reîncadrează ca un compliment despre ea."},
          "1": {"label": "Ea spune: \"Încerci doar să mă impresionezi\"", "text": "În cadrul ei: provocare. Cadrul tău: \"Mă gândesc dacă meriți să fiu impresionat.\" \u2014 inversează evaluarea."}
        }
      },
      "1": {
        "context": "Ea spune: \"Pari genul care vorbește cu multe fete\"",
        "dont": "\"Nu, nu vorbesc! Sunt de fapt foarte selectiv 😅\"",
        "do": "\"Vorbesc cu oameni interesanți. Ăsta e un lucru diferit.\"",
        "why": "Varianta de evitat se joacă în cadrul ei \u2014 te aperi de o acuzație. Varianta bună reîncadrează întreaga premisă: categoria nu e volumul, e calitatea. Acum tu o evaluezi pe ea, nu invers."
      },
      "2": {
        "question": "Ea spune \"Nu sunt sigură că te cred.\" Cel mai bun răspuns pentru controlul cadrului?",
        "options": {
          "0": {"text": "\"Jur că sunt sincer! De ce aș minți?\"", "explanation": "Defensiv. Ești în cadrul ei \u2014 te dovedești față de cineva care nu a câștigat dreptul să te evalueze."},
          "1": {"text": "\"Bine. O să îți dai seama.\"", "explanation": "Neutru și calm. Nu ești amenințat de scepticismul ei. Calmul acela e reîncadrarea \u2014 adevărul tău nu depinde de faptul că ea îl crede acum."},
          "2": {"text": "\"Ok, ce ar trebui să fac ca să mă crezi?\"", "explanation": "Îi ceri să stabilească termenii credibilității tale. Acum ea are autoritate explicită asupra cadrului tău."}
        }
      },
      "3": {
        "title": "Numește Dinamica",
        "instruction": "În conversația ta următoare, observă când ea stabilește un cadru. În loc să joci în interior, răspunde dintr-un cadru diferit. Nu argumenta cadrul \u2014 pur și simplu nu intra în el.",
        "tips": {
          "0": "Calmul e cea mai puternică schimbare de cadru \u2014 implică că nu ești amenințat",
          "1": "Nu trebuie să câștigi. Trebuie doar să nu pierzi cadrul.",
          "2": "Dacă ea stabilește un cadru și tu răspunzi defensiv, cadrul e al ei."
        }
      }
    }
  },
  "c4_l4": {
    "title": "Trecerea Testelor Ei",
    "duration": "4 min",
    "steps": {
      "0": {
        "heading": "Oamenii testează ca să afle dacă ce văd e real.",
        "body": "Comportamentul de testare nu e răutate. E rațional. În atracția timpurie, oamenii prezintă cea mai bună versiune a lor. Testarea \u2014 scepticismul, rezistența, micile provocări \u2014 verifică dacă calitățile afișate sunt reale sau performate.\n\nÎntrebarea pe care ea o pune de fapt printr-un test este: această persoană chiar are calitățile pe care pare să le aibă, sau vor ceda când apăs? Răspunsul nu e dat de ce spui, ci de dacă comportamentul tău rămâne consistent.\n\nCei mai mulți bărbați eșuează fie cedând (brusc de acord, brusc scuzători), fie supracompensând (brusc defensivi sau reci). Mișcarea corectă e să rămâi congruent \u2014 să răspunzi la test din același cadru în care erai deja. Nu performând duritate. Nu încercând să treci testul. Pur și simplu: fiind aceeași persoană care erai cu două mesaje în urmă.\n\nConsistența sub presiune e cel mai atractiv semnal pe termen lung pentru că e singurul care prezice cu adevărat securitatea. Nu încrederea. Securitatea.",
        "examples": {
          "0": {"label": "Test: \"Ești probabil la fel cu toți\"", "text": "Ratare: \"Nu, nu sunt! Sunt de fapt foarte selectiv\" \u2014 îi confirmă punctul. Trecere: \"Sunt consistent eu însumi, da.\" \u2014 rămâne congruent, o neutralizează."},
          "1": {"label": "Test: \"Nu cred că avem prea multe în comun\"", "text": "Ratare: \"Ba da avem! Amândoi ne place [ceva]!\" \u2014 disperare defensivă. Trecere: \"Poate. Încă îmi dau seama de asta.\" \u2014 calm, menține cadrul deschis."}
        }
      },
      "1": {
        "context": "Ea spune: \"Probabil le spui asta tuturor\"",
        "dont": "\"Nu, nu! Ești cu adevărat diferită de alte fete 😭\"",
        "do": "\"Spun lucruri pe care le gândesc. Dacă le crezi sau nu e alegerea ta.\"",
        "why": "Varianta de evitat e defensivă și îi confirmă punctul \u2014 a obținut o reacție. Varianta bună e calmă și congruentă. Nu ești amenințat de scepticismul ei. Calmul acela e dovada pe care o căuta."
      },
      "2": {
        "question": "Ea spune \"Simt că ești prea șlefuit ca să fie real.\" Cel mai bun răspuns?",
        "options": {
          "0": {"text": "\"Ce?? Sunt de fapt destul de stângaci în mod normal, promit 😂\"", "explanation": "Te zorești să pari mai puțin amenințător. Ea acum știe că a ajuns la tine."},
          "1": {"text": "\"Real și șlefuit nu sunt opuse. Știu pur și simplu ce gândesc.\"", "explanation": "Calm, congruent, nu acceptă cadrarea ei. Ești în continuare aceeași persoană care erai înainte să o spună."},
          "2": {"text": "\"Bine atunci nu mă mai obosesc 🙂\"", "explanation": "Supracompensare spre rece. Pedepsirea ei pentru testare e propriul mod de a rata."}
        }
      },
      "3": {
        "title": "Observă Testul",
        "instruction": "Data viitoare când cineva respinge cu scepticism, pauză înainte de a răspunde. Întreabă-te: urmează să mă apăr? Dacă da, găsește versiunea mai calmă a aceluiași mesaj.",
        "tips": {
          "0": "Scopul nu e să câștige testul. E să nu reacționezi la el.",
          "1": "Calmul e dovada pe care o căuta.",
          "2": "Dacă te simți defensiv, e un dat util despre unde propria ta certitudine e subțire"
        }
      }
    }
  },
  "c4_l5": {
    "title": "Crearea Glumelor Interne",
    "duration": "3 min",
    "steps": {
      "0": {
        "heading": "Râsul comun creează apropiere \u2014 la fel ca contactul fizic.",
        "body": "Râsul face ceva specific în creier: declanșează o eliberare de endorfine care produce un sentiment real de apropiere și căldură față de cel cu care râzi. Nu apropiere metaforică \u2014 același traseu neuroquimic pe care îl activează contactul fizic comun.\n\nUmorul comun merge mai departe. O glumă internă creează un grup intern: există un \"noi\" care înțelege acel lucru, iar toți ceilalți nu. Acea formare de grup intern \u2014 chiar una mică și nouă \u2014 e unul dintre cele mai rapide moduri de a crea o apropiere la nivel de identitate. Încetezi să mai fii doi străini într-o conversație și devii doi oameni care au ceva al lor.\n\nNu creezi glume interne încercând să fii amuzant. Le creezi observând când se întâmplă ceva ciudat în conversație și numindu-l \u2014 aplecându-te spre el în loc să treci mai departe. Gluma nu e punch line-ul. E callback-ul, mai târziu, când faci referire la el din nou.",
        "examples": {
          "0": {"label": "Crearea ei", "text": "Ea face o greșeală de autocorrect \u2192 \"Rețin asta. Asta e chestia ta acum.\""},
          "1": {"label": "Callback-ul (mai târziu)", "text": "\"Tot mă gândesc la [chestia ciudată de mai devreme].\""},
          "2": {"label": "Semnalul că a funcționat", "text": "Ea o menționează prima. E în glumă acum."}
        }
      },
      "1": {
        "context": "Ea spune accidental ceva care iese ciudat",
        "dont": "Trecând peste asta elegant, menținând conversația profesională",
        "do": "\"Ok, asta merge pe lista lucrurilor pe care nu m-am așteptat să le citesc azi.\"",
        "why": "A trece peste ratează momentul. A te apleca spre el \u2014 numindu-l, făcând din el un moment \u2014 creează ceva la care poți reveni. Gluma internă e callback-ul mai târziu."
      },
      "2": {
        "question": "Ea a făcut o greșeală de tastare care a fost accidental hilară. Ai semnalat-o și ea a râs. Ce faci 20 de mesaje mai târziu?",
        "options": {
          "0": {"text": "Nimic \u2014 momentul a trecut", "explanation": "Callback-ul e tot punctul. Grupul intern se construiește când faci referire la el din nou \u2014 arată că urmărești conversația, nu doar răspunzi."},
          "1": {"text": "\"Tot mă gândesc la [greșeala de tastare]. Nu e ok.\"", "explanation": "Callback-ul creează gluma internă. Acum ai stabilit un \"noi\" în jurul unui lucru specific. Ea nu a avut asta cu nimeni altcineva azi."},
          "2": {"text": "Fac altă glumă despre altceva", "explanation": "Glumele noi sunt bine, dar nu se bazează pe ce există deja. Efectul compus al revenirii la același lucru e cel care creează gluma internă."}
        }
      },
      "3": {
        "title": "Găsește Ceva de Numit",
        "instruction": "În conversația ta următoare, caută un moment ciudat \u2014 o greșeală de tastare, o opinie neașteptată, ceva care nu se potrivește. Numește-l. Revino la el mai târziu.",
        "tips": {
          "0": "Nu încerci să fii comediant. Doar observi lucruri.",
          "1": "Callback-ul e mai important decât numirea inițială",
          "2": "Dacă ea îl menționează prima \u2014 a funcționat."
        }
      }
    }
  },
  "c4_l6": {
    "title": "Imersiunea Profundă",
    "duration": "6 min",
    "steps": {
      "0": {
        "heading": "Intimitatea nu se construiește cu timpul. Se construiește mergând undeva real împreună.",
        "body": "Există un studiu celebru în care perechi de străini primeau întrebări din ce în ce mai personale \u2014 escaladând de la ușoare la cu adevărat vulnerabile. La final, mulți descriau că se simțeau mai apropiați de cineva pe care tocmai îl întâlniseră decât de oameni pe care îi știau de ani de zile.\n\nConcluzia e simplă, dar contraintuitivă: intimitatea e o funcție a profunzimii și reciprocității, nu a duratei. Poți simți că ești cu adevărat aproape de cineva după două ore de conversație reală. Poți cunoaște pe cineva de cinci ani și tot să fii la suprafață.\n\nFormula: întreabă ceva real. Răspunde tu însuți când ea întreabă înapoi. Mergi cu un nivel mai adânc decât confortabil. Lasă-o să te întâlnească acolo.\n\nAsta nu înseamnă a o interoga cu întrebări vulnerabile. Înseamnă să urmezi firul natural al unei conversații dincolo de punctul în care cei mai mulți oameni schimbă subiectul \u2014 dincolo de răspunsul sigur spre cel real.",
        "examples": {
          "0": {"label": "Suprafață \u2192 real", "text": "\"Ce faci?\" \u2192 \"Ce te-a determinat să alegi asta?\" \u2192 \"A fost planul sau ai ajuns acolo?\""},
          "1": {"label": "Firul", "text": "Când ea spune ceva interesant \u2014 urmărește-l de fapt. Nu redirecționa spre un subiect nou. Rămâi în el."},
          "2": {"label": "Întâlnind-o acolo", "text": "Când ea merge undeva real, potrivește-te. Nu te retrage la glume."}
        }
      },
      "1": {
        "context": "Ea menționează că și-a schimbat cariera la sfârșitul anilor 20",
        "dont": "\"Oh interesant, la ce ai trecut?\"",
        "do": "\"Care a fost momentul când ai decis? Cei mai mulți se gândesc la asta ani de zile înainte să o facă.\"",
        "why": "Varianta de evitat o tratează ca pe o tranzacție de informații. Varianta bună merge la partea umană a deciziei \u2014 momentul, frica, ce a costat. Acolo e conversația reală."
      },
      "2": {
        "question": "Ea spune că s-a mutat singură în acest oraș acum doi ani și a fost \"mult de tot.\" Cel mai bun răspuns?",
        "options": {
          "0": {"text": "\"E curajos! Îți place acum?\"", "explanation": "Validare rapidă apoi redirecționare. Ai sărit peste lucrul real pe care tocmai l-a spus."},
          "1": {"text": "\"Ce era 'mult de tot'? Singurătatea, sau noutatea efectivă, sau altceva?\"", "explanation": "Ai auzit-o și ai mers spre asta, nu dincolo. Întrebi cum a fost de fapt \u2014 ea trebuie să meargă undeva real pentru a răspunde."},
          "2": {"text": "\"Și eu m-am mutat odată, e o mare adaptare!\"", "explanation": "Te-ai redirecționat spre tine înainte să termine ce spunea de fapt."}
        }
      },
      "3": {
        "title": "Urmărește Firul",
        "instruction": "În conversația ta următoare, când ea spune ceva care are ceva real dedesubt \u2014 nu redirecționa spre un subiect nou. Urmărește-l. Întreabă cum a fost de fapt.",
        "tips": {
          "0": "\"Cum a fost asta?\" e una dintre cele mai subutilizate întrebări în conversație",
          "1": "Dacă ea merge undeva real, nu te retrage la o glumă",
          "2": "Disponibilitatea ta de a rămâne în partea reală e ceea ce face să fie sigur pentru ea să fie în ea"
        }
      }
    }
  },
  "c4_l7": {
    "title": "Complimentul care Ajunge",
    "duration": "4 min",
    "steps": {
      "0": {
        "heading": "Lauda specifică implică că ai fost cu adevărat atent. Lauda generică implică că nu ai fost.",
        "body": "Complimentele generice declanșează scepticismul în loc de căldură. Când ceva ar putea fi spus oricui, creierul înregistrează: această persoană nu a trebuit să fie atentă pentru a spune asta. Ceea ce înseamnă că probabil nu a fost.\n\nLauda specifică semnalează opusul. Un compliment care face referire la ceva ce ea a făcut, ales sau rezolvat necesită să o fi observat de fapt. Specificitatea e dovada. Și dovada e ceea ce face lauda credibilă în loc de performativă.\n\nAsta se aplică dincolo de aspect. Un compliment despre cum arată e procesat diferit \u2014 și mai sceptic \u2014 decât un compliment despre ceva specific pe care l-a spus, o alegere pe care a făcut-o sau ceva ce a gestionat bine. Complimentele bazate pe aspect sunt cel mai ieftin semnal posibil. Nu necesită nicio observație.\n\nComplimentul care ajunge e cel pe care ea nu l-a anticipat. Ceva ce ai observat și despre care ea probabil nu s-a gândit că cineva ar observa.",
        "examples": {
          "0": {"label": "Generic (ignorat)", "text": "\"Ești atât de frumoasă.\" \u2014 Ea a auzit asta. Nu necesită nicio observație."},
          "1": {"label": "Specific (ajunge)", "text": "\"Modul în care ai explicat asta \u2014 ai făcut ceva complicat să pară complet evident. E o abilitate reală.\""},
          "2": {"label": "Neașteptat (rămâne)", "text": "\"Ești cu adevărat bună la a pune întrebări care duc undeva. Cei mai mulți nu fac asta.\""}
        }
      },
      "1": {
        "context": "Ea a gestionat o situație dificilă pe care a descris-o în conversație",
        "dont": "\"Ești atât de puternică și minunată că ai trecut prin asta ❤️\"",
        "do": "\"Faptul că nu ai făcut-o problema altcuiva \u2014 asta e de fapt neobișnuit.\"",
        "why": "Varianta de evitat e laudă generică pe care ar putea-o da oricine. Varianta bună numește ceva specific ce a făcut \u2014 o alegere, un comportament \u2014 care a necesitat să o asculți de fapt. Specificitatea e toată diferența."
      },
      "2": {
        "question": "Ea tocmai a descris un proiect complex pe care l-a finalizat. Care compliment ajunge cel mai bine?",
        "options": {
          "0": {"text": "\"Ești atât de deșteaptă și talentată!\"", "explanation": "Ar putea fi spus oricui. Nu necesită nicio observație. Ea îl va ignora înainte să termini propoziția."},
          "1": {"text": "\"Faptul că ai ținut [partea specifică pe care a menționat-o] laolaltă în timp ce totul se mișca \u2014 asta nu e ușor. Cei mai mulți ar fi lăsat mingea să cadă.\"", "explanation": "Face referire la ceva specific din ce a descris de fapt. Arată că ai ascultat. Observația e dovada."},
          "2": {"text": "\"Sună foarte greu, trebuie să fii mândră de tine!\"", "explanation": "Validare generică. Caldă, dar nu specifică. Ea nu poate spune dacă ai auzit de fapt ce a spus."}
        }
      },
      "3": {
        "title": "Un Compliment de Observație",
        "instruction": "În conversația ta următoare, găsește un lucru specific pe care ea l-a făcut sau spus pe care l-ai observat cu adevărat. Complimentează asta \u2014 nu aspectul ei, nu ea în general. Lucrul specific.",
        "tips": {
          "0": "Cele mai bune complimente fac referire la ceva ce ea probabil nu s-a gândit că cineva ar observa",
          "1": "Comportamentul și caracterul > aspectul fizic",
          "2": "Dacă ai putea-o spune oricui, nu e cel potrivit"
        }
      }
    }
  },
  "c4_l8": {
    "title": "A Conduce Fără a Controla",
    "duration": "5 min",
    "steps": {
      "0": {
        "heading": "Autonomia \u2014 sentimentul că alegerile tale sunt ale tale \u2014 e o nevoie umană non-negociabilă.",
        "body": "Oamenii sunt mai implicați, mai angajați și mai atrași de parteneri care le extind sentimentul de libertate mai degrabă decât să îl limiteze. Aceasta nu e o preferință \u2014 e fundamentală. Când alegerile se simt ca alegeri autentice, oamenii investesc în ele. Când alegerile se simt dictate sau maneuvrate, oamenii rezistă.\n\nAceasta e diferența dintre a conduce și a controla. A conduce oferă direcție cu deschidere autentică față de alte rezultate. \"Iată o idee \u2014 bar cu terasă sâmbătă. Dar sunt deschis dacă e ceva mai bun\" e o conducere. \"Mergem la barul cu terasă sâmbătă\" e control.\n\nDistincția contează în practică: conducerea creează bunăvoință, controlul creează fricțiune. Cea mai atractivă versiune a hotărârii e: am o idee clară, am ales-o pentru că m-am gândit la ce ți-ar plăcea, și sunt deschis dacă tu o vezi diferit. E hotărâre ȘI suport pentru autonomie. Ambele deodată.\n\nScopul e să fii persoana care face planuri \u2014 nu persoana care o face să se simtă gestionată.",
        "examples": {
          "0": {"label": "Controlând (fricțiune)", "text": "\"Ar trebui să mergem la [loc]. O să îți placă.\" \u2014 Niciun spațiu, niciun input, presupune preferințele ei."},
          "1": {"label": "Conducând (bunăvoință)", "text": "\"E un loc pe care cred că ți-ar plăcea de fapt bazat pe ce ai spus despre [lucru]. Vrei să încercăm, sau ai mai fost?\" \u2014 are direcție ȘI deschide input."}
        }
      },
      "1": {
        "context": "Planificarea primei întâlniri",
        "dont": "\"Mergem la [restaurant] la ora 19:00 vineri.\" \u2014 declarat ca un fapt, fără input",
        "do": "\"E un [tip de loc] bun lângă tine pe care cred că se potrivește \u2014 vineri seara? Dacă ai mai fost sau e ceva mai bun, sunt deschis.\"",
        "why": "Varianta de evitat îi elimină complet agenția. Varianta bună face un plan clar ȘI invită input. Ea se simte atât ținută cât și liberă. Combinația asta e ceea ce face conducerea atractivă."
      },
      "2": {
        "question": "Ea spune \"Nu știu, ce vrei tu să facem?\" Cel mai bun răspuns?",
        "options": {
          "0": {"text": "\"Orice vrei! Sunt ok cu orice 😊\"", "explanation": "Abdicare completă de la conducere. Ea a cerut direcție. \"Orice vrei\" e opusul."},
          "1": {"text": "\"E un loc pe care voiam să îl încerc \u2014 [descriere specifică]. Ți se pare potrivit?\"", "explanation": "Ia o decizie clară cu o idee specifică. Invită răspunsul ei fără a renunța la conducere."},
          "2": {"text": "\"Tu decizi, cunoști mai bine zona.\"", "explanation": "Redirecționează decizia înapoi la ea. Ea te-a întrebat pe tine. A i-o întoarce citește ca indecis, nu modest."}
        }
      },
      "3": {
        "title": "Fă un Plan care Invită Input",
        "instruction": "Data viitoare când planifici ceva, propune ceva specific \u2014 apoi lasă cu adevărat loc pentru inputul ei. Nu ca o formalitate. Chiar gândești asta.",
        "tips": {
          "0": "Conducerea e în a avea o idee. Deschiderea e în a nu cere acordul.",
          "1": "Dacă ea are o sugestie mai bună, accept-o \u2014 asta e tot conducere",
          "2": "Indecisia citește ca interes scăzut. Decizia cu deschidere citește ca încredere."
        }
      }
    }
  },
  "c4_l9": {
    "title": "Jocul Lung",
    "duration": "5 min",
    "steps": {
      "0": {
        "heading": "Familiaritatea produce plăcere \u2014 chiar fără conștiință.",
        "body": "Există un efect consistent în modul în care oamenii evaluează lucruri pe care le-au mai întâlnit: expunerea repetată crește evaluarea pozitivă, independent de orice amintire conștientă a întâlnirii. Oamenii evaluează fețele, obiectele și cuvintele mai pozitiv pur și simplu pentru că le-au mai văzut \u2014 chiar când nu își amintesc că le-au văzut.\n\nÎn practică: o prezență consistentă, cu presiune scăzută, de-a lungul timpului, face mai multă muncă decât orice singură interacțiune. Nu câștigi doar pe momente de vârf. Câștigi prin a fi persoana care a fost acolo, a continuat să apară și a lăsat familiaritatea să se acumuleze.\n\nModelul de investiție adaugă alt strat: angajamentul oamenilor față de o relație crește proporțional cu investiția în ea \u2014 timp, emoție, experiențe comune. De aceea investiția timpurie contează. Nu pentru că captivezi pe cineva. Ci pentru că le dai ceva în care să fie investiți.\n\nJocul lung nu e despre persistență care se apropie de hărțuire. E despre menținerea unei prezențe de calitate, cu anxietate scăzută, de-a lungul timpului, fără a trata fiecare interacțiune ca o performanță.",
        "examples": {
          "0": {"label": "Gândire pe termen scurt", "text": "Fiecare mesaj trebuie să aterizeze perfect. Fiecare conversație trebuie să escaladeze. Fiecare interacțiune e decisivă."},
          "1": {"label": "Gândire pe termen lung", "text": "Angajament consistent, autentic de-a lungul timpului. Unele conversații sunt mediocre. Tiparul e cel care contează."}
        }
      },
      "1": {
        "context": "După o conversație care a mers bine, dar nu spectaculos",
        "dont": "Dispari pentru că nu a fost o interacțiune de vârf, sau trimiți un mesaj anxios încercând să recapturezi energia",
        "do": "Revino o zi sau două mai târziu cu ceva nou. Aceeași persoană, un alt moment.",
        "why": "Jocul lung nu se construiește în conversații singulare. Se construiește în tipar. A reveni natural după o conversație obișnuită semnalează: nu notez fiecare interacțiune. Sunt pur și simplu aici."
      },
      "2": {
        "question": "Ultima conversație a fost bună dar s-a stins la final. Au trecut 2 zile. Ce faci?",
        "options": {
          "0": {"text": "Nimic \u2014 conversația s-a terminat deja, a o redeschide pare disperat", "explanation": "A aștepta un moment perfect pentru a re-angaja e gândire pe termen scurt. Jocul lung nu necesită reintrări perfecte."},
          "1": {"text": "Mesaj cu ceva nou și independent \u2014 nu o continuare a ultimei conversații", "explanation": "Un mesaj natural și independent la 2 zile distanță semnalează: ăsta e pur și simplu felul meu de a funcționa. Nu mă gândesc prea mult la fiecare interacțiune. Prezență consistentă."},
          "2": {"text": "\"Hei! Nu am mai auzit de tine un pic 😊\"", "explanation": "Pasiv și ușor nevoiaș. Hook-ul independent e mai bun \u2014 îi oferă ceva la care să răspundă."}
        }
      },
      "3": {
        "title": "Revenirea după Două Zile",
        "instruction": "Găsește o conversație care s-a stins sau s-a terminat fără un pas următor clar. Peste două zile, trimite un mesaj nou, independent, fără nicio referire la cum s-a terminat ultima.",
        "tips": {
          "0": "Mesajul de reintrare ar trebui să se simtă ca o conversație nouă, nu o continuare",
          "1": "Nu menționa pauza \u2014 asta o face ciudată",
          "2": "Calitatea peste frecvență: un mesaj bun bate trei mediocre"
        }
      }
    }
  },
  "c4_l10": {
    "title": "Integrare",
    "duration": "6 min",
    "steps": {
      "0": {
        "heading": "Acestea nu sunt tehnici. Sunt un mod de a te angaja cu oamenii.",
        "body": "Motivul pentru care cineva care e cu adevărat bun la asta pare fără efort nu e că rulează un set de tehnici. E că tehnicile au devenit sistemul lor de operare \u2014 atât de interiorizate încât încetează să mai fie lucruri pe care le faci și devin modul în care te angajezi natural.\n\nSpecificitate: ești cu adevărat atent.\nTimp: ai lucruri de făcut.\nReciprocitate: dai la fel de mult cât ceri.\nIncertitudine: ești cu adevărat interesant, nu complet de descifrat.\nProfunzime: ești dispus să mergi undeva real.\nCadru: știi cine ești și nu trebuie să îl aperi.\nVulnerabilitate: ești uman, în mod adecvat.\nConducere: ai idei și nu ceri aprobare pentru ele.\nJoc lung: nu performezi pentru fiecare interacțiune.\n\nNiciunul nu e un truc. Sunt calități. Scopul e să le dezvolți cu adevărat \u2014 astfel încât să apară natural mai degrabă decât să fie aplicate.",
        "examples": {
          "0": {"label": "Efectul compus", "text": "Când specificitatea + momentul + reciprocitatea + cadrul sunt toate prezente deodată, conversația are o energie complet diferită. Fiecare le întărește pe celelalte."},
          "1": {"label": "Testul de integrare", "text": "Citește ultima ta conversație. Care principii apar natural? Care apar doar când îți amintești să le aplici?"}
        }
      },
      "1": {
        "context": "Ești pe cale să începi o conversație cu cineva nou",
        "dont": "Parcurgând o listă de verificare de tehnici înainte de a trimite mesajul",
        "do": "Mesajul ca o persoană \u2014 apoi revizuiește după. Ce lipsea? Ce era acolo? Ajustează cu timpul.",
        "why": "Abordarea listei de verificare face conversațiile rigide. Abordarea revizuirii construiește calitățile de-a lungul timpului. Integrarea e o direcție, nu o stare."
      },
      "2": {
        "question": "Care e cel mai bun mod de a ști că aceste principii sunt cu adevărat integrate?",
        "options": {
          "0": {"text": "Poți să le numești pe toate și să explici când să le folosești pe fiecare", "explanation": "Cunoașterea lor nu înseamnă folosirea lor. Mulți oameni înțeleg principiile și nu aplică niciunul sub presiune."},
          "1": {"text": "Citești o conversație pe care ai avut-o ieri și cele mai multe apar fără să te fi străduit", "explanation": "Integrarea apare în comportament, nu în memorie. Când sunt acolo natural, sunt interiorizate."},
          "2": {"text": "Termini secțiunea de provocări cu 100% completare", "explanation": "Completarea înseamnă că te-ai angajat cu materialul. Integrarea înseamnă că a schimbat modul în care te comporți de fapt."}
        }
      },
      "3": {
        "title": "Revizuirea",
        "instruction": "Citește ultimele tale trei conversații. Marchează care principii apar natural și care lipsesc complet. Acele goluri sunt următoarele tale 30 de zile.",
        "tips": {
          "0": "Onestitatea contează mai mult decât autoprotecția",
          "1": "Principiile lipsă sunt doar obiceiuri neformate \u2014 nu defecte de caracter",
          "2": "Alege un gol. Lucrează la el. Apoi la următor."
        }
      }
    }
  },
  "c5_l1": {
    "title": "Semnalele de Interes în Text",
    "duration": "4 min",
    "steps": {
      "0": {
        "heading": "Interesul se arată în textură \u2014 nu în ce spun oamenii, ci în cum o spun.",
        "body": "Există un fenomen bine documentat în care două persoane mutual angajate încep să reflecte tiparele de limbaj ale celuilalt \u2014 nu conștient, ci ca un rezultat natural al atenției autentice. Ei potrivesc ritmul, energia, structura propoziției. Această convergență prezice interesul mutual mai fiabil decât conținutul mesajelor în sine.\n\nÎn text, interesul apare în moduri specifice și lizibile: timpul de răspuns se scurtează. Mesajele devin mai lungi. Întrebările vin înapoi neprovocate. Ea face referire la lucruri pe care le-ai spus mai devreme \u2014 urmărea. Ea adaugă detalii pe care nu le-ai cerut. Ea găsește motive să continue conversația când ar putea să se termine natural.\n\nAcestea nu sunt declarații. Sunt derivă comportamentală \u2014 conversația se mișcă spre ceva pentru că amândoi se apleacă. O poți citi în textura schimbului înainte ca vreunul din voi să fi spus ceva explicit.",
        "examples": {
          "0": {"label": "Textură de interes ridicat", "text": "Răspunsuri rapide / mesaje mai lungi / întrebări înapoi / referire la lucruri spuse anterior / adaugă detalii voluntar"},
          "1": {"label": "Textură de interes scăzut", "text": "Răspunsuri mai lente / mesaje mai scurte / fără întrebări înapoi / răspunsuri monosilabice / conversație care se termină fără efort de a continua"}
        }
      },
      "1": {
        "context": "Citind o conversație recentă",
        "dont": "Încercând să citești interesul din mesaje individuale sau din ce a spus ea",
        "do": "Citește tiparul: latența răspunsului, lungimea mesajului, rata de întrebări, adăugiri neprovocate. Acela e semnalul.",
        "why": "Mesajele individuale pot induce în eroare \u2014 oamenii au zile proaste, umor sec, stiluri diferite de textare. Tiparul pe mai multe schimburi e mult mai fiabil decât orice mesaj singular."
      },
      "2": {
        "question": "Ea răspunde rapid dar dă mereu răspunsuri scurte, complete, fără întrebări înapoi. Ce sugerează tiparul?",
        "options": {
          "0": {"text": "Interes ridicat \u2014 răspunde repede", "explanation": "Timpul de răspuns e un singur semnal, nu întreaga imagine. Fără întrebări înapoi și răspunsuri complete fără fire sunt semnale de implicare scăzută, nu ridicată."},
          "1": {"text": "Neclar \u2014 dar lipsa întrebărilor înapoi merită observată", "explanation": "Răspunsurile rapide ar putea fi doar stilul ei de textare. Absența consistentă a întrebărilor înapoi e mai semnificativă. Combinația sugerează angajament politicos, nu interes autentic."},
          "2": {"text": "Interes scăzut \u2014 răspunsuri scurte înseamnă că nu e interesată", "explanation": "Răspunsurile scurte singure nu îți spun suficient. Unii oameni textează concis și sunt foarte interesați. Tiparul pe mai multe semnale e cel care contează."}
        }
      },
      "3": {
        "title": "Citește Tiparul",
        "instruction": "Alege două conversații: una care părea promițătoare și una care părea plată. Compară textura: timp de răspuns, lungimea mesajului, întrebări înapoi, detalii adăugate. Ce e de fapt diferit?",
        "tips": {
          "0": "Cauți tipare, nu mesaje individuale",
          "1": "Încearcă să fii obiectiv \u2014 citește-o ca și când ar fi conversația altcuiva",
          "2": "Cea plată are probabil semne specifice de textură pe care le poți numi"
        }
      }
    }
  },
  "c5_l2": {
    "title": "Semnale de Dezinteres",
    "duration": "4 min",
    "steps": {
      "0": {
        "heading": "Retragerea socială urmează un tipar previzibil. Învață să o citești devreme.",
        "body": "Dezinteresul de obicei nu e declarat \u2014 se strecoară. Oamenii nu tind să spună \"îmi pierd interesul.\" Pur și simplu încep să răspundă diferit. Semnalele sunt treptate și consistente: timpul de răspuns crește, lungimea mesajului scade, întrebările înapoi dispar, orice menționare a planurilor viitoare se evaporă.\n\nAcestea nu sunt decizii conștiente. Sunt derivă comportamentală \u2014 rezultatul natural al atenției cuiva care se mută în altă parte. Sunt semnale involuntare, ceea ce le face fiabile.\n\nGreșeala e interpretarea lor ca temporare și încercarea de a supracorecta. \"Poate e doar ocupată\" e uneori adevărat. Dar \"a fost ocupată 10 zile la rând în timp ce răspunde la orice altceva\" e date.\n\nCitirea dezinteresului devreme costă aproape nimic. Redirecționezi timpul. A nu-l citi \u2014 explicându-l, trimițând mai multe mesaje, încercând mai mult \u2014 costă mult.",
        "examples": {
          "0": {"label": "Semnal timpuriu", "text": "Răspunsurile au trecut de la sub 10 minute la câteva ore, consistent."},
          "1": {"label": "Semnal confirmat", "text": "Răspunsurile sunt propoziții complete care termină conversațiile în loc să le continue."},
          "2": {"label": "Semnal clar", "text": "Fără întrebări înapoi timp de 5+ mesaje consecutive."}
        }
      },
      "1": {
        "context": "Ea a dat răspunsuri scurte și a durat mult mai mult să răspundă în ultima săptămână",
        "dont": "Trimite mesaje mai interesante ca să încerci să re-angajezi, sau întrebând \"e totul bine?\"",
        "do": "Trimite un singur mesaj curat de hook. Dacă tiparul nu se schimbă \u2014 acceptă semnalul.",
        "why": "A încerca mai mult când cineva se retrage semnalează că nu poți citi situația \u2014 și că ai nevoie de angajamentul lor mai mult decât au nevoie să îl dea. Un ultim hook e respectuos. O serie de încercări escaladante nu este."
      },
      "2": {
        "question": "Ea a răspuns la ultimele tale 6 mesaje cu răspunsuri de 1\u20132 cuvinte și fără întrebări. Care e cea mai exactă lectură?",
        "options": {
          "0": {"text": "E doar ocupată \u2014 continuă conversația", "explanation": "Oamenii ocupați uneori dau răspunsuri scurte. Răspunsuri scurte consistente cu zero întrebări pe 6 mesaje e un tipar, nu o coincidență."},
          "1": {"text": "Semnal clar de implicare scăzută. Un ultim hook, apoi lasă-l baltă.", "explanation": "Tiparul e neambiguu. O ultimă încercare curată e rezonabilă. Dacă tiparul nu se schimbă, semnalul e real."},
          "2": {"text": "Te testează \u2014 continuă să insistați", "explanation": "Comportamentul de testare e de obicei o rezistență singulară, nu o săptămână de retragere consistentă. A explica dezinteresul ca test e de obicei gândire-dorință."}
        }
      },
      "3": {
        "title": "Numește Tiparul Într-o Conversație",
        "instruction": "Găsește o conversație unde ceva s-a schimbat. Citește înapoi 10 mesaje dinainte și după schimbare. Numește exact ce s-a schimbat în textură.",
        "tips": {
          "0": "Fii sincer \u2014 probabil știai deja",
          "1": "Scopul nu e să te simți rău. Scopul e să citești cu precizie, mai devreme",
          "2": "Citirea precisă timpurie economisește timp și energie semnificativă"
        }
      }
    }
  },
  "c5_l3": {
    "title": "Comportamentul Cald-Rece",
    "duration": "5 min",
    "steps": {
      "0": {
        "heading": "Inconsistența de obicei nu e o strategie. E de obicei frică.",
        "body": "Comportamentul cald-rece \u2014 căldură autentică urmată de retragere bruscă, disponibilitate inconsistentă, distanță după apropiere \u2014 e adesea citit greșit ca \"joacă dificilă\". Aproape niciodată nu este.\n\nCercetările despre atașament au fost consistente în acest sens timp de decenii: oamenii care au trăit o îngrijire imprevizibilă la începutul vieții dezvoltă un stil de atașament anxios \u2014 doresc cu adevărat apropierea, dar se tem că va lua sfârșit, deci creează distanță ca autoprotecție înainte ca cealaltă persoană să se retragă prima. Tiparul cald/rece nu e un joc. E un răspuns de teamă.\n\nÎnțelegerea acestui lucru schimbă modul în care răspunzi. Dacă o tratezi ca strategie, joci în ea \u2014 încerci mai mult când ea se retrage, ceea ce confirmă frica că apropierea = pierdere iminentă. Dacă o înțelegi ca frică, poți rămâne stabil în loc să alergi \u2014 ceea ce e de fapt ce are nevoie atașamentul anxios pentru a se simți mai sigur.\n\nAsta nu înseamnă tolerarea tratamentului slab. Înseamnă citirea comportamentului cu precizie înainte de a decide ce să faci în privința lui.",
        "examples": {
          "0": {"label": "Tiparul cald/rece", "text": "Trei zile de angajament intens \u2192 distanță bruscă \u2192 căldură din nou când te retragi \u2192 distanță când te re-angajezi."},
          "1": {"label": "Diferența", "text": "\"Joacă dificilă\" e calculată. Atașamentul anxios e involuntar. Textura se simte diferit \u2014 una pare deliberată, cealaltă pare confuzie autentică."}
        }
      },
      "1": {
        "context": "Ea a fost foarte angajată săptămâna trecută și s-a răcit săptămâna asta fără niciun motiv clar",
        "dont": "Trimiterea mai multor mesaje sau creșterea efortului de a re-angaja",
        "do": "Rămâi stabil. Un mesaj dacă alegi. Nu îți schimba nivelul de energie bazat pe al ei.",
        "why": "Alergarea confirmă frica: apropierea e instabilă și va fi retrasă, deci trebuie să mă retrag primul. A rămâne stabil \u2014 nu rece, nu disperat \u2014 semnalează ceva diferit: sunt consistent. Asta e ce ajută de fapt."
      },
      "2": {
        "question": "Ea a fost foarte caldă timp de 5 zile, apoi a tăcut 3 zile. Tocmai a trimis din nou un mesaj cald. Ce se întâmplă?",
        "options": {
          "0": {"text": "Joacă dificilă \u2014 a înțeles că asta te menține interesat", "explanation": "Posibil, dar explicația mai comună e atașamentul anxios \u2014 s-a apropiat, s-a speriat, s-a retras și acum ajunge din nou deoarece se simte mai sigur. Ciclul va continua dacă e întâmpinat cu alergare."},
          "1": {"text": "Posibil atașament anxios \u2014 s-a apropiat, s-a speriat, s-a retras și se re-angajează acum că se simte mai sigur", "explanation": "Cel mai consistent cu tiparul. Răspunsul e același oricum: rămâi stabil, angajat dar fără escaladare, și vezi dacă tiparul se stabilizează."},
          "2": {"text": "Interes scăzut \u2014 scrie doar când e plictisită", "explanation": "Cele 5 zile de căldură autentică de la început sugerează mai mult decât textare din plictiseală. Tiparul ciclic indică mai degrabă dinamici de atașament decât dezinteres."}
        }
      },
      "3": {
        "title": "Cartografierea Ciclului",
        "instruction": "Dacă ai o conversație cu un tipar cald/rece \u2014 cartografiaz-o. Când a apărut căldura? Ce a precedat retragerea? Ce a venit înainte de revenire? Caută ciclul.",
        "tips": {
          "0": "Încerci să identifici declanșatorul retragerii, nu să o explici",
          "1": "Apropiere \u2192 retragere \u2192 revenire e ciclul de atașament anxios",
          "2": "Treaba ta e să rămâi stabil, nu să o repari"
        }
      }
    }
  },
  "c5_l4": {
    "title": "Ce Înseamnă Tăcerea",
    "duration": "4 min",
    "steps": {
      "0": {
        "heading": "În situații ambigue, creierul e implicit la interpretarea negativă. De obicei incorect.",
        "body": "Există o asimetrie consistentă în modul în care oamenii procesează informațiile ambigue: semnalele negative se înregistrează mai puternic decât cele pozitive de greutate echivalentă. Aceasta era adaptativă \u2014 ratarea unei amenințări era mai costisitoare decât ratarea unei oportunități. Dar în contexte moderne, produce o eroare sistematică: interpretăm semnalele ambigue negativ implicit.\n\nTăcerea e cea mai frecventă victimă a acestui lucru. Ea nu a răspuns în 4 ore. Creierul oferă: pierde interesul. A văzut-o și nu a răspuns. Vorbește cu altcineva. Acestea nu sunt concluzii \u2014 sunt creierul umplând ambiguitatea cu scenarii worst-case.\n\nRaportul semnal-zgomot real în tăcere e mult mai scăzut decât se simte. Cele mai multe tăceri au explicații banale: s-a ocupat, a uitat să răspundă, nu știa ce să spună, telefonul era cu ecranul în jos. Citind tăcerea ca respingere \u2014 și acționând pe baza acelei lecturi \u2014 produce comportamente (mesaje follow-up, auto-corecție, anxietate crescută) care creează exact rezultatul de care te-ai temut.",
        "examples": {
          "0": {"label": "Ce spune creierul tău", "text": "\"Nu a răspuns în 6 ore. Clar și-a pierdut interesul.\""},
          "1": {"label": "Ce e probabil adevărat", "text": "\"S-a ocupat, a uitat să răspundă, o să revină la asta mai târziu, doarme, a apărut ceva.\""},
          "2": {"label": "Testul", "text": "Dacă a tăcut 6 ore dar story-ul ei de Instagram tocmai a apărut \u2014 acela e date. Dacă nu există dovezi în niciun fel \u2014 așteaptă."}
        }
      },
      "1": {
        "context": "Ea nu a răspuns în 5 ore la un mesaj pe care l-ai trimis în mijlocul conversației",
        "dont": "Trimite un mesaj follow-up, sau \"ai văzut mesajul meu?\", sau un subiect nou pentru a re-angaja",
        "do": "Nimic. Bias-ul negativ îți dă o lectură falsă. Așteaptă.",
        "why": "Acționând pe interpretarea negativă creezi problema. Ea poate că era pe cale să răspundă. Acum ai trimis două mesaje înainte de răspunsul ei, ceea ce semnalează exact dinamica de anxietate pe care încercai să o eviți."
      },
      "2": {
        "question": "Ea nu a răspuns în 8 ore după o conversație bună. Interpretarea ta?",
        "options": {
          "0": {"text": "Pierde interesul \u2014 8 ore e mult timp", "explanation": "8 ore e o cantitate normală de timp în ziua cuiva. Muncă, somn, alte lucruri. Bias-ul negativ citește asta ca semnal când probabil e zgomot."},
          "1": {"text": "Ambiguu \u2014 ar putea fi orice. Nu acționa pe baza asta.", "explanation": "8 ore de tăcere după o conversație bună e cu adevărat ambiguă. Mișcarea corectă e să aștepți, nu să răspunzi la o interpretare care poate fi falsă."},
          "2": {"text": "Îmi testează răbdarea \u2014 ar trebui să ajung ca să arăt că nu mă deranjează", "explanation": "\"Mă testează\" e eroarea-oglindă a \"pierde interesul\" \u2014 ambele umplu ambiguitatea cu o poveste. Așteptați date reale."}
        }
      },
      "3": {
        "title": "Prinde Bias-ul în Timp Real",
        "instruction": "Data viitoare când simți nevoia să trimiți un follow-up după tăcere \u2014 scrie interpretarea pe care acționezi. E dovadă sau presupunere? Așteaptă 24 de ore. Apoi verifică dacă interpretarea era exactă.",
        "tips": {
          "0": "Scrierea o încetinește bucla automată de răspuns",
          "1": "Observă distanța dintre \"nu a răspuns\" și \"pierde interesul\" \u2014 acela e bias-ul",
          "2": "Cele mai multe tăceri se rezolvă singure fără intervenție"
        }
      }
    }
  },
  "c5_l5": {
    "title": "Semne de Alarmă vs Joacă Dificilă",
    "duration": "5 min",
    "steps": {
      "0": {
        "heading": "\"Joacă dificilă\" e aproape mereu greșit diagnosticată.",
        "body": "Cercetările despre asta sunt clare și au fost timp de ani: indisponibilitatea nediscriminatorie \u2014 a fi rece sau greu de contactat pentru toată lumea \u2014 nu face pe cineva mai atractiv. Semnalează dezirabilitate socială scăzută. Nimeni cu valoare socială autentică nu e indisponibil pentru toată lumea.\n\nCe funcționează e dificultatea selectivă: a fi cu adevărat ocupat sau greu de contactat în general, arătând în același timp interes specific față de persoana particulară. Combinația de selectivitate generală ridicată + interes specific autentic e cea care creează dinamica. Aceea e o calitate reală, nu una performată.\n\nProblema practică e că \"joacă dificilă\" a devenit explicația implicită pentru ceea ce e de obicei pur și simplu interes scăzut. Distincțiile cheie: Joacă dificilă implică interes cald când ești prezent, angajament autentic când sunt conectați, doar indisponibilitate strategică în alte momente. Interesul scăzut arată ca indisponibilitate consistentă, fără căldură când e prezentă, angajament minimal când e conectată, și tăcere care nu se rezolvă.\n\nDiferența contează pentru că răspunsul e diferit. Joacă dificilă recompensează angajamentul răbdător și calm. Interesul scăzut nu recompensează nimic \u2014 e pur și simplu interes scăzut.",
        "examples": {
          "0": {"label": "Joacă dificilă (rar)", "text": "Lentă la răspuns, dar când e angajată: caldă, interesată, face interacțiunea să merite. Indisponibilitate strategică cu căldură autentică când e prezentă."},
          "1": {"label": "Interes scăzut (comun)", "text": "Lentă la răspuns, și când e angajată: răspunsuri scurte, fără întrebări, răspunsuri care termină conversația. Consistent pe contexte."}
        }
      },
      "1": {
        "context": "Ea e constant lentă la răspuns, scurtă în răspunsurile ei și nu adaugă niciodată la conversație",
        "dont": "Spunându-ți că \"joacă dificilă\" și încercând mai mult",
        "do": "Acceptă semnalul. Un mesaj final curat de hook. Dacă tiparul nu se schimbă \u2014 e interes scăzut.",
        "why": "Diagnosticarea greșită a interesului scăzut ca comportament strategic duce la investiție continuă într-o situație asimetrică. Costul se acumulează. Citindu-l corect devreme îl economisești pe tot."
      },
      "2": {
        "question": "Ea durează 3\u20134 ore să răspundă la orice, dar când o face, scrie mesaje lungi și pune întrebări reale. Ce se întâmplă?",
        "options": {
          "0": {"text": "Interes scăzut \u2014 clar nu e atât de angajată", "explanation": "Timpul de răspuns e un singur semnal. Mesajele lungi, angajate cu întrebări reale sunt textură de interes ridicat. Tiparul în ansamblu indică interes autentic cu un stil de textare lent."},
          "1": {"text": "Probabil interes autentic \u2014 calitatea angajamentului depășește timpul de răspuns", "explanation": "Angajamentul de înaltă calitate când e prezentă e semnalul mai fiabil. Poate pur și simplu textează lent. Combinația de răspunsuri lente + angajament bogat e un tipar cunoscut \u2014 nu e interes scăzut."},
          "2": {"text": "Joacă dificilă \u2014 fii mai puțin disponibil ca să o potrivești", "explanation": "Nu pare că performează ceva \u2014 se angajează autentic când e prezentă. Oglindirea timpului ei de răspuns e bine, dar asta nu necesită o schimbare deliberată de strategie."}
        }
      },
      "3": {
        "title": "Aplică Distincția",
        "instruction": "Ia o conversație unde ai fost nesigur despre nivelul de interes. Aplică distincția: când EA e angajată, calitatea e ridicată sau scăzută? Acela e semnalul real.",
        "tips": {
          "0": "Calitatea angajamentului când e prezentă > frecvența angajamentului",
          "1": "Caldă când e prezentă + lentă = posibil joacă dificilă sau pur și simplu textează lent",
          "2": "Rece când e prezentă + lentă = interes scăzut"
        }
      }
    }
  },
  "c5_l6": {
    "title": "Când să Escaladezi vs Să te Retragi",
    "duration": "5 min",
    "steps": {
      "0": {
        "heading": "Erorile de timing sunt principalul motiv pentru care conversațiile bune nu duc nicăieri.",
        "body": "Cel mai frecvent mod de a eșua în atracția bazată pe text nu e tehnica slabă \u2014 e tehnica bună la momentul greșit. Escaladezi când ea încă decide. Te retragi când impulsul e de fapt acolo. Îi propui o întâlnire prea devreme sau rămâi în conversație prea mult timp.\n\nCalibrarea e abilitatea de a-i citi starea actuală cu precizie și de a răspunde la aceasta, mai degrabă decât să rulezi un script prestabilit. E o abilitate care se poate învăța. Semnalele sunt aproape mereu lizibile dacă privești lucrurile potrivite.\n\nEscaladarea e potrivită când: calitatea angajamentului e ridicată, ea pune întrebări reale înapoi, adaugă detalii pe care nu le-ai cerut, timpul de răspuns e rapid și consistent, conversația are o dinamică naturală înainte.\n\nRetragerea e potrivită când: calitatea angajamentului scade, conversația devine întreținere mai degrabă decât schimb autentic, ea dă răspunsuri complete dar închise, ați fost în contact susținut fără nicio escaladare reală în profunzime.\n\nGreșeala în ambele direcții: acționând pe script în loc de semnal.",
        "examples": {
          "0": {"label": "Semnale pentru escaladare", "text": "Răspunsuri rapide + mesaje lungi + întrebări reale înapoi + dinamică înainte. Invit-o la întâlnire."},
          "1": {"label": "Semnale pentru retragere", "text": "Conversație stagnantă + răspunsuri scurte + nu pune nimic înapoi. Retrage-te, lasă spațiul să lucreze."}
        }
      },
      "1": {
        "context": "Conversația a mers grozav timp de 3 zile \u2014 energie bună, întrebări înapoi, mesaje lungi",
        "dont": "Menținând conversația la nesfârșit pentru că dinamica se simte bine",
        "do": "Escaladează. Invit-o la întâlnire. Spre asta indică semnalele.",
        "why": "Energia bună a conversației nu durează pentru totdeauna \u2014 are dinamică. Dacă nu o muți undeva cât timp semnalul e acolo, stagnează și se deteriorează. Citirea momentului potrivit pentru a escalada e una dintre cele mai valoroase abilități de calibrare."
      },
      "2": {
        "question": "Ea a dat răspunsuri angajate, lungi \u2014 dar ultimele trei au fost vizibil mai scurte și complete. Care e mișcarea corectă?",
        "options": {
          "0": {"text": "Invit-o la întâlnire acum \u2014 lovește cât mai există", "explanation": "Semnalul s-a schimbat. Trei scăderi consecutive în angajament sugerează că dinamica scade, nu crește. Escaladarea în dinamică în scădere de obicei accelerează scăderea."},
          "1": {"text": "Retrage-te \u2014 lasă spațiul să lucreze, apoi re-angajează", "explanation": "Când calitatea angajamentului scade, menținerea sau escaladarea nu o repară. O retragere scurtă creează spațiu pentru ea să se re-angajeze voluntar \u2014 ceea ce resetează dinamica."},
          "2": {"text": "Trimite un mesaj mai interesant pentru a re-angaja", "explanation": "A încerca mai mult când angajamentul scade e greșeala clasică. Semnalează că ai observat scăderea și corectezi \u2014 ceea ce comunică anxietate, nu abundență."}
        }
      },
      "3": {
        "title": "Citește Situația \u2014 O Conversație",
        "instruction": "Alege o conversație activă. Citește ultimele 10 mesaje. Calitatea angajamentului crește, e plată sau scade? Pe baza acelei lecturi \u2014 care e mișcarea corectă?",
        "tips": {
          "0": "Crește: mută-o undeva. Invit-o la întâlnire sau aprofundează conversația.",
          "1": "Plată: introduce ceva nou sau retrage-te.",
          "2": "Scade: retrage-te. Lasă spațiul să lucreze."
        }
      }
    }
  }
}

data['challenges']['lessons'] = lessons

with open('i18n/ro.json', 'w', encoding='utf-8') as f:
    json.dump(data, f, ensure_ascii=False, indent=2)

print('Done! ro.json written successfully')
with open('i18n/ro.json', 'r', encoding='utf-8') as f:
    verify = json.load(f)
print('Lessons keys in ro.json:', list(verify['challenges']['lessons'].keys()))

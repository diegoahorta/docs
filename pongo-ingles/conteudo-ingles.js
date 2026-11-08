const PEOPLE = {
  Kate:{name:"Kate · teacher", color:"#d63c55"},
  Ben:{name:"Ben · classmate", color:"#2f86a6"},
  Lily:{name:"Lily · Ben’s sister", color:"#8b4fb3"},
  Sam:{name:"Sam · neighbour", color:"#1f2a5a"},
  Pongo:{name:"Pongo", img:"assets/st_feliz.webp"},
  Tromba:{name:"Senhor Tromba", img:"assets/st_juntos.webp"},
  Caderno:{name:"Caderno", color:"#e59a12", ch:"📒"}
};

const T_HAVE = `
<table class="conj">
<tr><td>I / you / we / they</td><td class="fr"><b>have</b> · <b>have got</b> (’ve got)</td><td><button class="say" data-say="I have a dog. I've got a dog.">🔊</button></td></tr>
<tr><td>he / she / it</td><td class="fr"><b>has</b> · <b>has got</b> (’s got)</td><td><button class="say" data-say="She has a cat. She's got a cat.">🔊</button></td></tr>
</table>`;
const T_HAVE_NEG = `
<table class="conj">
<tr><td>negativa</td><td class="fr">I <b>don’t have</b> · I <b>haven’t got</b></td><td><button class="say" data-say="I don't have a car. I haven't got a car.">🔊</button></td></tr>
<tr><td>negativa (he/she/it)</td><td class="fr">he <b>doesn’t have</b> · he <b>hasn’t got</b></td><td><button class="say" data-say="He doesn't have a car. He hasn't got a car.">🔊</button></td></tr>
<tr><td>pergunta</td><td class="fr"><b>Do</b> you <b>have</b>…? · <b>Have</b> you <b>got</b>…?</td><td><button class="say" data-say="Do you have a dog? Have you got a dog?">🔊</button></td></tr>
<tr><td>pergunta (he/she/it)</td><td class="fr"><b>Does</b> she <b>have</b>…? · <b>Has</b> she <b>got</b>…?</td><td><button class="say" data-say="Does she have a cat? Has she got a cat?">🔊</button></td></tr>
</table>`;
const T_DO = `
<table class="conj">
<tr><td>I / you / we / they</td><td class="fr"><b>Do</b> you <b>play</b> the guitar?</td><td><button class="say" data-say="Do you play the guitar?">🔊</button></td></tr>
<tr><td>he / she / it</td><td class="fr"><b>Does</b> Pongo <b>like</b> cats?</td><td><button class="say" data-say="Does Pongo like cats?">🔊</button></td></tr>
<tr><td>palavra interrogativa</td><td class="fr">Where <b>do</b> you <b>live</b>?</td><td><button class="say" data-say="Where do you live?">🔊</button></td></tr>
<tr><td>resposta curta +</td><td class="fr">Yes, I <b>do</b>. · Yes, she <b>does</b>.</td><td><button class="say" data-say="Yes, I do. Yes, she does.">🔊</button></td></tr>
<tr><td>resposta curta −</td><td class="fr">No, I <b>don’t</b>. · No, he <b>doesn’t</b>.</td><td><button class="say" data-say="No, I don't. No, he doesn't.">🔊</button></td></tr>
</table>`;
const T_CONT = `
<table class="conj">
<tr><td>present continuous<br><small>agora, neste momento</small></td><td class="fr">Pongo <b>is sleeping</b> now.</td><td><button class="say" data-say="Pongo is sleeping now.">🔊</button></td></tr>
<tr><td>present simple<br><small>sempre, em geral, às vezes</small></td><td class="fr">Pongo <b>sleeps</b> every afternoon.</td><td><button class="say" data-say="Pongo sleeps every afternoon.">🔊</button></td></tr>
<tr><td>pergunta (agora)</td><td class="fr"><b>Is</b> he <b>playing</b>? — No, he <b>isn’t</b>.</td><td><button class="say" data-say="Is he playing? No, he isn't.">🔊</button></td></tr>
<tr><td>pergunta (em geral)</td><td class="fr"><b>Does</b> he <b>play</b>? — Yes, he <b>does</b>.</td><td><button class="say" data-say="Does he play? Yes, he does.">🔊</button></td></tr>
</table>`;
const STATIVE = `<p style="margin:8px 0 0">Verbos que normalmente <b>não</b> vão para o <i>-ing</i>:
<span class="fr">like · want · know · understand · remember · prefer · need · mean · believe · forget</span></p>`;

const LEVELS = [
{
  id:"have", n:1, type:"mc", count:8, theme:"classe",
  title:"Have you got a bone?", sub:"Unit 9 · have / have got",
  sticker:"feliz", bonus:"carinhoso",
  story:"O <b>Senhor Tromba</b> sumiu! O Pongo vai à escola de inglês da teacher Kate e começa a perguntar quem tem o quê. <b>Escolha a placa certa</b> e o Pongo pula para pegá-la!",
  lesson: T_HAVE + T_HAVE_NEG + `<ul class="tips">
    <li><b>have</b> e <b>have got</b> significam a mesma coisa: <span class="fr">I have blue eyes = I’ve got blue eyes.</span></li>
    <li>he / she / it → <b>has</b> / <b>has got</b> (’s got).</li>
    <li>Resposta curta: <span class="fr">Have you got…? — Yes, I have. / No, I haven’t.</span> · <span class="fr">Do you have…? — Yes, I do. / No, I don’t.</span></li></ul>`,
  qs:[
    {who:"Ben", q:"I ___ a new bike. Do you want to see it?", o:["have got","has got","having"], pt:"Eu tenho uma bicicleta nova.", tip:"I / you / we / they → <b>have got</b> (curto: I’ve got)."},
    {who:"Kate", q:"Pongo ___ a toy elephant.", o:["has got","have got","is got"], pt:"O Pongo tem um elefante de brinquedo.", tip:"he / she / it → <b>has got</b> (curto: he’s got)."},
    {who:"Ben", q:"My sister Lily ___ two cats.", o:["has","have","haves"], pt:"Minha irmã Lily tem dois gatos.", tip:"he / she / it → <b>has</b>."},
    {who:"Caderno", q:"Qual é a forma curta de “They have got a dog”?", o:["They’ve got a dog.","They’s got a dog.","They’ve a got dog."], pt:"Eles têm um cachorro.", say:"They've got a dog.", tip:"they have got → <b>they’ve got</b>."},
    {who:"Sam", q:"Pongo ___ a bed. He sleeps on the sofa!", o:["doesn’t have","don’t have","hasn’t have"], pt:"O Pongo não tem cama. Ele dorme no sofá!", tip:"he / she / it → <b>doesn’t have</b> (ou <i>hasn’t got</i>)."},
    {who:"Lily", q:"I ___ any brothers. I’ve only got a sister.", o:["haven’t got","hasn’t got","don’t got"], pt:"Eu não tenho irmãos.", tip:"I → <b>haven’t got</b> (ou <i>don’t have</i>). Nunca “don’t got”."},
    {who:"Kate", q:"___ you got a pen, Ben?", o:["Have","Do","Has"], pt:"Você tem uma caneta, Ben?", tip:"Pergunta com got: <b>Have</b> you <b>got</b>…?"},
    {who:"Ben", q:"___ Lily have a car?", o:["Does","Has","Do"], pt:"A Lily tem carro?", tip:"Pergunta com have: <b>Does</b> she <b>have</b>…? (ou <i>Has she got…?</i>)"},
    {who:"Kate", q:"“Have you got a dog?” — “Yes, I ___.”", o:["have","do","got"], pt:"Você tem um cachorro? — Tenho.", tip:"Have you got…? → <b>Yes, I have.</b> / No, I haven’t."},
    {who:"Sam", q:"“Does Ben have a camera?” — “No, he ___.”", o:["doesn’t","hasn’t","don’t"], pt:"O Ben tem uma câmera? — Não.", tip:"Does he have…? → <b>No, he doesn’t.</b>"},
    {who:"Caderno", q:"Correct it: “She have got blue eyes.”", o:["She has got blue eyes.","She haves got blue eyes.","She has get blue eyes."], pt:"Corrija a frase.", tip:"she → <b>has got</b>."}
  ]
},
{
  id:"doyou", n:2, type:"mc", count:8, theme:"saopaulo",
  title:"Do you like bones?", sub:"Unit 7 · perguntas com do / does",
  sticker:"brincando", bonus:"cabo",
  story:"O Pongo sai pela cidade fazendo perguntas a todo mundo. Será que alguém viu o Senhor Tromba? Lembre: <b>do</b> com I/you/we/they e <b>does</b> com he/she/it.",
  lesson: T_DO + `<ul class="tips">
    <li>Ordem: <b>(palavra interrogativa) + do/does + sujeito + verbo</b>: <span class="fr">How often do you wash your hair?</span></li>
    <li>Depois de <b>does</b> o verbo fica na forma base: <span class="fr">Does she work?</span> (não “Does she works”).</li>
    <li><span class="fr">What do you do?</span> = Qual é a sua profissão? (<span class="fr">What’s your job?</span>)</li>
    <li>Com always / usually: <span class="fr">What do you usually do at weekends?</span></li></ul>`,
  qs:[
    {who:"Ben", q:"___ you play the guitar, Pongo?", o:["Do","Does","Are"], pt:"Você toca violão, Pongo?", tip:"you → <b>Do</b> you play…?"},
    {who:"Kate", q:"___ Sam live near here?", o:["Does","Do","Is"], pt:"O Sam mora aqui perto?", tip:"he / she / it → <b>Does</b> Sam live…?"},
    {who:"Lily", q:"Where ___ your parents live?", o:["do","does","are"], pt:"Onde seus pais moram?", tip:"your parents = they → where <b>do</b>…"},
    {who:"Ben", q:"What ___ this word mean?", o:["does","do","is"], pt:"O que esta palavra significa?", tip:"this word = it → <b>does</b>."},
    {who:"Caderno", q:"Como perguntar “Com que frequência você lava o cabelo?”", o:["How often do you wash your hair?","How often you wash your hair?","How often does you wash your hair?"], pt:"palavra interrogativa + do + sujeito + verbo", tip:"Ordem: <b>How often + do + you + wash</b>…"},
    {who:"Sam", q:"Does Lily ___ on Sundays?", o:["work","works","working"], pt:"A Lily trabalha aos domingos?", tip:"Depois de <b>does</b>: verbo na forma base (work)."},
    {who:"Kate", q:"“Do your friends speak English?” — “Yes, they ___.”", o:["do","does","speak"], pt:"Seus amigos falam inglês? — Falam.", tip:"Resposta curta: <b>Yes, they do.</b>"},
    {who:"Lily", q:"“Does Pongo like cats?” — “No, he ___.”", o:["doesn’t","don’t","isn’t"], pt:"O Pongo gosta de gatos? — Não.", tip:"he → <b>No, he doesn’t.</b>"},
    {who:"Caderno", q:"O que significa “What do you do?”", o:["What’s your job?","What are you doing now?","Do you do it?"], pt:"Pergunta muito comum!", say:"What do you do? What's your job?", tip:"<i>What do you do?</i> = <b>What’s your job?</b> (Qual é a sua profissão?)"},
    {who:"Ben", q:"What ___ you usually do at weekends?", o:["do","does","are"], pt:"O que você costuma fazer nos fins de semana?", tip:"<b>What do you usually do</b>…? (usually fica depois do sujeito)."},
    {who:"Sam", q:"How much ___ it cost to fly to London?", o:["does","do","is"], pt:"Quanto custa voar para Londres?", tip:"it → <b>does</b> it cost."}
  ]
},
{
  id:"doing", n:3, type:"mc", count:9, theme:"monde",
  title:"Is Pongo running?", sub:"Unit 8 · I am doing × I do",
  sticker:"curioso", bonus:"surpreso",
  story:"Uma pista! O Pongo segue o rastro do Senhor Tromba. Ele precisa saber a diferença entre o que acontece <b>agora</b> (am/is/are + -ing) e o que acontece <b>sempre</b> (present simple).",
  lesson: T_CONT + STATIVE + `<ul class="tips">
    <li><b>Agora / neste momento</b> (now, at the moment, Look!, Listen!) → <span class="fr">am / is / are + -ing</span>.</li>
    <li><b>Em geral / sempre / às vezes</b> (every day, often, usually, in winter) → present simple.</li></ul>`,
  qs:[
    {who:"Lily", q:"Be quiet! Pongo ___.", o:["is sleeping","sleeps","sleep"], pt:"Silêncio! O Pongo está dormindo.", tip:"Agora, neste momento → <b>is sleeping</b>."},
    {who:"Lily", q:"Pongo ___ every afternoon after lunch.", o:["sleeps","is sleeping","sleep"], pt:"O Pongo dorme toda tarde depois do almoço.", tip:"Hábito (every afternoon) → present simple: <b>sleeps</b>."},
    {who:"Kate", q:"Take an umbrella with you. It ___.", o:["is raining","rains","rain"], pt:"Leve um guarda-chuva. Está chovendo.", tip:"Agora → <b>is raining</b>."},
    {who:"Kate", q:"It ___ a lot in London in winter.", o:["rains","is raining","rain"], pt:"Chove muito em Londres no inverno.", tip:"Em geral → <b>rains</b>."},
    {who:"Sam", q:"Look! Ben ___ with Pongo in the garden.", o:["is playing","plays","play"], pt:"Olha! O Ben está brincando com o Pongo no jardim.", tip:"<i>Look!</i> = agora → <b>is playing</b>."},
    {who:"Ben", q:"Sorry, I ___ what you mean.", o:["don’t understand","am not understanding","not understand"], pt:"Desculpe, eu não entendo o que você quer dizer.", tip:"<b>understand</b> não vai para o -ing → I don’t understand."},
    {who:"Pongo", q:"I’m tired. I ___ to go home.", o:["want","am wanting","wants"], pt:"Estou cansado. Quero ir para casa.", tip:"<b>want</b> não vai para o -ing → I want."},
    {who:"Lily", q:"Ben ___ TV very often. He prefers books.", o:["doesn’t watch","isn’t watching","don’t watch"], pt:"O Ben não assiste TV com frequência.", tip:"Em geral (very often) → <b>doesn’t watch</b>."},
    {who:"Kate", q:"“What are you doing, Pongo?” — “I ___ for Senhor Tromba!”", o:["am looking","look","looks"], pt:"O que você está fazendo? — Estou procurando o Senhor Tromba!", tip:"Agora → <b>I am looking</b> (I’m looking)."},
    {who:"Sam", q:"“___ that girl?” — “Yes, but I don’t remember her name.”", o:["Do you know","Are you knowing","Does you know"], pt:"Você conhece aquela menina?", tip:"<b>know</b> não vai para o -ing → Do you know…?"},
    {who:"Kate", q:"Why ___ under the table, Pongo?", o:["are you","do you","you are"], pt:"Por que você está embaixo da mesa, Pongo?", tip:"Agora: Why <b>are you</b> under the table? / What are you doing?"},
    {who:"Caderno", q:"Qual verbo normalmente NÃO vai para o -ing?", o:["remember","play","watch"], pt:"like · want · know · understand · remember · prefer · need · mean · believe · forget", say:"I remember. I don't remember.", tip:"<b>remember</b> está na lista: I remember (não “I’m remembering”)."}
  ]
},
{
  id:"phrase", n:4, type:"build", count:6, theme:"lyon",
  title:"Make the sentence!", sub:"Monte frases e perguntas",
  sticker:"orgulhoso", bonus:"pensativo",
  story:"Um bilhete do Senhor Tromba, mas as palavras estão embaralhadas! <b>Toque nas palavras na ordem certa</b>. Cuidado: há uma palavra intrusa em cada frase!",
  lesson: `<div class="cols"><div>${T_DO}</div><div>${T_HAVE}${T_CONT}</div></div>
    <ul class="tips"><li>Pergunta: <b>do/does + sujeito + verbo</b> · <b>have/has + sujeito + got</b>.</li></ul>`,
  qs:[
    {pt:"Você tem um cachorro?", w:["Do","you","have","a","dog","?"], x:["Does"]},
    {pt:"Ela tem olhos azuis?", w:["Has","she","got","blue","eyes","?"], x:["have"]},
    {pt:"Onde seus pais moram?", w:["Where","do","your","parents","live","?"], x:["does"]},
    {pt:"O Pongo está dormindo agora.", w:["Pongo","is","sleeping","now","."], x:["sleeps"]},
    {pt:"Ele não tem carro.", w:["He","doesn’t","have","a","car","."], x:["has"]},
    {pt:"O que você costuma fazer nos fins de semana?", w:["What","do","you","usually","do","at","weekends","?"], x:["are"]},
    {pt:"Nós não temos irmãos.", w:["We","haven’t","got","any","brothers","."], x:["hasn’t"]},
    {pt:"Eu não entendo.", w:["I","don’t","understand","."], x:["am"]}
  ]
},
{
  id:"dialogue", n:5, type:"mc", count:8, ordered:true, theme:"parc",
  title:"Where is Senhor Tromba?", sub:"Diálogo final: responda como o Pongo",
  sticker:"juntos", bonus:"companhia",
  story:"Última etapa! Todos querem ajudar o Pongo a achar o Senhor Tromba. <b>Responda às perguntas</b> como o Pongo — com a frase certinha!",
  lesson: `<div class="cols"><div>${T_DO}</div><div>${T_HAVE_NEG}</div></div>${STATIVE}
    <ul class="tips"><li>Responda com o mesmo auxiliar da pergunta: <span class="fr">Do…? → Yes, I do.</span> · <span class="fr">Have… got? → Yes, I have.</span> · <span class="fr">Is…? → Yes, he is.</span></li></ul>`,
  qs:[
    {who:"Kate", q:"Hi, Pongo! Have you got a best friend?", o:["Yes, I have. His name is Senhor Tromba.","Yes, I do got.","Yes, I has."], pt:"Oi, Pongo! Você tem um melhor amigo?", tip:"Have you got…? → <b>Yes, I have.</b>"},
    {who:"Ben", q:"Does Senhor Tromba have big ears?", o:["Yes, he does.","Yes, he has got.","Yes, he do."], pt:"O Senhor Tromba tem orelhas grandes?", tip:"Does he have…? → <b>Yes, he does.</b>"},
    {who:"Lily", q:"What are you doing, Pongo?", o:["I’m looking for Senhor Tromba.","I look for Senhor Tromba now.","I am look for Senhor Tromba."], pt:"O que você está fazendo, Pongo?", tip:"Agora → <b>I’m looking</b>."},
    {who:"Kate", q:"Do you know where he is?", o:["No, I don’t.","No, I’m not knowing.","No, I doesn’t."], pt:"Você sabe onde ele está?", tip:"Do you know…? → <b>No, I don’t.</b> (know não vai para -ing)"},
    {who:"Sam", q:"Does he usually sleep in your bed?", o:["Yes, he does. He sleeps there every night.","Yes, he is. He is sleeping there every night.","Yes, he do. He sleep there every night."], pt:"Ele costuma dormir na sua cama?", tip:"Hábito (every night) → <b>he sleeps</b>; Does…? → <b>Yes, he does.</b>"},
    {who:"Ben", q:"Have you got a photo of him?", o:["Yes, I have. Look!","Yes, I do have got.","Yes, I’ve."], pt:"Você tem uma foto dele?", tip:"Resposta curta: <b>Yes, I have.</b> (não se contrai: nunca “Yes, I’ve”)."},
    {who:"Lily", q:"Look! Who is sitting on the sofa?", o:["Senhor Tromba is sitting on the sofa!","Senhor Tromba sits on the sofa now!","Senhor Tromba sitting on the sofa!"], pt:"Olha! Quem está sentado no sofá?", tip:"Agora (Look!) → <b>is sitting</b>."},
    {who:"Tromba", q:"Pongo! I’m here! Do you remember me?", o:["Of course I remember you!","Of course I’m remembering you!","Of course I remembers you!"], pt:"Pongo! Estou aqui! Você se lembra de mim?", tip:"<b>remember</b> não vai para o -ing: I remember you!"}
  ]
}
];


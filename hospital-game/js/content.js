// Conteúdo pedagógico: história "Mika vai ao hospital", bancos de exercícios
// e ilustrações dos flashcards. Baseado nas aulas ODU Creative:
// - No Hospital — Saúde, Bem-Estar e Sentimentos (I feel / I have / My ___ hurts)
// - Present Continuous — Affirmative & Negative
// - Situações Cotidianas — Simple Present × Present Continuous
(function () {
  const C = {};

  // Lugares da história, na ordem do percurso
  C.story = [
    {
      id: 'home', place: 'Em casa', placeEn: 'At home', time: '7:00', bg: 'bedroom', mood: 0xfff1e6,
      cast: { left: ['mika', 'tired'] },
      steps: [
        { who: 'narr', en: "It's Monday morning. Mika usually goes to school at 7:30, but today Mika isn't going to school.", pt: 'É segunda de manhã. Mika normalmente vai para a escola às 7h30, mas hoje Mika não está indo para a escola.' },
        { who: 'mika', emo: 'sick', en: "Oh no... I don't feel well.", pt: 'Ah não... Eu não me sinto bem.' },
        { who: 'mika', emo: 'dizzy', en: 'My head hurts and I feel really dizzy.', pt: 'Minha cabeça dói e eu me sinto muito tonta.' },
        { quiz: true, q: 'Mika quer dizer que está doente. Qual frase está correta?', opts: ['I feel sick.', 'I have sick.', 'I am feel sick.'], a: 0,
          why: '"Sick" é um ADJETIVO, então usamos FEEL: I feel sick.' },
        { who: 'mika', emo: 'worried', en: "I need to see a doctor. I'm going to the hospital now.", pt: 'Eu preciso ver um médico. Estou indo para o hospital agora.' },
        { quiz: true, q: 'Complete: "Right now, Mika ___ to the hospital."', opts: ['is going', 'goes', 'go'], a: 0,
          why: '"Right now" pede Present Continuous: is + going.' },
      ],
    },
    {
      id: 'reception', place: 'Recepção', placeEn: 'At the reception', time: '8:10', bg: 'reception', mood: 0xf0fff8,
      cast: { left: ['mika', 'sick'], right: ['ren', 'smile'] },
      steps: [
        { who: 'ren', emo: 'smile', en: 'Good morning. How can I help you?', pt: 'Bom dia. Como posso ajudar?' },
        { who: 'mika', emo: 'sick', en: "Hi, I don't feel well. I have a bad headache and a fever.", pt: 'Oi, eu não me sinto bem. Estou com uma dor de cabeça forte e febre.' },
        { quiz: true, q: 'Escolha o artigo certo: "I have ___ headache."', opts: ['a', 'an', '— (sem artigo)'], a: 0,
          why: '"Headache" é substantivo contável: sempre com artigo. "I have headache" está errado; o certo é "I have a headache".' },
        { who: 'ren', emo: 'worried', en: "I'm sorry to hear that. What's your name, please?", pt: 'Sinto muito. Qual é o seu nome, por favor?' },
        { who: 'mika', emo: 'tired', en: 'My name is Mika.', pt: 'Meu nome é Mika.' },
        { who: 'ren', emo: 'smile', en: 'Please take a seat in the waiting room. The doctor will call you soon.', pt: 'Por favor, sente-se na sala de espera. O médico vai te chamar logo.' },
        { who: 'mika', emo: 'neutral', en: 'Thank you.', pt: 'Obrigada.' },
        { quiz: true, q: 'O que é "the waiting room"?', opts: ['sala de espera', 'pronto-socorro', 'consulta marcada'], a: 0,
          why: 'waiting room = sala de espera. Pronto-socorro é "the emergency room".' },
      ],
    },
    {
      id: 'waiting', place: 'Sala de espera', placeEn: 'In the waiting room', time: '8:25', bg: 'waiting', mood: 0xf3f0ff,
      cast: { left: ['mika', 'nervous'] },
      steps: [
        { who: 'narr', en: 'Mika is sitting in the waiting room. Look! A little boy is sleeping, and an old man is reading a magazine.', pt: 'Mika está sentada na sala de espera. Olha! Um menininho está dormindo, e um senhor está lendo uma revista.' },
        { who: 'mika', emo: 'nervous', en: "I'm a little nervous... but I'm trying to stay calm.", pt: 'Estou um pouco nervosa... mas estou tentando ficar calma.' },
        { quiz: true, q: 'Como Mika diz "Eu me sinto ansiosa"?', opts: ['I feel anxious.', 'I have anxious.', 'My anxious hurts.'], a: 0,
          why: 'Sentimentos são adjetivos: I feel + adjetivo.' },
        { who: 'narr', en: "The boy isn't playing — he's sleeping. The man isn't reading now — he's talking to the nurse.", pt: 'O menino não está brincando — está dormindo. O senhor não está lendo agora — está falando com a enfermeira.' },
        { quiz: true, q: 'Negativa do Present Continuous: "The boy ___ (not / play)."', opts: ["isn't playing", "don't playing", "doesn't play"], a: 0,
          why: 'A negativa do Present Continuous nunca usa don\'t/doesn\'t: só o verbo to be muda (is → isn\'t) e o -ing continua.' },
        { who: 'mika', emo: 'calm', en: 'OK. I feel calm now.', pt: 'Ok. Agora me sinto calma.' },
      ],
    },
    {
      id: 'triage', place: 'Triagem', placeEn: 'With the nurse', time: '8:40', bg: 'triage', mood: 0xeef8ff,
      cast: { left: ['mika', 'sick'], right: ['hana', 'smile'] },
      steps: [
        { who: 'hana', emo: 'smile', en: "Hello, Mika! I'm Hana, the nurse. How are you feeling?", pt: 'Olá, Mika! Eu sou a Hana, a enfermeira. Como você está se sentindo?' },
        { who: 'mika', emo: 'weak', en: 'I feel weak and tired.', pt: 'Eu me sinto fraca e cansada.' },
        { who: 'hana', emo: 'neutral', en: "I'm taking your temperature now...", pt: 'Estou medindo sua temperatura agora...' },
        { who: 'mika', emo: 'fever', en: '...', pt: '(o termômetro está na boca de Mika)' },
        { who: 'hana', emo: 'worried', en: '38.5 °C. You have a fever.', pt: '38,5 °C. Você está com febre.' },
        { quiz: true, q: 'Complete: "Mika ___ a high fever."', opts: ['has', 'have', 'feels'], a: 0,
          why: 'Fever é SUBSTANTIVO → have/has. Com he/she (Mika) usamos HAS.' },
        { who: 'hana', emo: 'smile', en: "Your blood pressure is 120 over 80. That's normal.", pt: 'Sua pressão é 12 por 8. Está normal.' },
        { who: 'hana', emo: 'neutral', en: 'Does anything else hurt?', pt: 'Mais alguma coisa dói?' },
        { quiz: true, q: 'Mika aponta para a garganta. O que ela diz?', opts: ['My throat hurts.', 'My throat hurt.', 'I have throat.'], a: 0,
          why: 'My + parte do corpo + hurts. "Throat" é singular, então o verbo leva -s: hurtS.' },
      ],
    },
    {
      id: 'doctor', place: 'Consulta', placeEn: 'With the doctor', time: '9:05', bg: 'office', mood: 0xfdf3ff,
      cast: { left: ['mika', 'tired'], right: ['sato', 'neutral'] },
      steps: [
        { who: 'sato', emo: 'smile', en: "Hello. What's wrong? How are you feeling?", pt: 'Olá. O que houve? Como você está se sentindo?' },
        { who: 'mika', emo: 'dizzy', en: 'I feel dizzy and tired. My stomach hurts too.', pt: 'Eu me sinto tonta e cansada. Meu estômago também dói.' },
        { who: 'sato', emo: 'neutral', en: 'Do you have a fever?', pt: 'Você está com febre?' },
        { who: 'mika', emo: 'sick', en: 'Yes, I have a slight fever since yesterday.', pt: 'Sim, estou com um pouco de febre desde ontem.' },
        { quiz: true, q: 'Mika também está com dor de garganta. Qual frase usa a estrutura certa?', opts: ['I have a sore throat.', 'I feel a sore throat.', 'I am sore throat.'], a: 0,
          why: '"A sore throat" é um sintoma (substantivo): I have + a/an + sintoma.' },
        { who: 'sato', emo: 'neutral', en: "OK, let's examine you. Does it hurt here?", pt: 'Ok, vamos examinar você. Dói aqui?' },
        { who: 'mika', emo: 'pain', en: 'Yes, a little.', pt: 'Sim, um pouco.' },
        { who: 'sato', emo: 'smile', en: "Don't worry. It's a bad cold. You need to rest and drink a lot of water.", pt: 'Não se preocupe. É um resfriado forte. Você precisa descansar e beber bastante água.' },
        { who: 'sato', emo: 'smile', en: 'Here is a prescription. Take this medicine twice a day.', pt: 'Aqui está uma receita. Tome este remédio duas vezes ao dia.' },
        { quiz: true, q: 'O que é "a prescription"?', opts: ['receita médica', 'injeção', 'consulta marcada'], a: 0,
          why: 'prescription = receita médica · injection = injeção · appointment = consulta marcada.' },
        { who: 'mika', emo: 'relieved', en: 'Thank you, doctor. I feel relieved.', pt: 'Obrigada, doutor. Estou aliviada.' },
      ],
    },
    {
      id: 'pharmacy', place: 'Farmácia', placeEn: 'At the pharmacy', time: '9:40', bg: 'pharmacy', mood: 0xf0fff4,
      cast: { left: ['mika', 'neutral'], right: ['kai', 'smile'] },
      steps: [
        { who: 'kai', emo: 'smile', en: 'Hi! Can I help you?', pt: 'Oi! Posso ajudar?' },
        { quiz: true, q: 'Mika quer pedir ajuda com educação. O que ela diz?', opts: ['Could you help me, please?', 'You help me?', 'Help me you can?'], a: 0,
          why: 'Can/Could + you + verbo...? é o pedido educado. "Could" é ainda mais gentil.' },
        { who: 'mika', emo: 'smile', en: 'Could you help me, please? I have a prescription from the doctor.', pt: 'Você pode me ajudar, por favor? Tenho uma receita do médico.' },
        { who: 'kai', emo: 'neutral', en: 'Here you are. Take one pill in the morning and one at night, after meals.', pt: 'Aqui está. Tome um comprimido de manhã e um à noite, depois das refeições.' },
        { who: 'mika', emo: 'happy', en: 'Thank you so much!', pt: 'Muito obrigada!' },
        { who: 'kai', emo: 'smile', en: "You're welcome. I hope you get better soon!", pt: 'De nada. Espero que você melhore logo!' },
        { quiz: true, q: '"I hope you get better soon" significa:', opts: ['Espero que você melhore logo.', 'Você está pior hoje.', 'Volte amanhã cedo.'], a: 0,
          why: 'to get better = melhorar.' },
      ],
    },
    {
      id: 'home2', place: 'Em casa', placeEn: 'Three days later', time: '3 dias depois', bg: 'living', mood: 0xfff8e8,
      cast: { left: ['mika', 'better'] },
      steps: [
        { who: 'narr', en: "Three days later... Mika is resting at home. Mika isn't sick anymore.", pt: 'Três dias depois... Mika está descansando em casa. Mika não está mais doente.' },
        { who: 'mika', emo: 'better', en: 'I feel much better today!', pt: 'Eu me sinto muito melhor hoje!' },
        { who: 'mika', emo: 'happy', en: "My head doesn't hurt now. I feel happy and healthy.", pt: 'Minha cabeça não dói agora. Eu me sinto feliz e saudável.' },
        { quiz: true, q: 'Revisão final: qual frase está ERRADA?', opts: ['My head hurt.', 'I feel better.', 'I have a cold.'], a: 0,
          why: '"My head" é singular → My head hurtS. As outras estão corretas.' },
        { who: 'narr', en: 'The end! Mika is healthy again. Great job!', pt: 'Fim! Mika está saudável de novo. Ótimo trabalho!' },
      ],
    },
  ];

  // Jogo "Feel, Have ou Hurts?" — inclui o Exercício 1 da aula
  C.fillBank = [
    { s: 'I ___ a terrible headache.', a: 'have', o: ['have', 'feel', 'hurts'] },
    { s: 'My back ___ after a long day at work.', a: 'hurts', o: ['hurts', 'hurt', 'has'] },
    { s: "She ___ sick today — she's staying home.", a: 'feels', o: ['feels', 'feel', 'has'] },
    { s: 'He ___ a sore throat and a cough.', a: 'has', o: ['has', 'have', 'feels'] },
    { s: 'My eyes ___ from reading too much.', a: 'hurt', o: ['hurt', 'hurts', 'have'] },
    { s: 'I ___ really dizzy.', a: 'feel', o: ['feel', 'have', 'hurt'] },
    { s: 'She ___ much better today.', a: 'feels', o: ['feels', 'has', 'hurts'] },
    { s: 'He ___ a high fever.', a: 'has', o: ['has', 'feels', 'have'] },
    { s: 'My stomach ___.', a: 'hurts', o: ['hurts', 'hurt', 'feels'] },
    { s: 'My legs ___ after the trip.', a: 'ache', o: ['ache', 'aches', 'have'] },
    { s: 'I ___ an allergy to pollen.', a: 'have', o: ['have', 'feel', 'has'] },
    { s: 'We ___ worried about Dad\'s health.', a: 'feel', o: ['feel', 'feels', 'have'] },
    { s: 'My tooth ___.', a: 'hurts', o: ['hurts', 'hurt', 'has'] },
    { s: 'The baby ___ a rash on his arm.', a: 'has', o: ['has', 'have', 'feels'] },
    { s: 'I ___ nervous about the surgery.', a: 'feel', o: ['feel', 'have', 'hurt'] },
    { s: 'She ___ high blood pressure.', a: 'has', o: ['has', 'feels', 'have'] },
    { s: 'My ears ___ — the music is too loud!', a: 'hurt', o: ['hurt', 'hurts', 'feel'] },
    { s: 'They ___ relieved after the test results.', a: 'feel', o: ['feel', 'feels', 'have'] },
  ];

  // Jogo "Monte a frase" (Método de Chunking, com a legenda de cores da aula)
  C.chunks = [
    { pt: 'Eu me sinto muito tonto(a).', c: [['I', 'S'], ['feel', 'V'], ['really dizzy.', 'O']] },
    { pt: 'Ela se sente muito melhor hoje.', c: [['She', 'S'], ['feels', 'V'], ['much better', 'O'], ['today.', 'ADV']] },
    { pt: 'Eu estou com uma dor de cabeça terrível.', c: [['I', 'S'], ['have', 'V'], ['a terrible headache.', 'O']] },
    { pt: 'Ele está com febre alta.', c: [['He', 'S'], ['has', 'V'], ['a high fever.', 'O']] },
    { pt: 'Minhas pernas doem depois da viagem.', c: [['My legs', 'S'], ['ache', 'V'], ['after the trip.', 'ADV']] },
    { pt: 'Eu preciso ver um médico.', c: [['I', 'S'], ['need to see', 'V'], ['a doctor.', 'O']] },
    { pt: 'Você pode me ajudar, por favor?', c: [['Can', 'AUX'], ['you', 'S'], ['help', 'V'], ['me, please?', 'O']] },
    { pt: 'A enfermeira está medindo minha temperatura.', c: [['The nurse', 'S'], ['is', 'AUX'], ['taking', 'V'], ['my temperature.', 'O']] },
    { pt: 'Mika não está indo para a escola hoje.', c: [['Mika', 'S'], ["isn't", 'AUX'], ['going', 'V'], ['to school', 'O'], ['today.', 'ADV']] },
    { pt: 'Agora mesmo, o menino está dormindo.', c: [['Right now,', 'ADV'], ['the boy', 'S'], ['is', 'AUX'], ['sleeping.', 'V']] },
    { pt: 'Nós não estamos esperando o médico.', c: [['We', 'S'], ["aren't", 'AUX'], ['waiting for', 'V'], ['the doctor.', 'O']] },
    { pt: 'Meu estômago dói.', c: [['My stomach', 'S'], ['hurts.', 'V']] },
  ];

  C.chunkLegend = { S: 'Sujeito', V: 'Verbo', O: 'Objeto / Complemento', AUX: 'Auxiliar', ADV: 'Advérbio / Tempo' };

  // Jogo "Onde dói?" — partes que existem no corpo da Mika
  C.bodyParts = [
    { part: 'head', en: 'head', pt: 'cabeça' },
    { part: 'eye', en: 'eye', pt: 'olho' },
    { part: 'ear', en: 'ear', pt: 'orelha / ouvido' },
    { part: 'nose', en: 'nose', pt: 'nariz' },
    { part: 'mouth', en: 'tooth', pt: 'dente', say: 'My tooth hurts.' },
    { part: 'throat', en: 'throat', pt: 'garganta' },
    { part: 'chest', en: 'chest', pt: 'peito' },
    { part: 'stomach', en: 'stomach', pt: 'estômago / barriga' },
    { part: 'arm', en: 'arm', pt: 'braço' },
    { part: 'hand', en: 'hand', pt: 'mão' },
    { part: 'leg', en: 'legs', pt: 'pernas', say: 'My legs hurt.' },
    { part: 'foot', en: 'foot', pt: 'pé' },
  ];

  // Emoções da Mika para o jogo "Como a Mika se sente?" e para os flashcards
  C.emotionOf = {
    happy: 'happy', sad: 'sad', tired: 'tired', stressed: 'stressed', anxious: 'anxious', relieved: 'relieved',
    nervous: 'nervous', calm: 'calm', exhausted: 'exhausted', worried: 'worried',
    'sick / ill': 'sick', healthy: 'healthy', weak: 'weak', dizzy: 'dizzy', nauseous: 'nauseous', better: 'better', worse: 'worse',
    'a headache': 'pain', 'a fever': 'fever', 'a sore throat': 'pain', 'a cold': 'sick', 'a cough': 'stressed',
    'a stomachache': 'pain', 'a backache': 'pain', 'an allergy': 'sad', 'a rash': 'worried', 'high/low blood pressure': 'dizzy',
  };

  C.feelingRound = ['happy', 'sad', 'tired', 'stressed', 'anxious', 'relieved', 'nervous', 'calm', 'exhausted', 'worried', 'sick / ill', 'healthy', 'dizzy', 'nauseous', 'better', 'weak'];

  // Ilustração dos flashcards que não usam o rosto da Mika
  C.icons = {
    'a headache': '🤕', 'a fever': '🌡️', 'a sore throat': '🗣️', 'a cold': '🤧', 'a cough': '😮‍💨', 'a stomachache': '🫃',
    'a backache': '🧍', 'an allergy': '🌼', 'a rash': '🔴', 'high/low blood pressure': '🩺',
    head: '🙆', throat: '🗣️', stomach: '🫃', back: '🧍', arm: '💪', 'leg(s)': '🦵', chest: '🫁', ear: '👂', 'eye(s)': '👀',
    'tooth / teeth': '🦷', hair: '💇', face: '🙂', nose: '👃', mouth: '👄', hand: '✋', 'foot / feet': '🦶', finger: '☝️', toe: '🦶', heart: '❤️',
    'the emergency room': '🚑', 'the waiting room': '🪑', 'the receptionist': '💁', 'the nurse': '🧑‍⚕️', 'the doctor': '🩺',
    'a prescription': '📝', 'an appointment': '📅', 'an injection': '💉', medicine: '💊', 'to get better': '🌈', hospital: '🏥',
    'hello / hi': '👋', 'goodbye / bye': '👋', please: '🙏', 'thank you / thanks': '💖', sorry: '🙇', 'excuse me': '🙋', 'yes / no': '👍',
    'good morning': '🌅', 'good afternoon': '☀️', 'good evening': '🌆', 'good night': '🌙', 'how are you?': '💬',
    "I'm fine, thank you": '😊', 'nice to meet you': '🤝', "what's your name?": '❓', 'my name is...': '📛', 'see you later': '👀', welcome: '🎀',
  };

  window.CONTENT = C;
})();

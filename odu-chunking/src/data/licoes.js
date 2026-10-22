/**
 * Aulas no formato do Template Padrão ODU Creative.
 *
 * Cada frase é escrita em blocos: "categoria:texto|categoria:texto".
 * Categorias: 0 Expressão · 1 Sujeito · 2 Tempo · 3 Lugar · 4 Objeto · 5 Verbo.
 * A ordem dos blocos é a ordem natural de cada idioma, então a mesma cor
 * aparece em posições diferentes (ex.: o verbo em 2º lugar no alemão).
 * `p` é a pontuação final; ¿ ¡ e o espaço francês são aplicados na exibição.
 */
export const LICOES = [
  {
    id: 'l01',
    titulo: 'Apresentações',
    tema: 'Dizer quem você é e de onde vem',
    nivel: 'Iniciante',
    objetivos: {
      reconhecimento: 'Identificar o bloco do verbo ser/chamar-se nos quatro idiomas.',
      aplicacao: 'Apresentar-se com nome, origem e idade.',
      comunicacao: 'Participar de uma troca curta de apresentações.',
    },
    ponto: {
      nome: 'Ser, chamar-se e a idade',
      forma: {
        en: 'I + am + origem · I + am + idade + years old',
        fr: "Je + suis + origem · J' + ai + idade + ans",
        de: 'Ich + komme + aus … · Ich + bin + idade + Jahre alt',
        es: 'Yo + soy + de … · Yo + tengo + idade + años',
      },
      funcao: 'Apresentar identidade, origem e idade.',
      uso: 'A idade usa "ser" no inglês e no alemão, mas "ter" no francês e no espanhol, como no português.',
    },
    scaffold: [
      { rotulo: 'Núcleo da ação', pt: 'moro', b: { en: '5:live', fr: '5:vis', de: '5:wohne', es: '5:vivo' } },
      {
        rotulo: '+ Destino',
        pt: 'moro em São Paulo',
        b: {
          en: '5:live|3:in São Paulo',
          fr: '5:vis|3:à São Paulo',
          de: '5:wohne|3:in São Paulo',
          es: '5:vivo|3:en São Paulo',
        },
      },
      {
        rotulo: '+ Sujeito',
        pt: 'eu moro em São Paulo',
        b: {
          en: '1:I|5:live|3:in São Paulo',
          fr: '1:je|5:vis|3:à São Paulo',
          de: '1:ich|5:wohne|3:in São Paulo',
          es: '1:yo|5:vivo|3:en São Paulo',
        },
      },
      {
        rotulo: '+ Tempo',
        pt: 'agora eu moro em São Paulo',
        b: {
          en: '1:I|5:live|3:in São Paulo|2:now',
          fr: '2:maintenant|1:je|5:vis|3:à São Paulo',
          de: '2:jetzt|5:wohne|1:ich|3:in São Paulo',
          es: '2:ahora|1:yo|5:vivo|3:en São Paulo',
        },
      },
    ],
    frases: [
      {
        id: 'l01f1',
        pt: 'Meu nome é Ana.',
        p: '.',
        b: {
          en: '1:my name|5:is|4:Ana',
          fr: "1:je|5:m'appelle|4:Ana",
          de: '1:mein Name|5:ist|4:Ana',
          es: '5:me llamo|4:Ana',
        },
      },
      {
        id: 'l01f2',
        pt: 'Eu sou do Brasil.',
        p: '.',
        b: {
          en: '1:I|5:am|3:from Brazil',
          fr: '1:je|5:suis|3:du Brésil',
          de: '1:ich|5:komme|3:aus Brasilien',
          es: '1:yo|5:soy|3:de Brasil',
        },
      },
      {
        id: 'l01f3',
        pt: 'Eu falo um pouco de francês.',
        p: '.',
        b: {
          en: '1:I|5:speak|4:a little French',
          fr: '1:je|5:parle|4:un peu français',
          de: '1:ich|5:spreche|4:ein bisschen Französisch',
          es: '1:yo|5:hablo|4:un poco de francés',
        },
      },
      {
        id: 'l01f4',
        pt: 'Eu tenho vinte anos.',
        p: '.',
        b: {
          en: '1:I|5:am|4:twenty years old',
          fr: "1:j'|5:ai|4:vingt ans",
          de: '1:ich|5:bin|4:zwanzig Jahre alt',
          es: '1:yo|5:tengo|4:veinte años',
        },
      },
    ],
    dialogo: [
      {
        falante: 'A',
        pt: 'Como você se chama?',
        p: '?',
        b: {
          en: '4:what|5:is|1:your name',
          fr: "1:tu|5:t'appelles|4:comment",
          de: '4:wie|5:heißt|1:du',
          es: '4:cómo|5:te llamas',
        },
      },
      {
        falante: 'B',
        pt: 'Meu nome é Ana.',
        p: '.',
        b: {
          en: '1:my name|5:is|4:Ana',
          fr: "1:je|5:m'appelle|4:Ana",
          de: '1:mein Name|5:ist|4:Ana',
          es: '5:me llamo|4:Ana',
        },
      },
      {
        falante: 'A',
        pt: 'De onde você é?',
        p: '?',
        b: {
          en: '3:where|5:are|1:you|3:from',
          fr: "1:tu|5:viens|3:d'où",
          de: '3:woher|5:kommst|1:du',
          es: '3:de dónde|5:eres',
        },
      },
      {
        falante: 'B',
        pt: 'Eu sou do Brasil.',
        p: '.',
        b: {
          en: '1:I|5:am|3:from Brazil',
          fr: '1:je|5:suis|3:du Brésil',
          de: '1:ich|5:komme|3:aus Brasilien',
          es: '1:yo|5:soy|3:de Brasil',
        },
      },
    ],
    erros: [
      {
        lang: 'en',
        errado: 'I have twenty years.',
        certo: 'I am twenty years old.',
        nota: 'O português usa "ter" para idade; o inglês usa "be" (ser/estar) e fecha com "years old".',
      },
      {
        lang: 'de',
        errado: 'Ich habe zwanzig Jahre.',
        certo: 'Ich bin zwanzig Jahre alt.',
        nota: 'O alemão segue o inglês: idade com "sein" (bin) e "Jahre alt" no fim.',
      },
    ],
    drill: {
      frase: 'l01f2',
      bloco: 3,
      opcoes: [
        { pt: 'de Portugal', en: 'from Portugal', fr: 'du Portugal', de: 'aus Portugal', es: 'de Portugal' },
        { pt: 'da França', en: 'from France', fr: 'de France', de: 'aus Frankreich', es: 'de Francia' },
        { pt: 'da Alemanha', en: 'from Germany', fr: "d'Allemagne", de: 'aus Deutschland', es: 'de Alemania' },
        { pt: 'do Japão', en: 'from Japan', fr: 'du Japon', de: 'aus Japan', es: 'de Japón' },
      ],
    },
  },
  {
    id: 'l02',
    titulo: 'Rotina',
    tema: 'Falar do dia a dia com tempo e lugar',
    nivel: 'Iniciante',
    objetivos: {
      reconhecimento: 'Identificar a ordem básica da frase em cada idioma.',
      aplicacao: 'Utilizar blocos de tempo e lugar no presente.',
      comunicacao: 'Descrever a própria rotina em uma conversa curta.',
    },
    ponto: {
      nome: 'Presente e a posição do tempo',
      forma: {
        en: 'Sujeito + Verbo + Objeto + Lugar + Tempo',
        fr: 'Tempo + Sujeito + Verbo + Objeto + Lugar',
        de: 'Tempo + VERBO + Sujeito + Lugar + Objeto',
        es: 'Tempo + (Sujeito) + Verbo + Objeto + Lugar',
      },
      funcao: 'Descrever hábitos e ações frequentes.',
      uso: 'No alemão o verbo ocupa sempre a 2ª posição: se a frase começa pelo tempo, o sujeito vem depois do verbo.',
    },
    scaffold: [
      { rotulo: 'Núcleo da ação', pt: 'estudo', b: { en: '5:study', fr: '5:étudie', de: '5:lerne', es: '5:estudio' } },
      {
        rotulo: '+ Objeto e lugar',
        pt: 'estudo línguas na escola',
        b: {
          en: '5:study|4:languages|3:at school',
          fr: "5:étudie|4:les langues|3:à l'école",
          de: '5:lerne|3:in der Schule|4:Sprachen',
          es: '5:estudio|4:idiomas|3:en la escuela',
        },
      },
      {
        rotulo: '+ Sujeito',
        pt: 'eu estudo línguas na escola',
        b: {
          en: '1:I|5:study|4:languages|3:at school',
          fr: "1:j'|5:étudie|4:les langues|3:à l'école",
          de: '1:ich|5:lerne|3:in der Schule|4:Sprachen',
          es: '1:yo|5:estudio|4:idiomas|3:en la escuela',
        },
      },
      {
        rotulo: '+ Tempo',
        pt: 'hoje eu estudo línguas na escola',
        b: {
          en: '1:I|5:study|4:languages|3:at school|2:today',
          fr: "2:aujourd'hui|1:j'|5:étudie|4:les langues|3:à l'école",
          de: '2:heute|5:lerne|1:ich|3:in der Schule|4:Sprachen',
          es: '2:hoy|1:yo|5:estudio|4:idiomas|3:en la escuela',
        },
      },
    ],
    frases: [
      {
        id: 'l02f1',
        pt: 'Hoje eu estudo línguas na escola.',
        p: '.',
        b: {
          en: '1:I|5:study|4:languages|3:at school|2:today',
          fr: "2:aujourd'hui|1:j'|5:étudie|4:les langues|3:à l'école",
          de: '2:heute|5:lerne|1:ich|3:in der Schule|4:Sprachen',
          es: '2:hoy|1:yo|5:estudio|4:idiomas|3:en la escuela',
        },
      },
      {
        id: 'l02f2',
        pt: 'Eu trabalho em casa todos os dias.',
        p: '.',
        b: {
          en: '1:I|5:work|3:from home|2:every day',
          fr: '1:je|5:travaille|3:à la maison|2:tous les jours',
          de: '1:ich|5:arbeite|2:jeden Tag|3:zu Hause',
          es: '1:yo|5:trabajo|3:en casa|2:todos los días',
        },
      },
      {
        id: 'l02f3',
        pt: 'De manhã, eu bebo café.',
        p: '.',
        b: {
          en: '2:in the morning|1:I|5:drink|4:coffee',
          fr: '2:le matin|1:je|5:bois|4:du café',
          de: '2:morgens|5:trinke|1:ich|4:Kaffee',
          es: '2:por la mañana|1:yo|5:bebo|4:café',
        },
      },
      {
        id: 'l02f4',
        pt: 'Ela lê um livro no parque.',
        p: '.',
        b: {
          en: '1:she|5:reads|4:a book|3:in the park',
          fr: '1:elle|5:lit|4:un livre|3:dans le parc',
          de: '1:sie|5:liest|4:ein Buch|3:im Park',
          es: '1:ella|5:lee|4:un libro|3:en el parque',
        },
      },
      {
        id: 'l02f5',
        pt: 'Nós jantamos às oito.',
        p: '.',
        b: {
          en: '1:we|5:have dinner|2:at eight',
          fr: '1:nous|5:dînons|2:à huit heures',
          de: '1:wir|5:essen|2:um acht Uhr|4:zu Abend',
          es: '1:nosotros|5:cenamos|2:a las ocho',
        },
      },
    ],
    dialogo: [
      {
        falante: 'A',
        pt: 'O que você faz de manhã?',
        p: '?',
        b: {
          en: '4:what|5:do|1:you|5:do|2:in the morning',
          fr: "4:qu'est-ce que|1:tu|5:fais|2:le matin",
          de: '4:was|5:machst|1:du|2:morgens',
          es: '4:qué|5:haces|2:por la mañana',
        },
      },
      {
        falante: 'B',
        pt: 'De manhã, eu bebo café.',
        p: '.',
        b: {
          en: '2:in the morning|1:I|5:drink|4:coffee',
          fr: '2:le matin|1:je|5:bois|4:du café',
          de: '2:morgens|5:trinke|1:ich|4:Kaffee',
          es: '2:por la mañana|1:yo|5:bebo|4:café',
        },
      },
      {
        falante: 'A',
        pt: 'Onde você trabalha?',
        p: '?',
        b: {
          en: '3:where|5:do|1:you|5:work',
          fr: '1:tu|5:travailles|3:où',
          de: '3:wo|5:arbeitest|1:du',
          es: '3:dónde|5:trabajas',
        },
      },
      {
        falante: 'B',
        pt: 'Eu trabalho em casa todos os dias.',
        p: '.',
        b: {
          en: '1:I|5:work|3:from home|2:every day',
          fr: '1:je|5:travaille|3:à la maison|2:tous les jours',
          de: '1:ich|5:arbeite|2:jeden Tag|3:zu Hause',
          es: '1:yo|5:trabajo|3:en casa|2:todos los días',
        },
      },
    ],
    erros: [
      {
        lang: 'de',
        errado: 'Heute ich lerne Deutsch.',
        certo: 'Heute lerne ich Deutsch.',
        nota: 'Regra V2: o verbo é sempre o 2º bloco. Se o tempo abre a frase, o sujeito passa para depois do verbo.',
      },
      {
        lang: 'en',
        errado: 'She work at home.',
        certo: 'She works at home.',
        nota: 'No presente, he/she/it pede -s no verbo. O português não marca isso da mesma forma.',
      },
      {
        lang: 'fr',
        errado: 'Je bois café.',
        certo: 'Je bois du café.',
        nota: 'O francês exige artigo partitivo (du, de la) com quantidades indefinidas, onde o português não usa nada.',
      },
    ],
    drill: {
      frase: 'l02f3',
      bloco: 4,
      opcoes: [
        { pt: 'chá', en: 'tea', fr: 'du thé', de: 'Tee', es: 'té' },
        { pt: 'suco', en: 'juice', fr: 'du jus', de: 'Saft', es: 'jugo' },
        { pt: 'água', en: 'water', fr: "de l'eau", de: 'Wasser', es: 'agua' },
        { pt: 'leite', en: 'milk', fr: 'du lait', de: 'Milch', es: 'leche' },
      ],
    },
  },
  {
    id: 'l03',
    titulo: 'No café',
    tema: 'Pedir com educação e pagar',
    nivel: 'Iniciante',
    objetivos: {
      reconhecimento: 'Reconhecer a moldura de pedido educado em cada idioma.',
      aplicacao: 'Trocar o bloco do objeto sem quebrar a estrutura.',
      comunicacao: 'Fazer um pedido completo e pedir a conta.',
    },
    ponto: {
      nome: 'Moldura de pedido educado',
      forma: {
        en: 'I + would like + objeto',
        fr: 'Je + voudrais + objeto',
        de: 'Ich + hätte gern + objeto (acusativo)',
        es: '(Yo) + quisiera + objeto',
      },
      funcao: 'Pedir algo de forma cortês.',
      uso: 'Aprenda a moldura inteira como um bloco só e troque apenas o objeto. No alemão, o objeto masculino vira "einen".',
    },
    scaffold: [
      {
        rotulo: 'Núcleo da ação',
        pt: 'gostaria',
        b: { en: '5:would like', fr: '5:voudrais', de: '5:hätte gern', es: '5:quisiera' },
      },
      {
        rotulo: '+ Objeto',
        pt: 'gostaria de um café',
        b: {
          en: '5:would like|4:a coffee',
          fr: '5:voudrais|4:un café',
          de: '5:hätte gern|4:einen Kaffee',
          es: '5:quisiera|4:un café',
        },
      },
      {
        rotulo: '+ Sujeito',
        pt: 'eu gostaria de um café',
        b: {
          en: '1:I|5:would like|4:a coffee',
          fr: '1:je|5:voudrais|4:un café',
          de: '1:ich|5:hätte gern|4:einen Kaffee',
          es: '1:yo|5:quisiera|4:un café',
        },
      },
      {
        rotulo: '+ Cortesia',
        pt: 'eu gostaria de um café, por favor',
        b: {
          en: '1:I|5:would like|4:a coffee|0:, please',
          fr: "1:je|5:voudrais|4:un café|0:, s'il vous plaît",
          de: '1:ich|5:hätte gern|4:einen Kaffee|0:, bitte',
          es: '1:yo|5:quisiera|4:un café|0:, por favor',
        },
      },
    ],
    frases: [
      {
        id: 'l03f1',
        pt: 'Eu gostaria de um café, por favor.',
        p: '.',
        b: {
          en: '1:I|5:would like|4:a coffee|0:, please',
          fr: "1:je|5:voudrais|4:un café|0:, s'il vous plaît",
          de: '1:ich|5:hätte gern|4:einen Kaffee|0:, bitte',
          es: '1:yo|5:quisiera|4:un café|0:, por favor',
        },
      },
      {
        id: 'l03f2',
        pt: 'Quanto custa?',
        p: '?',
        b: {
          en: '4:how much|5:is|1:it',
          fr: '4:combien|1:ça|5:coûte',
          de: '4:wie viel|5:kostet|1:das',
          es: '4:cuánto|5:cuesta',
        },
      },
      {
        id: 'l03f3',
        pt: 'Você pode me trazer a conta?',
        p: '?',
        b: {
          en: '5:can|1:you|5:bring|4:me|4:the bill',
          fr: "1:vous|5:pouvez|5:m'apporter|4:l'addition",
          de: '5:können|1:Sie|4:mir|4:die Rechnung|5:bringen',
          es: '4:me|5:puede|5:traer|4:la cuenta',
        },
      },
      {
        id: 'l03f4',
        pt: 'Eu quero um copo de água.',
        p: '.',
        b: {
          en: '1:I|5:want|4:a glass of water',
          fr: "1:je|5:veux|4:un verre d'eau",
          de: '1:ich|5:möchte|4:ein Glas Wasser',
          es: '1:yo|5:quiero|4:un vaso de agua',
        },
      },
      {
        id: 'l03f5',
        pt: 'Uma mesa para dois, por favor.',
        p: '.',
        b: {
          en: '4:a table|4:for two|0:, please',
          fr: "4:une table|4:pour deux|0:, s'il vous plaît",
          de: '4:einen Tisch|4:für zwei|0:, bitte',
          es: '4:una mesa|4:para dos|0:, por favor',
        },
      },
    ],
    dialogo: [
      {
        falante: 'A',
        pt: 'O que você deseja?',
        p: '?',
        b: {
          en: '4:what|5:would|1:you|5:like',
          fr: "4:qu'est-ce que|1:vous|5:désirez",
          de: '4:was|5:möchten|1:Sie',
          es: '4:qué|5:desea',
        },
      },
      {
        falante: 'B',
        pt: 'Eu gostaria de um café, por favor.',
        p: '.',
        b: {
          en: '1:I|5:would like|4:a coffee|0:, please',
          fr: "1:je|5:voudrais|4:un café|0:, s'il vous plaît",
          de: '1:ich|5:hätte gern|4:einen Kaffee|0:, bitte',
          es: '1:yo|5:quisiera|4:un café|0:, por favor',
        },
      },
      {
        falante: 'A',
        pt: 'Mais alguma coisa?',
        p: '?',
        b: { en: '0:anything else', fr: '0:et avec ceci', de: '0:sonst noch etwas', es: '0:algo más' },
      },
      {
        falante: 'B',
        pt: 'Não, obrigado. Quanto custa?',
        p: '?',
        b: {
          en: '0:no, thanks.|4:how much|5:is|1:it',
          fr: '0:non, merci.|4:combien|1:ça|5:coûte',
          de: '0:nein, danke.|4:wie viel|5:kostet|1:das',
          es: '0:no, gracias.|4:cuánto|5:cuesta',
        },
      },
    ],
    erros: [
      {
        lang: 'en',
        errado: 'Can you bring me the account?',
        certo: 'Can you bring me the bill?',
        nota: 'Falso cognato: "account" é conta bancária. No restaurante é "bill" (ou "check" nos EUA).',
      },
      {
        lang: 'de',
        errado: 'Ich hätte gern ein Kaffee.',
        certo: 'Ich hätte gern einen Kaffee.',
        nota: '"Kaffee" é masculino e está no acusativo (objeto): "ein" vira "einen".',
      },
      {
        lang: 'es',
        errado: 'Quiero un copo de agua.',
        certo: 'Quiero un vaso de agua.',
        nota: 'Falso amigo: "copa" é taça. O copo comum se chama "vaso".',
      },
      {
        lang: 'fr',
        errado: "Je voudrais un verre de l'eau.",
        certo: "Je voudrais un verre d'eau.",
        nota: 'Depois de uma quantidade (un verre, une bouteille) usa-se só "de", sem artigo.',
      },
    ],
    drill: {
      frase: 'l03f1',
      bloco: 4,
      opcoes: [
        { pt: 'um chá', en: 'a tea', fr: 'un thé', de: 'einen Tee', es: 'un té' },
        {
          pt: 'uma garrafa de água',
          en: 'a bottle of water',
          fr: "une bouteille d'eau",
          de: 'eine Flasche Wasser',
          es: 'una botella de agua',
        },
        { pt: 'um croissant', en: 'a croissant', fr: 'un croissant', de: 'ein Croissant', es: 'un cruasán' },
        { pt: 'uma salada', en: 'a salad', fr: 'une salade', de: 'einen Salat', es: 'una ensalada' },
      ],
    },
  },
  {
    id: 'l04',
    titulo: 'Lugares',
    tema: 'Perguntar onde fica e dizer o que existe',
    nivel: 'Iniciante',
    objetivos: {
      reconhecimento: 'Identificar o bloco existencial: there is, il y a, es gibt, hay.',
      aplicacao: 'Localizar lugares com blocos de destino.',
      comunicacao: 'Pedir e entender uma direção simples.',
    },
    ponto: {
      nome: 'Existência e localização',
      forma: {
        en: 'There is + objeto + lugar',
        fr: 'Il y a + objeto + lugar',
        de: 'Es gibt + objeto (acusativo) + lugar',
        es: 'Hay + objeto + lugar',
      },
      funcao: 'Dizer que algo existe em um lugar.',
      uso: 'O "tem" existencial do português não se traduz por "have": cada idioma tem um bloco fixo próprio.',
    },
    scaffold: [
      { rotulo: 'Núcleo da ação', pt: 'tem', b: { en: '5:there is', fr: '5:il y a', de: '1:es|5:gibt', es: '5:hay' } },
      {
        rotulo: '+ Objeto',
        pt: 'tem uma feira',
        b: {
          en: '5:there is|4:a market',
          fr: '5:il y a|4:un marché',
          de: '1:es|5:gibt|4:einen Markt',
          es: '5:hay|4:un mercado',
        },
      },
      {
        rotulo: '+ Lugar',
        pt: 'tem uma feira na praça',
        b: {
          en: '5:there is|4:a market|3:in the square',
          fr: '5:il y a|4:un marché|3:sur la place',
          de: '1:es|5:gibt|4:einen Markt|3:auf dem Platz',
          es: '5:hay|4:un mercado|3:en la plaza',
        },
      },
      {
        rotulo: '+ Tempo',
        pt: 'aos domingos tem uma feira na praça',
        b: {
          en: '2:on Sundays|5:there is|4:a market|3:in the square',
          fr: '2:le dimanche|5:il y a|4:un marché|3:sur la place',
          de: '2:sonntags|5:gibt|1:es|4:einen Markt|3:auf dem Platz',
          es: '2:los domingos|5:hay|4:un mercado|3:en la plaza',
        },
      },
    ],
    frases: [
      {
        id: 'l04f1',
        pt: 'Aos domingos tem uma feira na praça.',
        p: '.',
        b: {
          en: '2:on Sundays|5:there is|4:a market|3:in the square',
          fr: '2:le dimanche|5:il y a|4:un marché|3:sur la place',
          de: '2:sonntags|5:gibt|1:es|4:einen Markt|3:auf dem Platz',
          es: '2:los domingos|5:hay|4:un mercado|3:en la plaza',
        },
      },
      {
        id: 'l04f2',
        pt: 'Onde fica a estação?',
        p: '?',
        b: {
          en: '3:where|5:is|1:the station',
          fr: '3:où|5:est|1:la gare',
          de: '3:wo|5:ist|1:der Bahnhof',
          es: '3:dónde|5:está|1:la estación',
        },
      },
      {
        id: 'l04f3',
        pt: 'Tem um banco perto daqui?',
        p: '?',
        b: {
          en: '5:is there|4:a bank|3:near here',
          fr: "5:il y a|4:une banque|3:près d'ici",
          de: '5:gibt|1:es|4:eine Bank|3:hier in der Nähe',
          es: '5:hay|4:un banco|3:cerca de aquí',
        },
      },
      {
        id: 'l04f4',
        pt: 'Vire à esquerda na segunda rua.',
        p: '.',
        b: {
          en: '5:turn|3:left|3:at the second street',
          fr: '5:tournez|3:à gauche|3:à la deuxième rue',
          de: '5:biegen|1:Sie|3:an der zweiten Straße|3:links|5:ab',
          es: '5:gire|3:a la izquierda|3:en la segunda calle',
        },
      },
      {
        id: 'l04f5',
        pt: 'O hotel fica ao lado do museu.',
        p: '.',
        b: {
          en: '1:the hotel|5:is|3:next to the museum',
          fr: "1:l'hôtel|5:est|3:à côté du musée",
          de: '1:das Hotel|5:ist|3:neben dem Museum',
          es: '1:el hotel|5:está|3:al lado del museo',
        },
      },
    ],
    dialogo: [
      {
        falante: 'A',
        pt: 'Tem um banco perto daqui?',
        p: '?',
        b: {
          en: '5:is there|4:a bank|3:near here',
          fr: "5:il y a|4:une banque|3:près d'ici",
          de: '5:gibt|1:es|4:eine Bank|3:hier in der Nähe',
          es: '5:hay|4:un banco|3:cerca de aquí',
        },
      },
      {
        falante: 'B',
        pt: 'Sim, ao lado do museu.',
        p: '.',
        b: {
          en: '0:yes,|3:next to the museum',
          fr: '0:oui,|3:à côté du musée',
          de: '0:ja,|3:neben dem Museum',
          es: '0:sí,|3:al lado del museo',
        },
      },
      {
        falante: 'A',
        pt: 'Obrigado!',
        p: '!',
        b: { en: '0:thank you', fr: '0:merci', de: '0:danke', es: '0:gracias' },
      },
    ],
    erros: [
      {
        lang: 'en',
        errado: 'Have a bank near here?',
        certo: 'Is there a bank near here?',
        nota: 'O "tem" de existência vira o bloco fixo "there is / is there", nunca "have".',
      },
      {
        lang: 'es',
        errado: 'El hotel es al lado del museo.',
        certo: 'El hotel está al lado del museo.',
        nota: 'Localização usa "estar", mesmo para coisas permanentes como prédios.',
      },
      {
        lang: 'de',
        errado: 'Biegen Sie ab links.',
        certo: 'Biegen Sie links ab.',
        nota: 'Verbo separável: o prefixo "ab" vai para o fim da frase e fecha o bloco verbal.',
      },
    ],
    drill: {
      frase: 'l04f2',
      bloco: 1,
      opcoes: [
        { pt: 'o museu', en: 'the museum', fr: 'le musée', de: 'das Museum', es: 'el museo' },
        { pt: 'a farmácia', en: 'the pharmacy', fr: 'la pharmacie', de: 'die Apotheke', es: 'la farmacia' },
        { pt: 'o hotel', en: 'the hotel', fr: "l'hôtel", de: 'das Hotel', es: 'el hotel' },
        { pt: 'a praia', en: 'the beach', fr: 'la plage', de: 'der Strand', es: 'la playa' },
      ],
    },
  },
  {
    id: 'l05',
    titulo: 'Planos',
    tema: 'Falar do futuro próximo e fazer convites',
    nivel: 'Iniciante',
    objetivos: {
      reconhecimento: 'Reconhecer o bloco de futuro próximo em cada idioma.',
      aplicacao: 'Combinar tempo, destino e intenção.',
      comunicacao: 'Fazer e aceitar um convite.',
    },
    ponto: {
      nome: 'Futuro próximo',
      forma: {
        en: 'I + am going to + verbo',
        fr: 'Je + vais + infinitivo',
        de: 'Tempo + VERBO no presente + Sujeito',
        es: '(Yo) + voy a + infinitivo',
      },
      funcao: 'Falar de planos e intenções.',
      uso: 'O alemão costuma usar o presente com um marcador de tempo (morgen, am Samstag) em vez de um futuro.',
    },
    scaffold: [
      {
        rotulo: 'Núcleo da ação',
        pt: 'vou viajar',
        b: { en: '5:am going to|5:travel', fr: '5:vais|5:voyager', de: '5:fahre', es: '5:voy a|5:viajar' },
      },
      {
        rotulo: '+ Destino',
        pt: 'vou viajar para Berlim',
        b: {
          en: '5:am going to|5:travel|3:to Berlin',
          fr: '5:vais|5:voyager|3:à Berlin',
          de: '5:fahre|3:nach Berlin',
          es: '5:voy a|5:viajar|3:a Berlín',
        },
      },
      {
        rotulo: '+ Sujeito',
        pt: 'eu vou viajar para Berlim',
        b: {
          en: '1:I|5:am going to|5:travel|3:to Berlin',
          fr: '1:je|5:vais|5:voyager|3:à Berlin',
          de: '1:ich|5:fahre|3:nach Berlin',
          es: '1:yo|5:voy a|5:viajar|3:a Berlín',
        },
      },
      {
        rotulo: '+ Tempo',
        pt: 'amanhã eu vou viajar para Berlim',
        b: {
          en: '1:I|5:am going to|5:travel|3:to Berlin|2:tomorrow',
          fr: '2:demain|1:je|5:vais|5:voyager|3:à Berlin',
          de: '2:morgen|5:fahre|1:ich|3:nach Berlin',
          es: '2:mañana|1:yo|5:voy a|5:viajar|3:a Berlín',
        },
      },
    ],
    frases: [
      {
        id: 'l05f1',
        pt: 'Amanhã eu vou viajar para Berlim.',
        p: '.',
        b: {
          en: '1:I|5:am going to|5:travel|3:to Berlin|2:tomorrow',
          fr: '2:demain|1:je|5:vais|5:voyager|3:à Berlin',
          de: '2:morgen|5:fahre|1:ich|3:nach Berlin',
          es: '2:mañana|1:yo|5:voy a|5:viajar|3:a Berlín',
        },
      },
      {
        id: 'l05f2',
        pt: 'Você quer ir ao cinema hoje à noite?',
        p: '?',
        b: {
          en: '5:do|1:you|5:want to go|3:to the cinema|2:tonight',
          fr: '1:tu|5:veux|5:aller|3:au cinéma|2:ce soir',
          de: '5:willst|1:du|2:heute Abend|3:ins Kino|5:gehen',
          es: '5:quieres|5:ir|3:al cine|2:esta noche',
        },
      },
      {
        id: 'l05f3',
        pt: 'No sábado nós vamos visitar meus avós.',
        p: '.',
        b: {
          en: '2:on Saturday|1:we|5:are going to|5:visit|4:my grandparents',
          fr: '2:samedi|1:nous|5:allons|5:rendre visite|4:à mes grands-parents',
          de: '2:am Samstag|5:besuchen|1:wir|4:meine Großeltern',
          es: '2:el sábado|5:vamos a|5:visitar|4:a mis abuelos',
        },
      },
      {
        id: 'l05f4',
        pt: 'Eu vou estudar hoje à noite.',
        p: '.',
        b: {
          en: '1:I|5:am going to|5:study|2:tonight',
          fr: '1:je|5:vais|5:étudier|2:ce soir',
          de: '1:ich|5:lerne|2:heute Abend',
          es: '1:yo|5:voy a|5:estudiar|2:esta noche',
        },
      },
    ],
    dialogo: [
      {
        falante: 'A',
        pt: 'Você quer ir ao cinema hoje à noite?',
        p: '?',
        b: {
          en: '5:do|1:you|5:want to go|3:to the cinema|2:tonight',
          fr: '1:tu|5:veux|5:aller|3:au cinéma|2:ce soir',
          de: '5:willst|1:du|2:heute Abend|3:ins Kino|5:gehen',
          es: '5:quieres|5:ir|3:al cine|2:esta noche',
        },
      },
      {
        falante: 'B',
        pt: 'Sim, boa ideia!',
        p: '!',
        b: { en: '0:yes,|0:good idea', fr: '0:oui,|0:bonne idée', de: '0:ja,|0:gute Idee', es: '0:sí,|0:buena idea' },
      },
      {
        falante: 'A',
        pt: 'Até mais tarde!',
        p: '!',
        b: { en: '0:see you later', fr: '0:à plus tard', de: '0:bis später', es: '0:hasta luego' },
      },
    ],
    erros: [
      {
        lang: 'en',
        errado: 'I go to travel tomorrow.',
        certo: "I'm going to travel tomorrow.",
        nota: '"Vou viajar" é um bloco de futuro: "be going to" + verbo. "I go" é presente.',
      },
      {
        lang: 'de',
        errado: 'Morgen ich werde fahren nach Berlin.',
        certo: 'Morgen fahre ich nach Berlin.',
        nota: 'Use o presente com marcador de tempo e mantenha o verbo na 2ª posição.',
      },
      {
        lang: 'es',
        errado: 'Voy viajar a Berlín.',
        certo: 'Voy a viajar a Berlín.',
        nota: 'O bloco de futuro do espanhol é "ir a" + infinitivo. O "a" não pode faltar.',
      },
      {
        lang: 'fr',
        errado: 'Je vais à voyager.',
        certo: 'Je vais voyager.',
        nota: 'No francês o infinitivo vem logo depois de "aller", sem preposição.',
      },
    ],
    drill: {
      frase: 'l05f1',
      bloco: 3,
      opcoes: [
        { pt: 'para Paris', en: 'to Paris', fr: 'à Paris', de: 'nach Paris', es: 'a París' },
        { pt: 'para a praia', en: 'to the beach', fr: 'à la plage', de: 'an den Strand', es: 'a la playa' },
        { pt: 'para Madri', en: 'to Madrid', fr: 'à Madrid', de: 'nach Madrid', es: 'a Madrid' },
        { pt: 'para a Suíça', en: 'to Switzerland', fr: 'en Suisse', de: 'in die Schweiz', es: 'a Suiza' },
      ],
    },
  },
  {
    id: 'l06',
    titulo: 'Ontem',
    tema: 'Contar o que aconteceu',
    nivel: 'Iniciante',
    objetivos: {
      reconhecimento: 'Identificar o bloco verbal do passado e onde ele se divide.',
      aplicacao: 'Montar frases no passado com tempo e lugar.',
      comunicacao: 'Perguntar e contar o que alguém fez.',
    },
    ponto: {
      nome: 'Passado em blocos',
      forma: {
        en: 'Sujeito + verbo no passado (did + base na pergunta)',
        fr: 'Sujeito + avoir/être + particípio',
        de: 'haben/sein … + particípio NO FIM (Satzklammer)',
        es: 'Sujeito + pretérito indefinido',
      },
      funcao: 'Narrar ações concluídas.',
      uso: 'No alemão o bloco verbal se abre em dois: o auxiliar fica na 2ª posição e o particípio fecha a frase.',
    },
    scaffold: [
      {
        rotulo: 'Núcleo da ação',
        pt: 'comi',
        b: { en: '5:ate', fr: '5:ai mangé', de: '5:habe|5:gegessen', es: '5:comí' },
      },
      {
        rotulo: '+ Objeto',
        pt: 'comi pizza',
        b: { en: '5:ate|4:pizza', fr: '5:ai mangé|4:une pizza', de: '5:habe|4:Pizza|5:gegessen', es: '5:comí|4:pizza' },
      },
      {
        rotulo: '+ Sujeito e lugar',
        pt: 'eu comi pizza em casa',
        b: {
          en: '1:I|5:ate|4:pizza|3:at home',
          fr: "1:j'|5:ai mangé|4:une pizza|3:à la maison",
          de: '1:ich|5:habe|3:zu Hause|4:Pizza|5:gegessen',
          es: '1:yo|5:comí|4:pizza|3:en casa',
        },
      },
      {
        rotulo: '+ Tempo',
        pt: 'ontem eu comi pizza em casa',
        b: {
          en: '1:I|5:ate|4:pizza|3:at home|2:yesterday',
          fr: "2:hier|1:j'|5:ai mangé|4:une pizza|3:à la maison",
          de: '2:gestern|5:habe|1:ich|3:zu Hause|4:Pizza|5:gegessen',
          es: '2:ayer|1:yo|5:comí|4:pizza|3:en casa',
        },
      },
    ],
    frases: [
      {
        id: 'l06f1',
        pt: 'Ontem eu comi pizza em casa.',
        p: '.',
        b: {
          en: '1:I|5:ate|4:pizza|3:at home|2:yesterday',
          fr: "2:hier|1:j'|5:ai mangé|4:une pizza|3:à la maison",
          de: '2:gestern|5:habe|1:ich|3:zu Hause|4:Pizza|5:gegessen',
          es: '2:ayer|1:yo|5:comí|4:pizza|3:en casa',
        },
      },
      {
        id: 'l06f2',
        pt: 'Na semana passada eu visitei Lisboa.',
        p: '.',
        b: {
          en: '2:last week|1:I|5:visited|4:Lisbon',
          fr: "2:la semaine dernière|1:j'|5:ai visité|4:Lisbonne",
          de: '2:letzte Woche|5:habe|1:ich|4:Lissabon|5:besucht',
          es: '2:la semana pasada|1:yo|5:visité|4:Lisboa',
        },
      },
      {
        id: 'l06f3',
        pt: 'Ela chegou tarde.',
        p: '.',
        b: {
          en: '1:she|5:arrived|2:late',
          fr: '1:elle|5:est arrivée|2:tard',
          de: '1:sie|5:ist|2:spät|5:angekommen',
          es: '1:ella|5:llegó|2:tarde',
        },
      },
      {
        id: 'l06f4',
        pt: 'Você viu o filme?',
        p: '?',
        b: {
          en: '5:did|1:you|5:see|4:the movie',
          fr: '1:tu|5:as vu|4:le film',
          de: '5:hast|1:du|4:den Film|5:gesehen',
          es: '5:viste|4:la película',
        },
      },
    ],
    dialogo: [
      {
        falante: 'A',
        pt: 'O que você fez ontem?',
        p: '?',
        b: {
          en: '4:what|5:did|1:you|5:do|2:yesterday',
          fr: "4:qu'est-ce que|1:tu|5:as fait|2:hier",
          de: '4:was|5:hast|1:du|2:gestern|5:gemacht',
          es: '4:qué|5:hiciste|2:ayer',
        },
      },
      {
        falante: 'B',
        pt: 'Ontem eu comi pizza em casa.',
        p: '.',
        b: {
          en: '1:I|5:ate|4:pizza|3:at home|2:yesterday',
          fr: "2:hier|1:j'|5:ai mangé|4:une pizza|3:à la maison",
          de: '2:gestern|5:habe|1:ich|3:zu Hause|4:Pizza|5:gegessen',
          es: '2:ayer|1:yo|5:comí|4:pizza|3:en casa',
        },
      },
      {
        falante: 'A',
        pt: 'Você viu o filme?',
        p: '?',
        b: {
          en: '5:did|1:you|5:see|4:the movie',
          fr: '1:tu|5:as vu|4:le film',
          de: '5:hast|1:du|4:den Film|5:gesehen',
          es: '5:viste|4:la película',
        },
      },
      {
        falante: 'B',
        pt: 'Sim, foi ótimo!',
        p: '!',
        b: {
          en: '0:yes,|1:it|5:was|4:great',
          fr: "0:oui,|1:c'|5:était|4:génial",
          de: '0:ja,|1:er|5:war|4:toll',
          es: '0:sí,|5:fue|4:genial',
        },
      },
    ],
    erros: [
      {
        lang: 'fr',
        errado: 'Elle a arrivé tard.',
        certo: 'Elle est arrivée tard.',
        nota: 'Verbos de movimento (arriver, partir, venir) usam "être" e concordam com o sujeito.',
      },
      {
        lang: 'de',
        errado: 'Ich habe gegessen Pizza.',
        certo: 'Ich habe Pizza gegessen.',
        nota: 'Satzklammer: o particípio fecha a frase. Tudo o mais fica entre o auxiliar e ele.',
      },
      {
        lang: 'en',
        errado: 'Did you saw the movie?',
        certo: 'Did you see the movie?',
        nota: 'Com "did", o passado já está marcado: o verbo volta à forma base.',
      },
      {
        lang: 'es',
        errado: 'Yo he comido pizza ayer.',
        certo: 'Ayer comí pizza.',
        nota: 'Com marcadores fechados (ayer, la semana pasada) use o pretérito indefinido.',
      },
    ],
    drill: {
      frase: 'l06f2',
      bloco: 4,
      opcoes: [
        { pt: 'Paris', en: 'Paris', fr: 'Paris', de: 'Paris', es: 'París' },
        { pt: 'Roma', en: 'Rome', fr: 'Rome', de: 'Rom', es: 'Roma' },
        { pt: 'Londres', en: 'London', fr: 'Londres', de: 'London', es: 'Londres' },
        { pt: 'Viena', en: 'Vienna', fr: 'Vienne', de: 'Wien', es: 'Viena' },
      ],
    },
  },
];

// Conteúdo pedagógico do jogo "Pongo vai à China".
// Fontes: Material Didático, Norteador e "Mandarim em Blocos" (ODU Creative, 2026);
// tons e pares de tons: Yoyo Chinese (tone pairs), Wikipedia (Standard Chinese phonology),
// Language Trainers (Chinese tones) e PolyU (basic tones, valores de Chao).

// ------------------------------------------------------------------ blocos ODU
// Cores fixas do Método ODU Chunking: a cor é a sintaxe tornada visível.
export const BLOCK_TYPES = {
  S: { nome: 'Sujeito', cor: '#2563EB', claro: '#EAF1FE', pergunta: 'QUEM' },
  T: { nome: 'Tempo', cor: '#C2600A', claro: '#FBF3DC', pergunta: 'QUANDO' },
  L: { nome: 'Lugar', cor: '#0E8A8A', claro: '#E6F5F5', pergunta: 'ONDE' },
  M: { nome: 'Modal', cor: '#6D28D9', claro: '#EEE9FB', pergunta: '(MODAL)' },
  A: { nome: 'Advérbio', cor: '#555B66', claro: '#F2F4F8', pergunta: 'NÃO / MUITO / TAMBÉM' },
  V: { nome: 'Verbo', cor: '#C0392B', claro: '#FDEDEC', pergunta: 'FAZ' },
  N: { nome: 'Nº + Class.', cor: '#D97706', claro: '#FDF0E0', pergunta: 'QUANTOS' },
  O: { nome: 'Objeto', cor: '#1E8449', claro: '#E8F6EF', pergunta: 'O QUÊ' },
  Q: { nome: 'Interrog.', cor: '#8A6D00', claro: '#FFF3C4', pergunta: 'PERGUNTA' },
  P: { nome: 'Partícula', cor: '#C05070', claro: '#FDECEF', pergunta: 'TOM DE VOZ' },
};

// A esteira da frase (ordem dos blocos)
export const ESTEIRA = ['S', 'T', 'L', 'M', 'V', 'O', 'P'];

// ------------------------------------------------------------------ tons
// Valores de Chao (1 = grave, 5 = agudo)
export const TONES = [
  { n: 1, nome: '1º tom', marca: 'ā', chao: [5, 5], dica: 'alto e reto, como uma nota longa de canto', ancora: 'mā 妈 (mãe)' },
  { n: 2, nome: '2º tom', marca: 'á', chao: [3, 5], dica: 'sobe, como o "quê?" de surpresa', ancora: 'má 麻 (cânhamo)' },
  { n: 3, nome: '3º tom', marca: 'ǎ', chao: [2, 1, 4], dica: 'desce bem grave e só sobe no fim da frase — o "hummm" pensativo', ancora: 'mǎ 马 (cavalo)' },
  { n: 4, nome: '4º tom', marca: 'à', chao: [5, 1], dica: 'cai firme, como uma ordem: "Já!"', ancora: 'mà 骂 (xingar)' },
  { n: 0, nome: 'neutro', marca: 'a', chao: [3], dica: 'curto e leve, sem melodia própria', ancora: 'ma 吗 (partícula de pergunta)' },
];

// Sílabas para o treino de tons: [hanzi, pinyin com tom, sílaba base, tom, significado]
export const TONE_SYLLABLES = [
  ['妈', 'mā', 'ma', 1, 'mãe'], ['麻', 'má', 'ma', 2, 'cânhamo'], ['马', 'mǎ', 'ma', 3, 'cavalo'], ['骂', 'mà', 'ma', 4, 'xingar'], ['吗', 'ma', 'ma', 0, 'partícula de pergunta'],
  ['八', 'bā', 'ba', 1, 'oito'], ['拔', 'bá', 'ba', 2, 'arrancar'], ['把', 'bǎ', 'ba', 3, 'segurar'], ['爸', 'bà', 'ba', 4, 'papai'],
  ['衣', 'yī', 'yi', 1, 'roupa'], ['姨', 'yí', 'yi', 2, 'tia'], ['椅', 'yǐ', 'yi', 3, 'cadeira'], ['意', 'yì', 'yi', 4, 'ideia'],
  ['汤', 'tāng', 'tang', 1, 'sopa'], ['糖', 'táng', 'tang', 2, 'açúcar'], ['躺', 'tǎng', 'tang', 3, 'deitar'], ['烫', 'tàng', 'tang', 4, 'escaldante'],
  ['书', 'shū', 'shu', 1, 'livro'], ['熟', 'shú', 'shu', 2, 'maduro'], ['鼠', 'shǔ', 'shu', 3, 'rato'], ['树', 'shù', 'shu', 4, 'árvore'],
  ['喝', 'hē', 'he', 1, 'beber'], ['和', 'hé', 'he', 2, 'e (conectivo)'], ['好', 'hǎo', 'hao', 3, 'bom'], ['去', 'qù', 'qu', 4, 'ir'],
];

// Pares mínimos de tom (o tom muda o sentido)
export const MINIMAL_PAIRS = [
  { a: ['买', 'mǎi', 'comprar'], b: ['卖', 'mài', 'vender'], frase: 'Um tom separa o cliente do vendedor.' },
  { a: ['是', 'shì', 'ser'], b: ['十', 'shí', 'dez'], frase: 'shì cai (4º); shí sobe (2º).' },
  { a: ['那', 'nà', 'aquele'], b: ['哪', 'nǎ', 'qual?'], frase: 'nà aponta; nǎ pergunta.' },
  { a: ['汤', 'tāng', 'sopa'], b: ['糖', 'táng', 'açúcar'], frase: 'Peça sopa e não açúcar!' },
  { a: ['书', 'shū', 'livro'], b: ['树', 'shù', 'árvore'], frase: 'Mesmo som, tom diferente.' },
  { a: ['妈', 'mā', 'mãe'], b: ['马', 'mǎ', 'cavalo'], frase: 'Cuidado para não chamar a mamãe de cavalo!' },
];

// Os 20 pares de tons (método Yoyo Chinese), com palavras do HSK 1
export const TONE_PAIRS = [
  ['今天', 'jīntiān', 'hoje', [1, 1]], ['中国', 'Zhōngguó', 'China', [1, 2]], ['喝水', 'hē shuǐ', 'beber água', [1, 3]], ['商店', 'shāngdiàn', 'loja', [1, 4]], ['他们', 'tāmen', 'eles', [1, 0]],
  ['明天', 'míngtiān', 'amanhã', [2, 1]], ['学习', 'xuéxí', 'estudar', [2, 2]], ['苹果', 'píngguǒ', 'maçã', [2, 3]], ['学校', 'xuéxiào', 'escola', [2, 4]], ['朋友', 'péngyou', 'amigo', [2, 0]],
  ['老师', 'lǎoshī', 'professor', [3, 1]], ['女儿', "nǚ'ér", 'filha', [3, 2]], ['水果', 'shuǐguǒ', 'fruta', [3, 3]], ['米饭', 'mǐfàn', 'arroz', [3, 4]], ['我们', 'wǒmen', 'nós', [3, 0]],
  ['汽车', 'qìchē', 'carro', [4, 1]], ['去年', 'qùnián', 'ano passado', [4, 2]], ['电脑', 'diànnǎo', 'computador', [4, 3]], ['再见', 'zàijiàn', 'tchau', [4, 4]], ['谢谢', 'xièxie', 'obrigado', [4, 0]],
];

// Iniciais e finais que pedem treino deliberado
export const PINYIN_SOUNDS = [
  { grupo: 'j · q · x', som: 'série "fininha": dji, tchi, chi suaves, língua atrás dos dentes de baixo', itens: [['叫', 'jiào', 'chamar-se'], ['去', 'qù', 'ir'], ['谢', 'xiè', 'agradecer'], ['七', 'qī', 'sete'], ['九', 'jiǔ', 'nove'], ['小', 'xiǎo', 'pequeno']] },
  { grupo: 'zh · ch · sh · r', som: 'série retroflexa: língua enrolada para trás', itens: [['这', 'zhè', 'este'], ['吃', 'chī', 'comer'], ['是', 'shì', 'ser'], ['人', 'rén', 'pessoa'], ['茶', 'chá', 'chá'], ['热', 'rè', 'quente']] },
  { grupo: 'z · c · s', som: '"dz" e "ts" como em pizza; s sibilante', itens: [['在', 'zài', 'estar em'], ['菜', 'cài', 'prato, verdura'], ['坐', 'zuò', 'sentar'], ['四', 'sì', 'quatro'], ['字', 'zì', 'caractere']] },
  { grupo: '-n × -ng · e · ü', som: '-n nos dentes, -ng na garganta; e gutural; ü é bico de "u" dizendo "i"', itens: [['很', 'hěn', 'muito'], ['行', 'xíng', 'tudo bem'], ['喝', 'hē', 'beber'], ['女', 'nǚ', 'mulher'], ['去', 'qù', 'ir (ü disfarçado!)'], ['朋', 'péng', 'amigo']] },
];

// Perguntas de som (identificar a inicial/final certa)
export const SOUND_QUESTIONS = [
  { h: '去', p: 'qù', g: 'ir', opts: ['qù', 'chù', 'cù', 'jù'], dica: 'q = "tchi" suave, e o u depois de q é ü!' },
  { h: '吃', p: 'chī', g: 'comer', opts: ['chī', 'qī', 'cī', 'shī'], dica: 'ch é retroflexo: língua enrolada.' },
  { h: '谢', p: 'xiè', g: 'agradecer', opts: ['xiè', 'shè', 'sè', 'jiè'], dica: 'x é o "chi" fininho, sorrindo.' },
  { h: '是', p: 'shì', g: 'ser', opts: ['shì', 'xì', 'sì', 'zhì'], dica: 'sh retroflexo; o i depois dele é um zumbido.' },
  { h: '在', p: 'zài', g: 'estar em', opts: ['zài', 'zhài', 'cài', 'jài'], dica: 'z = "dz" de pizza.' },
  { h: '菜', p: 'cài', g: 'prato', opts: ['cài', 'chài', 'zài', 'kài'], dica: 'c = "ts" com sopro.' },
  { h: '人', p: 'rén', g: 'pessoa', opts: ['rén', 'lén', 'réng', 'yén'], dica: 'r é um "j" do inglês com a língua enrolada.' },
  { h: '很', p: 'hěn', g: 'muito', opts: ['hěn', 'hěng', 'hǎn', 'xěn'], dica: '-n termina nos dentes.' },
  { h: '行', p: 'xíng', g: 'tudo bem', opts: ['xíng', 'xín', 'shíng', 'híng'], dica: '-ng termina na garganta.' },
  { h: '女', p: 'nǚ', g: 'mulher', opts: ['nǚ', 'nǔ', 'nǐ', 'lǚ'], dica: 'ü = bico de "u" dizendo "i".' },
  { h: '七', p: 'qī', g: 'sete', opts: ['qī', 'chī', 'cī', 'xī'], dica: 'q fininho, como em "tchi".' },
  { h: '这', p: 'zhè', g: 'este', opts: ['zhè', 'jè', 'zè', 'chè'], dica: 'zh retroflexo, sem sopro.' },
];

// Sandhi — quando os blocos mudam de tom ao se encostar
export const SANDHI = [
  { h: '你好', escrito: 'nǐ hǎo', falado: 'ní hǎo', erradas: ['nǐ hǎo (3+3)', 'nì hǎo', 'nī hǎo'], regra: '3º + 3º: o primeiro vira 2º.' },
  { h: '很好', escrito: 'hěn hǎo', falado: 'hén hǎo', erradas: ['hěn hǎo (3+3)', 'hèn hǎo', 'hēn hǎo'], regra: '3º + 3º: o primeiro vira 2º.' },
  { h: '我想', escrito: 'wǒ xiǎng', falado: 'wó xiǎng', erradas: ['wǒ xiǎng (3+3)', 'wò xiǎng', 'wō xiǎng'], regra: '3º + 3º: o primeiro vira 2º.' },
  { h: '不是', escrito: 'bù shì', falado: 'bú shì', erradas: ['bù shì', 'bǔ shì', 'bū shì'], regra: '不 antes de 4º tom vira 2º: bú.' },
  { h: '不去', escrito: 'bù qù', falado: 'bú qù', erradas: ['bù qù', 'bǔ qù', 'bū qù'], regra: '不 antes de 4º tom vira 2º: bú.' },
  { h: '不客气', escrito: 'bù kèqi', falado: 'bú kèqi', erradas: ['bù kèqi', 'bǔ kèqi', 'bū kèqi'], regra: '不 antes de 4º tom vira 2º: bú.' },
  { h: '一个', escrito: 'yī ge', falado: 'yí ge', erradas: ['yī ge', 'yì ge', 'yǐ ge'], regra: '一 antes de 4º tom (个 é gè) vira yí.' },
  { h: '一杯', escrito: 'yī bēi', falado: 'yì bēi', erradas: ['yī bēi', 'yí bēi', 'yǐ bēi'], regra: '一 antes dos demais tons vira yì.' },
  { h: '一点儿', escrito: 'yī diǎnr', falado: 'yìdiǎnr', erradas: ['yīdiǎnr', 'yídiǎnr', 'yǐdiǎnr'], regra: '一 antes de 3º tom vira yì.' },
];

// ------------------------------------------------------------------ vocabulário HSK 1
// [hanzi, pinyin, português]
export const VOCAB = {
  numeros: [
    ['一', 'yī', 'um'], ['二', 'èr', 'dois'], ['三', 'sān', 'três'], ['四', 'sì', 'quatro'], ['五', 'wǔ', 'cinco'],
    ['六', 'liù', 'seis'], ['七', 'qī', 'sete'], ['八', 'bā', 'oito'], ['九', 'jiǔ', 'nove'], ['十', 'shí', 'dez'],
    ['零', 'líng', 'zero'], ['两', 'liǎng', 'dois (quantidade)'], ['百', 'bǎi', 'cem'],
  ],
  pessoas: [
    ['我', 'wǒ', 'eu'], ['你', 'nǐ', 'você'], ['他', 'tā', 'ele'], ['她', 'tā', 'ela'], ['您', 'nín', 'o senhor / a senhora'],
    ['我们', 'wǒmen', 'nós'], ['他们', 'tāmen', 'eles'], ['老师', 'lǎoshī', 'professor(a)'], ['学生', 'xuéshēng', 'estudante'],
    ['朋友', 'péngyou', 'amigo(a)'], ['医生', 'yīshēng', 'médico(a)'], ['爸爸', 'bàba', 'papai'], ['妈妈', 'māma', 'mamãe'],
    ['哥哥', 'gēge', 'irmão mais velho'], ['妹妹', 'mèimei', 'irmã mais nova'], ['人', 'rén', 'pessoa'], ['狗', 'gǒu', 'cachorro'], ['猫', 'māo', 'gato'],
  ],
  cortesia: [
    ['你好', 'nǐ hǎo', 'olá'], ['谢谢', 'xièxie', 'obrigado(a)'], ['不客气', 'bú kèqi', 'de nada'], ['对不起', 'duìbuqǐ', 'desculpe'],
    ['没关系', 'méi guānxi', 'não tem problema'], ['再见', 'zàijiàn', 'tchau'], ['请', 'qǐng', 'por favor / convidar'], ['早上好', 'zǎoshang hǎo', 'bom dia'],
  ],
  comida: [
    ['吃', 'chī', 'comer'], ['喝', 'hē', 'beber'], ['米饭', 'mǐfàn', 'arroz cozido'], ['菜', 'cài', 'prato / verdura'], ['茶', 'chá', 'chá'],
    ['水', 'shuǐ', 'água'], ['咖啡', 'kāfēi', 'café'], ['苹果', 'píngguǒ', 'maçã'], ['水果', 'shuǐguǒ', 'fruta'], ['面条', 'miàntiáo', 'macarrão'],
    ['牛奶', 'niúnǎi', 'leite'], ['杯子', 'bēizi', 'copo'], ['饭馆', 'fànguǎn', 'restaurante'], ['好吃', 'hǎochī', 'gostoso'],
  ],
  compras: [
    ['买', 'mǎi', 'comprar'], ['钱', 'qián', 'dinheiro'], ['块', 'kuài', 'yuan (moeda, falado)'], ['多少', 'duōshao', 'quanto?'],
    ['个', 'gè', 'classificador geral'], ['本', 'běn', 'classificador de livros'], ['东西', 'dōngxi', 'coisa'], ['衣服', 'yīfu', 'roupa'],
    ['商店', 'shāngdiàn', 'loja'], ['太', 'tài', 'demais'], ['些', 'xiē', 'alguns'], ['书', 'shū', 'livro'],
  ],
  tempo: [
    ['今天', 'jīntiān', 'hoje'], ['明天', 'míngtiān', 'amanhã'], ['昨天', 'zuótiān', 'ontem'], ['现在', 'xiànzài', 'agora'],
    ['年', 'nián', 'ano'], ['月', 'yuè', 'mês / lua'], ['号', 'hào', 'dia (do mês)'], ['星期', 'xīngqī', 'semana'],
    ['点', 'diǎn', 'hora (no relógio)'], ['分钟', 'fēnzhōng', 'minuto'], ['上午', 'shàngwǔ', 'manhã'], ['下午', 'xiàwǔ', 'tarde'], ['岁', 'suì', 'anos de idade'],
  ],
  lugar: [
    ['中国', 'Zhōngguó', 'China'], ['北京', 'Běijīng', 'Pequim'], ['家', 'jiā', 'casa / família'], ['学校', 'xuéxiào', 'escola'],
    ['医院', 'yīyuàn', 'hospital'], ['火车站', 'huǒchēzhàn', 'estação de trem'], ['飞机', 'fēijī', 'avião'], ['出租车', 'chūzūchē', 'táxi'],
    ['前面', 'qiánmiàn', 'frente'], ['后面', 'hòumiàn', 'atrás'], ['里', 'lǐ', 'dentro'], ['哪儿', 'nǎr', 'onde?'], ['这儿', 'zhèr', 'aqui'], ['在', 'zài', 'estar em'],
  ],
  verbos: [
    ['是', 'shì', 'ser'], ['有', 'yǒu', 'ter / haver'], ['去', 'qù', 'ir'], ['来', 'lái', 'vir'], ['看', 'kàn', 'ver / ler'],
    ['听', 'tīng', 'ouvir'], ['说', 'shuō', 'falar'], ['读', 'dú', 'ler em voz alta'], ['写', 'xiě', 'escrever'], ['叫', 'jiào', 'chamar-se'],
    ['做', 'zuò', 'fazer'], ['坐', 'zuò', 'sentar / ir de (veículo)'], ['住', 'zhù', 'morar'], ['学习', 'xuéxí', 'estudar'], ['工作', 'gōngzuò', 'trabalhar'],
    ['喜欢', 'xǐhuan', 'gostar'], ['爱', 'ài', 'amar'], ['想', 'xiǎng', 'querer / pensar'], ['会', 'huì', 'saber (habilidade)'], ['能', 'néng', 'poder'],
    ['认识', 'rènshi', 'conhecer'], ['睡觉', 'shuìjiào', 'dormir'], ['回', 'huí', 'voltar'],
  ],
  descricao: [
    ['好', 'hǎo', 'bom'], ['大', 'dà', 'grande'], ['小', 'xiǎo', 'pequeno'], ['多', 'duō', 'muito(s)'], ['少', 'shǎo', 'pouco(s)'],
    ['冷', 'lěng', 'frio'], ['热', 'rè', 'quente'], ['高兴', 'gāoxìng', 'contente'], ['漂亮', 'piàoliang', 'bonito(a)'],
    ['很', 'hěn', 'muito (conector)'], ['不', 'bù', 'não'], ['没', 'méi', 'não (ter / passado)'], ['都', 'dōu', 'todos'], ['也', 'yě', 'também'],
  ],
  perguntas: [
    ['什么', 'shénme', 'o quê?'], ['谁', 'shéi', 'quem?'], ['哪', 'nǎ', 'qual?'], ['几', 'jǐ', 'quantos? (até 10)'],
    ['怎么', 'zěnme', 'como?'], ['怎么样', 'zěnmeyàng', 'que tal?'], ['吗', 'ma', 'partícula de pergunta sim/não'], ['呢', 'ne', 'e ...? (devolve a pergunta)'],
  ],
};

// ------------------------------------------------------------------ frases em blocos
// Cada bloco: [tipo, hanzi, pinyin, glosa]. Frases do material "Mandarim em Blocos" (BL-01 a BL-10).
const B = (t, h, p, g) => ({ t, h, p, g });
export const CHUNKS = {
  'BL-01': [
    { pt: 'Olá! (lit.: "você [está] bem")', b: [B('S', '你', 'nǐ', 'você'), B('V', '好', 'hǎo', 'bom')], lupa: 'Sujeito + adjetivo-verbo: em mandarim o adjetivo já contém o "estar".' },
    { pt: 'Bom dia!', b: [B('T', '早上', 'zǎoshang', 'manhã'), B('V', '好', 'hǎo', 'bom')], lupa: 'Troque o SUJEITO por TEMPO e a saudação muda de hora. O tempo vem sempre primeiro.' },
    { pt: 'Prazer em conhecê-lo!', b: [B('V', '认识你', 'rènshi nǐ', 'conhecer você'), B('A', '很', 'hěn', 'muito'), B('V', '高兴', 'gāoxìng', 'contente')], lupa: 'Estrutura-sanduíche: 认识你 funciona como sujeito; 很 conecta ao adjetivo.' },
    { pt: 'Obrigado (a você)!', b: [B('V', '谢谢', 'xièxie', 'agradecer'), B('O', '你', 'nǐ', 'você')], lupa: '谢 é verbo pleno e aceita objeto: 谢谢你, 谢谢老师.' },
    { pt: 'Sente-se, por favor.', b: [B('M', '请', 'qǐng', 'por favor'), B('V', '坐', 'zuò', 'sentar')], lupa: '请 antes do verbo transforma ordem em convite: 请坐, 请进, 请喝茶.' },
  ],
  'BL-02': [
    { pt: 'Eu me chamo Ana.', b: [B('S', '我', 'wǒ', 'eu'), B('V', '叫', 'jiào', 'chamar-se'), B('O', '安娜', 'Ānnà', 'Ana')], lupa: '叫 apresenta o nome; para o sobrenome formal use 姓.' },
    { pt: 'Eu sou brasileiro(a).', b: [B('S', '我', 'wǒ', 'eu'), B('V', '是', 'shì', 'ser'), B('O', '巴西人', 'Bāxīrén', 'brasileiro')], lupa: 'O molde A 是 B. Nacionalidade = país + 人.' },
    { pt: 'Ela não é professora.', b: [B('S', '她', 'tā', 'ela'), B('A', '不', 'bú', 'não'), B('V', '是', 'shì', 'ser'), B('O', '老师', 'lǎoshī', 'professora')], lupa: 'A negação entra SEMPRE antes do verbo. 不 + 4º tom = bú.' },
    { pt: 'Você é estudante?', b: [B('S', '你', 'nǐ', 'você'), B('V', '是', 'shì', 'ser'), B('O', '学生', 'xuéshēng', 'estudante'), B('P', '吗', 'ma', '?')], lupa: 'Para perguntar, nenhum bloco muda de lugar: 吗 no fim.' },
    { pt: 'Eu sou professor. E você?', b: [B('S', '我', 'wǒ', 'eu'), B('V', '是', 'shì', 'ser'), B('O', '老师', 'lǎoshī', 'professor'), B('S', '你', 'nǐ', 'você'), B('P', '呢', 'ne', 'e...?')], lupa: '呢 devolve a pergunta: "e você?".' },
  ],
  'BL-03': [
    { pt: 'Ele é alto.', b: [B('S', '他', 'tā', 'ele'), B('A', '很', 'hěn', 'muito'), B('V', '高', 'gāo', 'ser alto')], lupa: 'Adjetivo é verbo: não use 是 antes de adjetivo. 很 é o conector padrão.' },
    { pt: 'Ela não está cansada.', b: [B('S', '她', 'tā', 'ela'), B('A', '不', 'bú', 'não'), B('V', '累', 'lèi', 'cansado')], lupa: '不 substitui o 很 na negação.' },
    { pt: 'Este é o meu celular.', b: [B('S', '这', 'zhè', 'este'), B('V', '是', 'shì', 'ser'), B('S', '我', 'wǒ', 'eu'), B('P', '的', 'de', 'de (posse)'), B('O', '手机', 'shǒujī', 'celular')], lupa: '的 marca posse: 我的 = meu.' },
    { pt: 'Seu chinês é bom demais!', b: [B('S', '你', 'nǐ', 'você'), B('P', '的', 'de', 'de'), B('O', '中文', 'Zhōngwén', 'chinês'), B('A', '太', 'tài', 'demais'), B('V', '好', 'hǎo', 'bom'), B('P', '了', 'le', '!')], lupa: '太 ... 了 = "demais!".' },
  ],
  'BL-04': [
    { pt: 'Minha família tem quatro pessoas.', b: [B('S', '我家', 'wǒ jiā', 'minha família'), B('V', '有', 'yǒu', 'ter'), B('N', '四口', 'sì kǒu', 'quatro (bocas)'), B('O', '人', 'rén', 'pessoas')], lupa: '口 é o classificador de membros da família.' },
    { pt: 'Eu tenho um irmão mais velho.', b: [B('S', '我', 'wǒ', 'eu'), B('V', '有', 'yǒu', 'ter'), B('N', '一个', 'yí ge', 'um'), B('O', '哥哥', 'gēge', 'irmão mais velho')], lupa: 'Número + classificador + substantivo. 一 antes de gè vira yí.' },
    { pt: 'Eu não tenho irmã mais nova.', b: [B('S', '我', 'wǒ', 'eu'), B('A', '没', 'méi', 'não'), B('V', '有', 'yǒu', 'ter'), B('O', '妹妹', 'mèimei', 'irmã mais nova')], lupa: '有 se nega SEMPRE com 没, nunca com 不.' },
    { pt: 'Nós todos somos altos.', b: [B('S', '我们', 'wǒmen', 'nós'), B('A', '都', 'dōu', 'todos'), B('A', '很', 'hěn', 'muito'), B('V', '高', 'gāo', 'alto')], lupa: '都 e 也 grudam antes do verbo.' },
  ],
  'BL-05': [
    { pt: 'Quanto custa este?', b: [B('S', '这个', 'zhège', 'este'), B('Q', '多少', 'duōshao', 'quanto'), B('O', '钱', 'qián', 'dinheiro')], lupa: 'A palavra interrogativa fica no lugar exato da resposta.' },
    { pt: 'Eu quero comprar dois copos.', b: [B('S', '我', 'wǒ', 'eu'), B('M', '要', 'yào', 'querer'), B('V', '买', 'mǎi', 'comprar'), B('N', '两个', 'liǎng ge', 'dois'), B('O', '杯子', 'bēizi', 'copos')], lupa: 'Para quantidade, 2 = 两 (não 二) antes do classificador.' },
    { pt: 'Caro demais!', b: [B('A', '太', 'tài', 'demais'), B('V', '贵', 'guì', 'caro'), B('P', '了', 'le', '!')], lupa: 'Molde 太 + adjetivo + 了.' },
  ],
  'BL-06': [
    { pt: 'O que você vai querer comer?', b: [B('S', '你', 'nǐ', 'você'), B('M', '要', 'yào', 'querer'), B('V', '吃', 'chī', 'comer'), B('Q', '什么', 'shénme', 'o quê')], lupa: '什么 ocupa o lugar do objeto: a resposta encaixa no mesmo slot.' },
    { pt: 'Eu quero uma tigela de arroz.', b: [B('S', '我', 'wǒ', 'eu'), B('M', '要', 'yào', 'querer'), B('N', '一碗', 'yì wǎn', 'uma tigela'), B('O', '米饭', 'mǐfàn', 'arroz')], lupa: '碗 = classificador "tigela".' },
    { pt: 'A comida chinesa é deliciosa.', b: [B('S', '中国菜', 'Zhōngguó cài', 'comida chinesa'), B('A', '很', 'hěn', 'muito'), B('V', '好吃', 'hǎochī', 'gostoso')], lupa: '好 + verbo = "bom de ...": 好吃, 好喝, 好看.' },
    { pt: 'Eu não como carne.', b: [B('S', '我', 'wǒ', 'eu'), B('A', '不', 'bù', 'não'), B('V', '吃', 'chī', 'comer'), B('O', '肉', 'ròu', 'carne')], lupa: '不 para hábitos e vontades.' },
  ],
  'BL-07': [
    { pt: 'Aonde você vai?', b: [B('S', '你', 'nǐ', 'você'), B('V', '去', 'qù', 'ir'), B('Q', '哪儿', 'nǎr', 'aonde')], lupa: 'Resposta no mesmo slot: 我去学校.' },
    { pt: 'Eu vou de metrô para a empresa.', b: [B('S', '我', 'wǒ', 'eu'), B('V', '坐', 'zuò', 'ir de'), B('O', '地铁', 'dìtiě', 'metrô'), B('V', '去', 'qù', 'ir'), B('L', '公司', 'gōngsī', 'empresa')], lupa: 'O meio de transporte vem ANTES do destino.' },
    { pt: 'O restaurante fica ao lado do banco.', b: [B('S', '饭馆', 'fànguǎn', 'restaurante'), B('V', '在', 'zài', 'ficar em'), B('L', '银行', 'yínháng', 'banco'), B('L', '旁边', 'pángbiān', 'ao lado')], lupa: 'Lugar: referência + posição (银行 + 旁边).' },
  ],
  'BL-08': [
    { pt: 'Que horas são agora?', b: [B('T', '现在', 'xiànzài', 'agora'), B('Q', '几', 'jǐ', 'quantas'), B('O', '点', 'diǎn', 'horas')], lupa: '几 pergunta números pequenos.' },
    { pt: 'Eu levanto todos os dias às 7h.', b: [B('S', '我', 'wǒ', 'eu'), B('T', '每天', 'měitiān', 'todo dia'), B('T', '七点', 'qī diǎn', 'às 7h'), B('V', '起床', 'qǐchuáng', 'levantar')], lupa: 'Tempo do maior para o menor, sempre ANTES do verbo.' },
    { pt: 'Nós jantamos às 20h.', b: [B('S', '我们', 'wǒmen', 'nós'), B('T', '晚上', 'wǎnshang', 'à noite'), B('T', '八点', 'bā diǎn', 'às 8'), B('V', '吃', 'chī', 'comer'), B('O', '饭', 'fàn', 'refeição')], lupa: 'Nunca "comemos às 8": o tempo embarca antes do verbo.' },
    { pt: 'Você tem tempo amanhã?', b: [B('T', '明天', 'míngtiān', 'amanhã'), B('S', '你', 'nǐ', 'você'), B('V', '有', 'yǒu', 'ter'), B('O', '时间', 'shíjiān', 'tempo'), B('P', '吗', 'ma', '?')], lupa: 'O tempo pode vir antes ou depois do sujeito, mas nunca depois do verbo.' },
  ],
  'BL-09': [
    { pt: 'Estou com dor de cabeça.', b: [B('S', '我', 'wǒ', 'eu'), B('S', '头', 'tóu', 'cabeça'), B('V', '疼', 'téng', 'doer')], lupa: 'Tópico + comentário: "eu, a cabeça dói".' },
    { pt: 'Estou me sentindo meio mal.', b: [B('S', '我', 'wǒ', 'eu'), B('A', '有点儿', 'yǒudiǎnr', 'um pouco'), B('V', '不舒服', 'bù shūfu', 'indisposto')], lupa: '有点儿 + adjetivo negativo = "meio...".' },
    { pt: 'Você deve beber mais água.', b: [B('S', '你', 'nǐ', 'você'), B('M', '应该', 'yīnggāi', 'dever'), B('A', '多', 'duō', 'mais'), B('V', '喝', 'hē', 'beber'), B('O', '水', 'shuǐ', 'água')], lupa: '多 antes do verbo = "fazer mais".' },
  ],
  'BL-10': [
    { pt: 'Eu gosto de ouvir música.', b: [B('S', '我', 'wǒ', 'eu'), B('M', '喜欢', 'xǐhuan', 'gostar'), B('V', '听', 'tīng', 'ouvir'), B('O', '音乐', 'yīnyuè', 'música')], lupa: '喜欢 + verbo: o gosto vem antes da ação.' },
    { pt: 'Eu sei falar um pouquinho de chinês.', b: [B('S', '我', 'wǒ', 'eu'), B('M', '会', 'huì', 'saber'), B('V', '说', 'shuō', 'falar'), B('N', '一点儿', 'yìdiǎnr', 'um pouco'), B('O', '汉语', 'Hànyǔ', 'chinês')], lupa: '会 = habilidade aprendida.' },
    { pt: 'Ele não pode vir hoje.', b: [B('S', '他', 'tā', 'ele'), B('T', '今天', 'jīntiān', 'hoje'), B('A', '不', 'bù', 'não'), B('M', '能', 'néng', 'poder'), B('V', '来', 'lái', 'vir')], lupa: 'A negação gruda antes do MODAL.' },
    { pt: 'Eu gostaria de ir estudar na China.', b: [B('S', '我', 'wǒ', 'eu'), B('M', '想', 'xiǎng', 'gostaria'), B('V', '去', 'qù', 'ir'), B('L', '中国', 'Zhōngguó', 'China'), B('V', '学习', 'xuéxí', 'estudar')], lupa: 'Verbos em série: ir à China + estudar, na ordem dos acontecimentos.' },
    { pt: 'Ano que vem eu vou prestar o HSK 1.', b: [B('T', '明年', 'míngnián', 'ano que vem'), B('S', '我', 'wǒ', 'eu'), B('M', '要', 'yào', 'ir (plano)'), B('V', '考', 'kǎo', 'prestar exame'), B('O', 'HSK一级', 'HSK yī jí', 'HSK 1')], lupa: '要 = plano firme.' },
  ],
};

// Diálogo final com a Lili (BL-10, cenário "combinar um encontro")
export const DIALOGO_FINAL = [
  { lili: ['你好！你叫什么名字？', 'Nǐ hǎo! Nǐ jiào shénme míngzi?', 'Olá! Como você se chama?'],
    certa: ['我叫Pongo。', 'Wǒ jiào Pongo.', 'Eu me chamo Pongo.'],
    erradas: [['我是中国。', 'Wǒ shì Zhōngguó.', '(errado: "eu sou China")'], ['谢谢你叫。', 'Xièxie nǐ jiào.', '(sem sentido)']] },
  { lili: ['你是哪国人？', 'Nǐ shì nǎ guó rén?', 'De que país você é?'],
    certa: ['我是巴西人。', 'Wǒ shì Bāxīrén.', 'Sou brasileiro.'],
    erradas: [['我去巴西。', 'Wǒ qù Bāxī.', '(eu vou ao Brasil)'], ['巴西人是我吗？', 'Bāxīrén shì wǒ ma?', '(ordem trocada)']] },
  { lili: ['你会说汉语吗？', 'Nǐ huì shuō Hànyǔ ma?', 'Você sabe falar chinês?'],
    certa: ['我会说一点儿汉语。', 'Wǒ huì shuō yìdiǎnr Hànyǔ.', 'Sei falar um pouquinho de chinês.'],
    erradas: [['我说会汉语一点儿。', 'Wǒ shuō huì Hànyǔ yìdiǎnr.', '(blocos fora de ordem)'], ['汉语很高。', 'Hànyǔ hěn gāo.', '(o chinês é alto)']] },
  { lili: ['你想喝什么？茶还是咖啡？', 'Nǐ xiǎng hē shénme? Chá háishi kāfēi?', 'O que você quer beber? Chá ou café?'],
    certa: ['我想喝茶。', 'Wǒ xiǎng hē chá.', 'Quero beber chá.'],
    erradas: [['我茶喝想。', 'Wǒ chá hē xiǎng.', '(ordem trocada)'], ['我是茶。', 'Wǒ shì chá.', '(eu sou chá)']] },
  { lili: ['明天我们去长城，好吗？', 'Míngtiān wǒmen qù Chángchéng, hǎo ma?', 'Amanhã vamos à Grande Muralha, que tal?'],
    certa: ['好啊！明天见！', 'Hǎo a! Míngtiān jiàn!', 'Ótimo! Até amanhã!'],
    erradas: [['我们去明天长城。', 'Wǒmen qù míngtiān Chángchéng.', '(tempo depois do verbo)'], ['对不起，没关系。', 'Duìbuqǐ, méi guānxi.', '(resposta trocada)']] },
];

// ------------------------------------------------------------------ fases
// Cada fase = um cenário 3D (Blender) com 3 portais; cada portal = uma missão.
export const LEVELS = [
  {
    id: 1, nivel: 'Pré-HSK 1', nome: 'O Jardim do Pongo', zh: '花园', py: 'huāyuán', cena: 'scene_1.glb',
    ceu: ['#bfe6ff', '#fff4e0'], chao: 0, particulas: 'petalas',
    historia: 'Pongo está preso no jardim. O portão só abre para quem canta os tons do mandarim!',
    missoes: [
      { tipo: 'tons', titulo: 'Os cinco tons', zh: '声调', desc: 'Ouça a melodia e descubra o tom.' },
      { tipo: 'paresMinimos', titulo: 'Um tom muda tudo', zh: '买 / 卖', desc: 'Escolha o pinyin certo: o tom separa mãe de cavalo.' },
      { tipo: 'paresTons', titulo: 'Pares de tons', zh: '两个声调', desc: 'Os 20 pares de tons em palavras do HSK 1.' },
    ],
  },
  {
    id: 2, nivel: 'Pré-HSK 1', nome: 'A Floresta de Bambu', zh: '竹林', py: 'zhúlín', cena: 'scene_2.glb',
    ceu: ['#d4f0d0', '#fdf7e3'], chao: 0, particulas: 'vagalumes',
    historia: 'Entre os bambus, o vento sussurra os sons do pinyin. Afine o ouvido para atravessar o riacho.',
    missoes: [
      { tipo: 'sons', titulo: 'Sons do pinyin', zh: '拼音', desc: 'j q x · zh ch sh r · z c s · -n -ng · ü' },
      { tipo: 'sandhi', titulo: 'Sandhi: tons que mudam', zh: '变调', desc: '3º+3º, 不 e 一 mudam de tom ao se encostar.' },
      { tipo: 'vocab', grupos: ['numeros'], titulo: 'Números 一 a 十', zh: '数字', desc: 'Conte até dez para atravessar a ponte.' },
    ],
  },
  {
    id: 3, nivel: 'HSK 1', nome: 'Os Arrozais de Guilin', zh: '桂林', py: 'Guìlín', cena: 'scene_3.glb',
    ceu: ['#c9ecf7', '#fff1d6'], chao: 0.2, particulas: 'petalas',
    historia: 'As montanhas de Guilin guardam as primeiras palavras. Cumprimente quem trabalha nos arrozais.',
    missoes: [
      { tipo: 'vocab', grupos: ['pessoas'], titulo: 'Pessoas e família', zh: '人', desc: 'Pronomes, família e profissões.' },
      { tipo: 'vocab', grupos: ['cortesia'], titulo: 'Cortesia', zh: '你好', desc: 'Os blocos de cortesia que não se desmontam.' },
      { tipo: 'blocos', modulos: ['BL-01', 'BL-02'], titulo: 'Blocos: saudações e identidade', zh: '问候', desc: 'Monte as frases com os blocos coloridos.' },
    ],
  },
  {
    id: 4, nivel: 'HSK 1', nome: 'O Porto', zh: '港口', py: 'gǎngkǒu', cena: 'scene_4.glb',
    ceu: ['#a9dcf5', '#fde9c8'], chao: 0.36, particulas: 'bolhas',
    historia: 'No porto, o barco para a China só aceita passageiros que sabem pedir comida e pagar a passagem.',
    missoes: [
      { tipo: 'vocab', grupos: ['comida'], titulo: 'Comida e bebida', zh: '吃喝', desc: 'Para não passar fome no navio.' },
      { tipo: 'vocab', grupos: ['compras', 'numeros'], titulo: 'Compras e dinheiro', zh: '买东西', desc: 'Quanto custa a passagem?' },
      { tipo: 'blocos', modulos: ['BL-03', 'BL-04', 'BL-05'], titulo: 'Blocos: descrever, família, compras', zh: '积木', desc: 'Adjetivo é verbo, 有 se nega com 没.' },
    ],
  },
  {
    id: 5, nivel: 'HSK 1', nome: 'A Grande Muralha', zh: '长城', py: 'Chángchéng', cena: 'scene_5.glb',
    ceu: ['#bcd9f2', '#fde2c4'], chao: 0, particulas: 'neve',
    historia: 'Pongo chegou à China! Para cruzar a Grande Muralha, ele precisa dominar QUANDO e ONDE.',
    missoes: [
      { tipo: 'vocab', grupos: ['tempo'], titulo: 'Tempo: dias e horas', zh: '时间', desc: 'O bloco amarelo-ouro mora antes do verbo.' },
      { tipo: 'vocab', grupos: ['lugar'], titulo: 'Lugares e transporte', zh: '地方', desc: 'Onde fica? Como ir?' },
      { tipo: 'blocos', modulos: ['BL-06', 'BL-07', 'BL-08'], titulo: 'Blocos: restaurante, transporte, rotina', zh: '积木', desc: 'QUEM → QUANDO → ONDE → FAZ.' },
    ],
  },
  {
    id: 6, nivel: 'HSK 1', nome: 'Pequim: a vila dos amigos', zh: '北京', py: 'Běijīng', cena: 'scene_6.glb',
    ceu: ['#ffd6c2', '#fff2d9'], chao: 0, particulas: 'petalas', amiga: true,
    historia: 'Lanternas vermelhas! A amiga Lili, a panda, espera o Pongo para um chá. Mostre tudo o que aprendeu.',
    missoes: [
      { tipo: 'vocab', grupos: ['verbos', 'descricao', 'perguntas'], titulo: 'Verbos, adjetivos e perguntas', zh: '动词', desc: 'As palavras que fazem a frase andar.' },
      { tipo: 'blocos', modulos: ['BL-09', 'BL-10'], titulo: 'Blocos: saúde, gostos e planos', zh: '积木', desc: 'Modais: 想 会 能 要 应该.' },
      { tipo: 'dialogo', titulo: 'Chá com a Lili', zh: '喝茶', desc: 'Converse com a Lili usando os blocos certos.' },
    ],
  },
];

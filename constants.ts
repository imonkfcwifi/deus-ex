
import { Person } from "./types";

export const THEMES = {
  default: {
    id: 'default',
    colors: {
      primary: '#D4AF37', // Gold
      dim: '#8a701e',
      accent: '#38BDF8',
      bgStart: '#1e293b',
      bgEnd: '#020617'
    },
    fontDisplay: '"Cinzel"'
  },
  scientific: {
    id: 'scientific',
    colors: {
      primary: '#22d3ee', // Cyan
      dim: '#0e7490',
      accent: '#38bdf8',
      bgStart: '#0f172a',
      bgEnd: '#082f49'
    },
    fontDisplay: '"Inter"' // Cleaner, modern font
  },
  theocratic: {
    id: 'theocratic',
    colors: {
      primary: '#fcd34d', // Amber
      dim: '#b45309',
      accent: '#fbbf24',
      bgStart: '#2a1b00',
      bgEnd: '#0f0500'
    },
    fontDisplay: '"Cinzel"' // Ornate
  },
  war: {
    id: 'war',
    colors: {
      primary: '#f87171', // Red
      dim: '#991b1b',
      accent: '#fca5a5',
      bgStart: '#2a0a0a',
      bgEnd: '#0f0505'
    },
    fontDisplay: '"Cinzel"'
  },
  nature: {
    id: 'nature',
    colors: {
      primary: '#4ade80', // Green
      dim: '#166534',
      accent: '#86efac',
      bgStart: '#052e16',
      bgEnd: '#020617'
    },
    fontDisplay: '"Crimson Text"'
  },
  void: {
    id: 'void',
    colors: {
      primary: '#c084fc', // Purple
      dim: '#6b21a8',
      accent: '#e879f9',
      bgStart: '#1e1b4b',
      bgEnd: '#020617'
    },
    fontDisplay: '"Inter"'
  }
};

export const getThemeForVibe = (vibe: string) => {
  const v = (vibe || "").toLowerCase();
  
  if (v.match(/science|future|tech|machine|reason|rational|steel|cyber|space|lab|과학|미래|기계|이성|기술/)) return THEMES.scientific;
  if (v.match(/holy|divine|god|faith|religion|theocracy|church|sacred|prophet|신성|종교|믿음|천국|교회|사제/)) return THEMES.theocratic;
  if (v.match(/war|blood|death|despair|chaos|doom|conflict|battle|military|army|전쟁|피|죽음|절망|혼돈|투쟁|군대/)) return THEMES.war;
  if (v.match(/nature|growth|life|forest|wild|green|gaia|druid|bloom|자연|생명|숲|정령/)) return THEMES.nature;
  if (v.match(/void|mystery|magic|arcane|secret|darkness|night|dream|cosmos|abyss|공허|신비|마법|어둠|꿈|심연/)) return THEMES.void;
  
  return THEMES.default;
};

export interface LoreEntry {
  description: string;
  history: string;
  beliefs: string[];
  initialFigures: string[]; // Strings to be converted to Person objects
}

export const FACTION_LORE_DATA: Record<string, LoreEntry> = {
  "아우레아 성황청": {
    description: "대륙 중앙의 황금 평원에 위치한 거대한 신권 국가입니다. 이들은 신의 침묵조차도 '완벽한 질서'의 일부라고 믿으며, 모든 삶의 양식을 법전과 의식으로 통제합니다.",
    history: "창세의 혼란기 이후, 최초의 예언자 '아우렐리우스'가 황금 판석을 발견하며 설립되었습니다. 그들은 혼돈을 죄악으로 규정하고, 대륙의 모든 국가를 하나의 거대한 '성스러운 톱니바퀴'로 만드는 것을 목표로 합니다.",
    beliefs: [
      "질서는 신의 언어이며, 혼돈은 악마의 속삭임이다.",
      "모든 개인은 거대한 기계의 부품으로서 역할을 다해야 한다.",
      "황금은 변하지 않는 신성의 상징이다."
    ],
    initialFigures: [
      "대주교 이그나티우스 (엄격한 법률가)",
      "성녀 세라피나 (기적의 치유사)"
    ]
  },
  "침묵의 감시자들": {
    description: "북쪽의 영구 동토층에 묻힌 고대 도서관을 지키는 수도승 집단입니다. 그들은 말을 아끼며, 세상의 모든 역사를 기록하고 보존하는 것을 유일한 사명으로 여깁니다.",
    history: "대홍수 이전의 지식이 담긴 '검은 석판'을 수호하기 위해 결성되었습니다. 세상이 멸망하더라도 기록만은 남아야 한다는 강박적인 신념을 가지고 있으며, 종종 역사의 관찰자를 자처하며 개입을 거부합니다.",
    beliefs: [
      "침묵은 가장웅변적인 진실이다.",
      "기억되지 않는 것은 존재하지 않았던 것이다.",
      "우리는 심판하지 않고, 다만 기록할 뿐이다."
    ],
    initialFigures: [
      "기록관 제로 (눈이 없는 노인)",
      "서기관 카엘 (고대 언어 해독가)"
    ]
  },
  "유리 연금술 학회": {
    description: "남부 사막의 뜨거운 태양 아래, 모래를 녹여 유리를 만들고 그 안에 빛을 가두는 기술자들입니다.",
    history: "태양의 열기를 에너지로 변환하는 기술을 개발하여 척박한 사막을 문명의 요람으로 바꾸었습니다. 그들은 물질적인 풍요와 과학적 진보를 신앙보다 우선시합니다.",
    beliefs: [
      "세상 모든 것은 등가교환이다.",
      "유리는 투명하기에 거짓을 말하지 않는다.",
      "태양은 신이 남긴 유일한 선물이다."
    ],
    initialFigures: ["수석 연금술사 솔라리스 (태양광 설계자)", "유리 세공인 마르코 (장인)"]
  },
  "강철뿌리 숲": {
    description: "서쪽의 뒤틀린 숲에서 기계와 식물을 융합하여 살아가는 드루이드들입니다.",
    history: "과거 전쟁의 잔해인 고대 병기들이 숲에 버려졌고, 자연이 그것을 집어삼키며 기괴한 공생 생태계가 탄생했습니다.",
    beliefs: [
      "강철은 뼈가 되고, 수액은 피가 된다.",
      "적자생존은 자연의 유일한 자비다.",
      "기술과 자연은 대립하지 않는다."
    ],
    initialFigures: ["대드루이드 가이아-7 (사이보그)", "뿌리의 감시자 펜 (숲지기)"]
  },
  "심해 무역연합": {
    description: "해안가와 거대한 수상 도시에 거주하는 상인과 탐험가들의 연합입니다.",
    history: "바다 건너 미지의 대륙과 교류하며 막대한 부를 축적했습니다. 그들에게 신앙은 일종의 계약이며, 신과도 거래를 할 수 있다고 믿습니다.",
    beliefs: [
      "흐르지 않는 물은 썩는다.",
      "모든 것에는 가격이 있다.",
      "수평선 너머에 진정한 자유가 있다."
    ],
    initialFigures: ["무역왕 바르바로사 (함대 제독)", "항해사 마리나 (지도 제작자)"]
  },
  "공허의 직조공": {
    description: "동쪽 군도, 별이 가장 잘 보이는 곳에서 밤하늘의 공허를 숭배하는 신비주의자들입니다.",
    history: "그들은 우주가 결국 차가운 어둠으로 돌아갈 것이라 믿으며, 그 종말을 대비하거나 앞당기기 위한 의식을 거행합니다.",
    beliefs: [
      "존재는 찰나의 꿈이며, 공허만이 영원하다.",
      "별들은 죽은 신들의 눈동자다.",
      "우리는 무(無)로 돌아가리라."
    ],
    initialFigures: ["점성술사 루나 (예언자)", "공허의 사제 녹스 (그림자 술사)"]
  }
};

// Helper to convert initial strings to detailed Person objects
export const generateInitialPeople = (): Person[] => {
  const people: Person[] = [];
  
  Object.entries(FACTION_LORE_DATA).forEach(([factionName, data]) => {
    data.initialFigures.forEach((figStr, idx) => {
      const match = figStr.match(/^([^(]+)(?:\(([^)]+)\))?$/);
      const name = match ? match[1].trim() : figStr;
      const role = match ? match[2]?.trim() : "Unknown";
      
      people.push({
        id: `init-${name.replace(/\s+/g, '-')}`,
        name: name,
        factionName: factionName,
        role: role || "Member",
        description: `${factionName}의 초기 주요 인물입니다. ${role}로서 세력을 이끌고 있습니다.`,
        biography: `${name}은(는) ${factionName}의 설립 초기부터 중요한 역할을 맡아왔습니다. ${role}로서의 능력은 타의 추종을 불허하며, 세력의 기틀을 다지는 데 공헌했습니다.`,
        birthYear: -20 - (Math.floor(Math.random() * 20)), // Born before year 1
        status: 'Alive',
        traits: ['Founder', 'Loyal']
      });
    });
  });

  return people;
};

export interface RegionInfo {
  title: string;
  description: string;
  climate: string;
  resources: string;
  populationDensity: string;
  hazards: string;
  coordinates: { x: number; y: number };
}

export const REGION_INFO: Record<string, RegionInfo> = {
  "North": {
    title: "The Frozen North",
    description: "영구 동토층과 험준한 산맥으로 이루어진 땅입니다. 고대 문명의 유적들이 얼음 아래 잠들어 있으며, 침묵과 보존의 기운이 강합니다.",
    climate: "극지방, 만년설",
    resources: "고대 유물, 희귀 광물, 얼음",
    populationDensity: "매우 희박함",
    hazards: "눈사태, 고대 기계의 오작동, 동상",
    coordinates: { x: 50, y: 15 }
  },
  "South": {
    title: "The Sun-Scorched Sands",
    description: "끝없이 펼쳐진 사막과 유리 평원입니다. 강렬한 태양 에너지가 넘치며, 연금술과 유리 세공 기술이 발달하기 최적의 장소입니다.",
    climate: "건조, 극고온",
    resources: "규사, 태양광 에너지, 향신료",
    populationDensity: "오아시스 중심 밀집",
    hazards: "모래 폭풍, 탈수, 유리 골렘",
    coordinates: { x: 50, y: 85 }
  },
  "East": {
    title: "The Void Archipelago",
    description: "별이 가장 가깝게 보이는 신비로운 군도입니다. 기이한 조류와 천문 현상이 관측되며, 현실과 공허의 경계가 얇습니다.",
    climate: "해양성, 잦은 안개",
    resources: "별똥별 조각, 신비한 약초",
    populationDensity: "희박함 (유랑 생활)",
    hazards: "공허의 균열, 해일, 환각",
    coordinates: { x: 85, y: 50 }
  },
  "West": {
    title: "The Ironwood Forest",
    description: "거대한 금속성 나무들이 자라는 울창한 숲입니다. 자연과 기계가 융합된 독특한 생태계를 이루고 있습니다.",
    climate: "온대 우림, 습함",
    resources: "강철 목재, 생체 부품",
    populationDensity: "보통 (부족 단위)",
    hazards: "식인 식물, 부식성 포자, 기계 야수",
    coordinates: { x: 15, y: 50 }
  },
  "Center": {
    title: "The Golden Plains",
    description: "비옥한 토지와 평야가 펼쳐진 대륙의 심장부입니다. 농업과 대규모 건축에 유리하며, 문명의 중심지 역할을 합니다.",
    climate: "온대, 쾌적함",
    resources: "곡물, 황금, 인력",
    populationDensity: "매우 높음",
    hazards: "정치적 암투, 전염병, 이단 심문",
    coordinates: { x: 50, y: 50 }
  },
  "Coast": {
    title: "The Deep Ports",
    description: "대륙과 대양을 잇는 거점입니다. 무역과 탐험의 출발점이며, 깊은 바다 속에는 미지의 자원이 숨겨져 있습니다.",
    climate: "해안성, 강한 바람",
    resources: "해산물, 진주, 무역품",
    populationDensity: "높음",
    hazards: "해적, 심해 괴수, 폭풍우",
    coordinates: { x: 75, y: 75 }
  }
};

// Los textos del globo, traducidos.
//
// Hasta ahora estaban escritos en inglés dentro del componente, de modo que un
// portal en español mostraba «Postal code, city or country…» bajo un título que
// decía «Bienvenido». PlanetLogin es de marca blanca: quien lo integra elige el
// idioma de su página, y el globo tiene que seguirlo sin que haya que traducir
// las tripas de un paquete de npm.
//
// El inglés es la base y cada idioma solo declara lo que cambia, igual que el
// catálogo del portal. Un idioma que no esté aquí cae al inglés entero, y
// `labels` permite sobreescribir cualquier cadena suelta sin esperar a que este
// fichero la incluya.
export interface PlanetLoginLabels {
  /** Texto de ayuda del buscador. */
  placeholder: string;
  /** Rótulo del buscador para lectores de pantalla. */
  searchAria: string;
  /** Texto del botón que busca el lugar escrito. */
  locate: string;
  /** Rótulo de ese botón para lectores de pantalla. */
  locateAria: string;
  /** Descripción del globo para quien no lo ve: dice cómo manejarlo. */
  globeAria: string;
}

const en: PlanetLoginLabels = {
  placeholder: 'Postal code, city or country…',
  searchAria: 'Search by postal code, city or country',
  locate: 'Locate',
  locateAria: 'Locate and select this place',
  globeAria: 'Interactive globe. Arrow keys rotate, plus and minus zoom, Enter selects the country at the centre. Or use the search box below.',
};

const CATALOGUE: Record<string, Partial<PlanetLoginLabels>> = {
  en,
  es: {
    placeholder: 'Código postal, ciudad o país…',
    searchAria: 'Buscar por código postal, ciudad o país',
    locate: 'Localizar',
    locateAria: 'Localizar y seleccionar este lugar',
    globeAria: 'Globo interactivo. Las flechas lo giran, más y menos acercan y alejan, Intro selecciona el país del centro. También puedes usar el buscador de abajo.',
  },
  fr: {
    placeholder: 'Code postal, ville ou pays…',
    searchAria: 'Rechercher par code postal, ville ou pays',
    locate: 'Localiser',
    locateAria: 'Localiser et sélectionner ce lieu',
    globeAria: 'Globe interactif. Les flèches le font tourner, plus et moins zooment, Entrée sélectionne le pays au centre. Ou utilisez le champ de recherche ci-dessous.',
  },
  de: {
    placeholder: 'Postleitzahl, Stadt oder Land…',
    searchAria: 'Nach Postleitzahl, Stadt oder Land suchen',
    locate: 'Finden',
    locateAria: 'Diesen Ort finden und auswählen',
    globeAria: 'Interaktiver Globus. Pfeiltasten drehen ihn, Plus und Minus zoomen, die Eingabetaste wählt das Land in der Mitte. Oder nutzen Sie das Suchfeld darunter.',
  },
  pt: {
    placeholder: 'Código postal, cidade ou país…',
    searchAria: 'Pesquisar por código postal, cidade ou país',
    locate: 'Localizar',
    locateAria: 'Localizar e selecionar este lugar',
    globeAria: 'Globo interativo. As setas rodam-no, mais e menos aproximam e afastam, Enter seleciona o país do centro. Ou use a caixa de pesquisa abaixo.',
  },
  it: {
    placeholder: 'CAP, città o paese…',
    searchAria: 'Cerca per CAP, città o paese',
    locate: 'Individua',
    locateAria: 'Individua e seleziona questo luogo',
    globeAria: 'Globo interattivo. Le frecce lo ruotano, più e meno ingrandiscono, Invio seleziona il paese al centro. Oppure usa il campo di ricerca qui sotto.',
  },
  ja: {
    placeholder: '郵便番号、都市名、国名…',
    searchAria: '郵便番号、都市名、国名で検索',
    locate: '検索',
    locateAria: 'この場所を特定して選択',
    globeAria: 'インタラクティブな地球儀。矢印キーで回転、プラスとマイナスで拡大縮小、Enter キーで中央の国を選択します。下の検索ボックスも使えます。',
  },
};

/**
 * Textos para un idioma, con el inglés debajo. Acepta «es» o «es-ES»: se queda
 * con la parte anterior al guion, que es lo que llega de `navigator.language`.
 */
export function labelsFor(lang?: string, overrides?: Partial<PlanetLoginLabels>): PlanetLoginLabels {
  const base = CATALOGUE[(lang ?? '').toLowerCase().split('-')[0]] ?? {};
  return { ...en, ...base, ...(overrides ?? {}) };
}

/** Idiomas con traducción propia; el resto cae al inglés. */
export const LANGUAGES = Object.keys(CATALOGUE);

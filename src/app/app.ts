import { Component, computed, signal } from '@angular/core';

type CardMark = 'none' | 'wishlist' | 'red-flag';

interface Card {
  id: string;
  name: string;
  detail: string;
  mark: CardMark;
  blacklisted: boolean;
  drawn: boolean;
}

interface Deck {
  id: string;
  name: string;
  subtitle: string;
  symbol: string;
  cards: Card[];
}

interface DeckStats {
  hits: number;
  misses: number;
}

interface CurrentDraw {
  cardId: string;
  odds: number;
  result: boolean | null;
}

const createCards = (cards: Array<[string, string]>): Card[] =>
  cards.map(([name, detail], index) => ({
    id: `${name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${index}`,
    name,
    detail,
    mark: 'none',
    blacklisted: false,
    drawn: false,
  }));

const initialDecks: Deck[] = [
  {
    id: 'invader',
    name: 'Invader',
    subtitle: 'Original placeholder cards for testing',
    symbol: '⌁',
    cards: createCards([
      ['Coastal scouts', 'A small landing party reaches the quiet shore.'],
      ['Jungle surveyors', 'A team maps an unfamiliar stretch of forest.'],
      ['Mountain outpost', 'A distant lookout appears on the ridge.'],
      ['River expedition', 'Boats follow the current into the island interior.'],
      ['Marshland camp', 'A new camp takes shape among the reeds.'],
      ['Northern landing', 'Sails gather near a wind-swept beach.'],
      ['Ruined observatory', 'Explorers inspect a forgotten stone structure.'],
      ['Forest road', 'A narrow track cuts through the old trees.'],
      ['Harbor patrol', 'Watchful crews circle the sheltered bay.'],
      ['Highland survey', 'Scouts take notes from a rocky overlook.'],
    ]),
  },
  {
    id: 'event',
    name: 'Event',
    subtitle: 'Original placeholder cards for testing',
    symbol: '✳',
    cards: createCards([
      ['Unseasonal rain', 'A sudden shower changes the shape of the day.'],
      ['Drifting lanterns', 'Warm lights float across the evening water.'],
      ['A shared meal', 'Neighbors gather around a generous table.'],
      ['Strange footprints', 'Fresh tracks appear beside the old path.'],
      ['A passing storm', 'The clouds roll through and leave clear skies.'],
      ['Lost fishing nets', 'A tangled bundle washes up on the beach.'],
      ['The quiet bell', 'A distant chime carries over the hills.'],
      ['Seeds on the breeze', 'Small green shoots appear after the wind.'],
      ['A cracked bridge', 'The village crossing needs careful attention.'],
      ['The traveling storyteller', 'A visitor brings a tale from far away.'],
    ]),
  },
  {
    id: 'fear',
    name: 'Fear',
    subtitle: 'Original placeholder cards for testing',
    symbol: '◌',
    cards: createCards([
      ['Shadows at dusk', 'A strange shape moves at the edge of sight.'],
      ['Whispers in the reeds', 'The marsh carries a voice with no speaker.'],
      ['An empty footpath', 'No one takes the shortcut after sundown.'],
      ['Something in the fog', 'A broad silhouette fades into the mist.'],
      ['The silent clearing', 'Even the birds have left this place.'],
      ['A warning scratched in stone', 'The old marker bears a message.'],
      ['Lights on the far ridge', 'A row of small sparks appears at night.'],
      ['A door left open', 'The abandoned cabin is not as empty as it seemed.'],
      ['The distant cry', 'A lone call echoes across the valley.'],
      ['Footsteps overhead', 'The old house creaks from the upper floor.'],
    ]),
  },
  {
    id: 'major-power',
    name: 'Major Power',
    subtitle: 'Original placeholder cards for testing',
    symbol: '✧',
    cards: createCards([
      ['Tide-turning insight', 'A patient plan redirects a powerful current.'],
      ['Roots beneath the mountain', 'Ancient roots connect distant places.'],
      ['The horizon opens', 'A wide view reveals a path forward.'],
      ['Guardian of the deep', 'A quiet protector rises from the sea.'],
      ['Thunder over still water', 'A sudden force breaks the calm.'],
      ['The island remembers', 'Old stories return when they are needed.'],
      ['A thousand green shoots', 'New growth spreads across the hillside.'],
      ['The hidden passage', 'A forgotten route links two far shores.'],
      ['Stars find their way home', 'A clear night guides travelers safely.'],
      ['The great forest stirs', 'A sleeping wood begins to move.'],
    ]),
  },
  {
    id: 'minor-power',
    name: 'Minor Power',
    subtitle: 'Original placeholder cards for testing',
    symbol: '✦',
    cards: createCards([
      ['Gentle current', 'A small wave carries a message down the coast.'],
      ['Fern and feather', 'A new shelter takes shape among the ferns.'],
      ['Morning birdsong', 'A familiar melody brings everyone together.'],
      ['The patient stone', 'A steady landmark helps find the way.'],
      ['A spark in the rain', 'A tiny light refuses to go out.'],
      ['Winding footpath', 'A well-worn trail makes the journey easier.'],
      ['Clouds part at noon', 'Sunlight reaches the valley floor.'],
      ['A helpful breeze', 'A passing wind fills the waiting sails.'],
      ['Wildflowers return', 'Bright colors appear along the roadside.'],
      ['A pebble skips', 'Ripples spread farther than expected.'],
    ]),
  },
];

@Component({
  selector: 'app-root',
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  protected readonly decks = signal(initialDecks);
  protected readonly selectedDeckId = signal('invader');
  protected readonly currentDraws = signal<Record<string, CurrentDraw>>({});
  protected readonly deckStats = signal<Record<string, DeckStats>>({});
  protected readonly selectedDeck = computed(
    () => this.decks().find((deck) => deck.id === this.selectedDeckId()) ?? this.decks()[0],
  );
  protected readonly availableCards = computed(
    () => this.selectedDeck().cards.filter((card) => !card.blacklisted && !card.drawn),
  );
  protected readonly currentDraw = computed(() => this.currentDraws()[this.selectedDeckId()] ?? null);
  protected readonly drawnCard = computed(
    () => this.selectedDeck().cards.find((card) => card.id === this.currentDraw()?.cardId) ?? null,
  );
  protected readonly drawResult = computed(() => this.currentDraw()?.result ?? null);
  protected readonly drawNotice = computed(() => {
    const card = this.drawnCard();
    if (card?.mark === 'wishlist') return { kind: 'wishlist', text: 'Wishlist hit! This card was on your wishlist.' };
    if (card?.mark === 'red-flag') return { kind: 'red-flag', text: 'Red flag drawn — you flagged this card.' };
    return card ? { kind: 'neutral', text: 'This card was not wishlisted or red-flagged.' } : null;
  });
  protected readonly hasDrawnCards = computed(() => this.selectedDeck().cards.some((card) => card.drawn));
  protected readonly wishlistOdds = computed(() => this.oddsFor('wishlist'));
  protected readonly redFlagOdds = computed(() => this.oddsFor('red-flag'));
  protected readonly currentStats = computed(
    () => this.deckStats()[this.selectedDeckId()] ?? { hits: 0, misses: 0 },
  );
  protected readonly totalAttempts = computed(
    () => this.currentStats().hits + this.currentStats().misses,
  );
  protected readonly hitRate = computed(() =>
    this.totalAttempts() ? (this.currentStats().hits / this.totalAttempts()) * 100 : 0,
  );

  protected selectDeck(deckId: string): void {
    this.selectedDeckId.set(deckId);
  }

  protected drawCard(): void {
    if (this.drawnCard() && this.drawResult() === null) return;
    const cards = this.availableCards();
    if (!cards.length) return;

    const odds = 100 / cards.length;
    const card = cards[Math.floor(Math.random() * cards.length)];
    this.updateCard(card.id, (item) => ({ ...item, drawn: true }));
    this.currentDraws.update((draws) => ({
      ...draws,
      [this.selectedDeckId()]: { cardId: card.id, odds, result: null },
    }));
  }

  protected markResult(hit: boolean): void {
    const card = this.drawnCard();
    if (!card || this.drawResult() !== null) return;

    const deckId = this.selectedDeckId();
    const stats = this.deckStats()[deckId] ?? { hits: 0, misses: 0 };
    this.deckStats.update((allStats) => ({
      ...allStats,
      [deckId]: {
        hits: stats.hits + Number(hit),
        misses: stats.misses + Number(!hit),
      },
    }));
    this.currentDraws.update((draws) => ({
      ...draws,
      [deckId]: { ...draws[deckId], result: hit },
    }));
  }

  protected setCardMark(cardId: string, mark: Exclude<CardMark, 'none'>): void {
    this.updateCard(cardId, (card) => ({
      ...card,
      mark: card.mark === mark ? 'none' : mark,
    }));
  }

  protected toggleBlacklist(cardId: string): void {
    const card = this.selectedDeck().cards.find((item) => item.id === cardId);
    if (!card) return;

    const blacklisted = !card.blacklisted;
    this.updateCard(cardId, (item) => ({ ...item, blacklisted }));
  }

  protected resetDraws(): void {
    const deckId = this.selectedDeckId();
    this.decks.update((decks) =>
      decks.map((deck) =>
        deck.id === deckId
          ? { ...deck, cards: deck.cards.map((card) => ({ ...card, drawn: false })) }
          : deck,
      ),
    );
    const draws = { ...this.currentDraws() };
    delete draws[deckId];
    this.currentDraws.set(draws);
  }

  protected cardOdds(): number {
    return this.currentDraw()?.odds ?? 0;
  }

  protected cardProbability(card: Card): string {
    if (card.blacklisted) return '—';
    if (card.drawn) return 'Drawn';
    return this.availableCards().length
      ? `${Math.round(100 / this.availableCards().length)}%`
      : '—';
  }

  protected availableCount(deck: Deck): number {
    return deck.cards.filter((card) => !card.blacklisted && !card.drawn).length;
  }

  protected readonly Math = Math;

  private oddsFor(mark: Exclude<CardMark, 'none'>): number {
    const cards = this.availableCards();
    return cards.length ? (cards.filter((card) => card.mark === mark).length / cards.length) * 100 : 0;
  }

  private updateCard(cardId: string, update: (card: Card) => Card): void {
    const deckId = this.selectedDeckId();
    this.decks.update((decks) =>
      decks.map((deck) =>
        deck.id === deckId && !deck.cards.find((card) => card.id === cardId)?.drawn
          ? { ...deck, cards: deck.cards.map((card) => (card.id === cardId ? update(card) : card)) }
          : deck,
      ),
    );
  }
}

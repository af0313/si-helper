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
  symbol: string;
  cards: Card[];
}

interface CurrentDraw {
  cards: Array<{ cardId: string; odds: number }>;
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
    id: 'minor-power',
    name: 'Minor Power',
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
      ['Mossy stones', 'Soft green moss marks an old resting place.'],
      ['A familiar melody', 'Someone hums a tune from long ago.'],
      ['The rain-washed trail', 'The path is easier to follow after the rain.'],
      ['A circle of mushrooms', 'A curious pattern appears beneath the trees.'],
      ['Warm afternoon light', 'The hillside glows in the late sun.'],
      ['A shell in the grass', 'The sea has left a small gift inland.'],
      ['The patient heron', 'A tall bird watches the shallows in silence.'],
      ['A basket of berries', 'The harvest is better than expected.'],
      ['A drifting leaf', 'A single leaf finds its way downstream.'],
      ['The old footbridge', 'Careful steps make the crossing easy.'],
      ['A sleepy meadow', 'The tall grass sways in a gentle breeze.'],
      ['Bright morning stars', 'A few lights linger before sunrise.'],
      ['A hidden spring', 'Clear water bubbles up between the rocks.'],
      ['The winding creek', 'A narrow stream finds its way to the sea.'],
    ]),
  },
  {
    id: 'major-power',
    name: 'Major Power',
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
      ['The mountain answers', 'A deep echo rolls across the island.'],
      ['The boundless deep', 'A vast current gathers beneath the waves.'],
      ['A crown of living branches', 'The forest reaches toward the clouds.'],
      ['The storm remembers', 'Old winds return with renewed strength.'],
      ['The turning of seasons', 'The island shifts into a new rhythm.'],
      ['A bridge between worlds', 'A hidden threshold opens for a moment.'],
      ['The voice beneath the earth', 'A low murmur rises from the stone.'],
      ['The moonlit sanctuary', 'A sheltered glade glows in silver light.'],
    ]),
  },
  {
    id: 'event',
    name: 'Event',
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
    id: 'invader',
    name: 'Invader',
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
];

@Component({
  selector: 'app-root',
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  protected readonly decks = signal(initialDecks);
  protected readonly selectedDeckId = signal('minor-power');
  protected readonly currentDraws = signal<Record<string, CurrentDraw>>({});
  protected readonly drawCount = signal(1);
  protected readonly customDrawValue = signal('1');
  protected readonly powerDrawCounts = [1, 2, 3, 4, 6];
  protected readonly isPowerDeck = computed(() =>
    ['minor-power', 'major-power'].includes(this.selectedDeckId()),
  );
  protected readonly selectedDeck = computed(
    () => this.decks().find((deck) => deck.id === this.selectedDeckId()) ?? this.decks()[0],
  );
  protected readonly availableCards = computed(
    () => this.selectedDeck().cards.filter((card) => !card.blacklisted && !card.drawn),
  );
  protected readonly effectiveDrawCount = computed(() =>
    Math.min(this.drawCount(), this.availableCards().length),
  );
  protected readonly currentDraw = computed(() => this.currentDraws()[this.selectedDeckId()] ?? null);
  protected readonly drawnCards = computed(
    () =>
      this.currentDraw()?.cards.flatMap(({ cardId, odds }) => {
        const card = this.selectedDeck().cards.find((item) => item.id === cardId);
        return card ? [{ card, odds }] : [];
      }) ?? [],
  );
  protected readonly drawNotices = computed(() =>
    this.drawnCards().flatMap(({ card }) => {
      if (card.mark === 'wishlist') return [{ cardName: card.name, kind: 'wishlist' }];
      if (card.mark === 'red-flag') return [{ cardName: card.name, kind: 'red-flag' }];
      return [];
    }),
  );
  protected readonly hasDrawnCards = computed(() => this.selectedDeck().cards.some((card) => card.drawn));
  protected readonly wishlistOdds = computed(() => this.oddsFor('wishlist'));
  protected readonly redFlagOdds = computed(() => this.oddsFor('red-flag'));

  protected drawOddsFor(mark: Exclude<CardMark, 'none'>, count: number): number {
    return this.chanceOfMark(this.availableCards(), mark, count);
  }

  protected selectDeck(deckId: string): void {
    this.selectedDeckId.set(deckId);
    this.drawCount.set(1);
    this.customDrawValue.set('1');
  }

  protected drawCards(count: number): void {
    const cards = this.availableCards();
    if (!Number.isInteger(count) || count < 1 || count > cards.length) return;

    this.drawCount.set(count);
    this.customDrawValue.set(String(count));
    const odds = (count / cards.length) * 100;
    const remaining = [...cards];
    const drawn = Array.from({ length: count }, () => {
      const [card] = remaining.splice(Math.floor(Math.random() * remaining.length), 1);
      this.updateCard(card.id, (item) => ({ ...item, drawn: true }));
      return { cardId: card.id, odds };
    });
    this.currentDraws.update((draws) => ({
      ...draws,
      [this.selectedDeckId()]: { cards: drawn },
    }));
  }

  protected setCustomDrawValue(event: Event): void {
    const target = event.target;
    if (!(target instanceof HTMLInputElement)) return;

    const value = target.value;
    this.customDrawValue.set(value);
    const count = Number(value);
    this.drawCount.set(Number.isInteger(count) && count > 0 ? count : 0);
  }

  protected canDraw(count: number): boolean {
    return count > 0 && count <= this.availableCards().length;
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
    this.drawCount.set(1);
    this.customDrawValue.set('1');
  }

  protected cardProbability(card: Card): string {
    if (card.blacklisted) return '—';
    if (card.drawn) return 'Drawn';
    return this.availableCards().length && this.drawCount() > 0
      ? `${Math.round((Math.min(this.drawCount(), this.availableCards().length) / this.availableCards().length) * 100)}%`
      : '—';
  }

  protected availableCount(deck: Deck): number {
    return deck.cards.filter((card) => !card.blacklisted && !card.drawn).length;
  }

  protected readonly Math = Math;

  private oddsFor(mark: Exclude<CardMark, 'none'>): number {
    return this.chanceOfMark(this.availableCards(), mark, this.drawCount());
  }

  private chanceOfMark(cards: Card[], mark: Exclude<CardMark, 'none'>, count: number): number {
    const drawCount = Math.min(count, cards.length);
    const markedCount = cards.filter((card) => card.mark === mark).length;
    if (!cards.length || drawCount <= 0 || !markedCount) return 0;
    if (drawCount > cards.length - markedCount) return 100;

    let noHitProbability = 1;
    for (let index = 0; index < drawCount; index++) {
      noHitProbability *= (cards.length - markedCount - index) / (cards.length - index);
    }
    return (1 - noHitProbability) * 100;
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

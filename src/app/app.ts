import { Component, computed, signal } from '@angular/core';
import { cardNames } from './card-data';

type CardMark = 'none' | 'wishlist' | 'red-flag';

interface Card {
  id: string;
  name: string;
  mark: CardMark;
  blacklisted: boolean;
  drawn: boolean;
  taken: boolean;
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

const blacklistStorageKey = 'si-helper-blacklist';

const createCards = (cards: readonly string[]): Card[] =>
  cards.map((name, index) => ({
    id: `${name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${index}`,
    name,
    mark: 'none',
    blacklisted: false,
    drawn: false,
    taken: false,
  }));

const initialDecks: Deck[] = [
  {
    id: 'minor-power',
    name: 'Minor Power',
    symbol: '✦',
    cards: createCards(cardNames.minorPower),
  },
  {
    id: 'major-power',
    name: 'Major Power',
    symbol: '✧',
    cards: createCards(cardNames.majorPower),
  },
  {
    id: 'event',
    name: 'Event',
    symbol: '✳',
    cards: createCards(cardNames.event),
  },
  {
    id: 'fear',
    name: 'Fear',
    symbol: '◌',
    cards: createCards(cardNames.fear),
  },
  {
    id: 'blight',
    name: 'Blight',
    symbol: '✺',
    cards: createCards(cardNames.blight),
  },
];

const savedBlacklistIds = (): Set<string> => {
  if (typeof localStorage === 'undefined') return new Set();
  return new Set(localStorage.getItem(blacklistStorageKey)?.split('\n').filter(Boolean) ?? []);
};

const createDeckState = (blacklistedIds: Set<string>): Deck[] =>
  initialDecks.map((deck) => ({
    ...deck,
    cards: deck.cards.map((card) => ({
      ...card,
      blacklisted: blacklistedIds.has(card.id),
    })),
  }));

@Component({
  selector: 'app-root',
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  protected readonly decks = signal(createDeckState(savedBlacklistIds()));
  protected readonly selectedDeckId = signal('minor-power');
  protected readonly frenchAdversary = signal(false);
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
    () => this.selectedDeck().cards.filter((card) => this.isAvailable(card)),
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
    const cards = this.availableCards();
    return this.chanceOfMark(count > cards.length ? this.cardsInCycle() : cards, mark, count);
  }

  protected selectDeck(deckId: string): void {
    this.selectedDeckId.set(deckId);
    this.drawCount.set(1);
    this.customDrawValue.set('1');
  }

  protected setFrenchAdversary(event: Event): void {
    const target = event.target;
    if (target instanceof HTMLInputElement) this.frenchAdversary.set(target.checked);
  }

  protected drawCards(count: number): void {
    if (!this.canDraw(count)) return;

    if (count > this.availableCards().length) this.recycleDrawnCards();
    const cards = this.availableCards();

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

  protected proceed(): void {
    const draws = { ...this.currentDraws() };
    delete draws[this.selectedDeckId()];
    this.currentDraws.set(draws);
    this.drawCount.set(1);
    this.customDrawValue.set('1');
  }

  protected setCustomDrawValue(event: Event): void {
    const target = event.target;
    if (!(target instanceof HTMLInputElement)) return;

    const value = target.value;
    this.customDrawValue.set(value);
    const parsedCount = Number(value);
    const count = Number.isInteger(parsedCount) && parsedCount > 0 ? Math.min(parsedCount, 10) : 0;
    this.drawCount.set(count);
    if (count && count !== parsedCount) this.customDrawValue.set(String(count));
  }

  protected canDraw(count: number): boolean {
    return count > 0 && count <= this.cardsInCycle().length;
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
    this.saveBlacklist();
  }

  protected toggleTaken(cardId: string): void {
    this.updateCard(cardId, (card) => ({ ...card, taken: !card.taken }), true);
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

  protected resetSession(): void {
    this.decks.set(createDeckState(savedBlacklistIds()));
    this.currentDraws.set({});
    this.drawCount.set(1);
    this.customDrawValue.set('1');
    this.selectedDeckId.set(initialDecks[0].id);
    this.frenchAdversary.set(false);
  }

  protected cardProbability(card: Card): string {
    if (card.blacklisted || card.taken || (!this.frenchAdversary() && this.isFrenchOnly(card))) return '—';
    if (card.drawn) return 'Drawn';
    const available = this.availableCards();
    const oddsPool = this.drawCount() > available.length ? this.cardsInCycle() : available;
    return oddsPool.includes(card) && oddsPool.length && this.drawCount() > 0
      ? `${Math.round((Math.min(this.drawCount(), oddsPool.length) / oddsPool.length) * 100)}%`
      : '—';
  }

  protected availableCount(deck: Deck): number {
    return deck.cards.filter((card) => this.isAvailable(card)).length;
  }

  protected isFrenchOnly(card: Card): boolean {
    return card.name === 'Slave Rebellion';
  }

  protected readonly Math = Math;

  protected fanAngle(index: number): number {
    const midpoint = (this.drawnCards().length - 1) / 2;
    return (index - midpoint) * 3;
  }

  private oddsFor(mark: Exclude<CardMark, 'none'>): number {
    return this.drawOddsFor(mark, this.drawCount());
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

  private updateCard(cardId: string, update: (card: Card) => Card, allowDrawn = false): void {
    const deckId = this.selectedDeckId();
    this.decks.update((decks) =>
      decks.map((deck) =>
        deck.id === deckId &&
        (allowDrawn || !deck.cards.find((card) => card.id === cardId)?.drawn)
          ? { ...deck, cards: deck.cards.map((card) => (card.id === cardId ? update(card) : card)) }
          : deck,
      ),
    );
  }

  private isAvailable(card: Card): boolean {
    return this.isInCycle(card) && !card.drawn;
  }

  private isInCycle(card: Card): boolean {
    return !card.blacklisted && !card.taken && (!this.isFrenchOnly(card) || this.frenchAdversary());
  }

  private cardsInCycle(): Card[] {
    return this.selectedDeck().cards.filter((card) => this.isInCycle(card));
  }

  private recycleDrawnCards(): void {
    const deckId = this.selectedDeckId();
    this.decks.update((decks) =>
      decks.map((deck) =>
        deck.id === deckId
          ? {
              ...deck,
              cards: deck.cards.map((card) =>
                card.drawn && this.isInCycle(card) ? { ...card, drawn: false } : card,
              ),
            }
          : deck,
      ),
    );
    const draws = { ...this.currentDraws() };
    delete draws[deckId];
    this.currentDraws.set(draws);
  }

  private saveBlacklist(): void {
    if (typeof localStorage === 'undefined') return;
    const ids = this.decks()
      .flatMap((deck) => deck.cards)
      .filter((card) => card.blacklisted)
      .map((card) => card.id);
    localStorage.setItem(blacklistStorageKey, ids.join('\n'));
  }
}

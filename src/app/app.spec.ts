import { TestBed } from '@angular/core/testing';
import { App } from './app';
import { vi } from 'vitest';

describe('App', () => {
  beforeEach(async () => {
    localStorage.removeItem('si-helper-blacklist');
    await TestBed.configureTestingModule({
      imports: [App],
    })
      .compileComponents();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });

  it('should render the five supplied card decks in draw order without Invader', async () => {
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('header')).toBeNull();
    expect(compiled.querySelector('.page-heading')).toBeNull();
    expect(compiled.querySelectorAll('.deck-option').length).toBe(5);
    expect([...compiled.querySelectorAll('.deck-option-name')].map((item) => item.textContent?.trim()))
      .toEqual(['Minor Power', 'Major Power', 'Event', 'Fear', 'Blight']);
    expect(compiled.querySelectorAll('.deck-option-count')[0]?.textContent).toContain('101 cards');
    expect(compiled.querySelectorAll('.deck-option-count')[1]?.textContent).toContain('78 cards');
    expect(compiled.querySelector('.list-card-title strong')?.textContent).toContain('Absorb Corruption');
    compiled.querySelectorAll<HTMLButtonElement>('.deck-option')[4]?.click();
    fixture.detectChanges();
    expect(compiled.querySelector('#deck-title')?.textContent).toContain('Blight');
    expect(compiled.querySelector('.list-card-title strong')?.textContent).toContain('Downward Spiral');
    expect(compiled.querySelectorAll('.deck-option-count')[4]?.textContent).toContain('23 cards');
  });

  it('should update next-draw odds when a card is wishlisted or removed', async () => {
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;

    expect(compiled.querySelector('.odds-row strong')?.textContent).toBe('0%');
    compiled.querySelector<HTMLButtonElement>('.wishlist-action')?.click();
    fixture.detectChanges();
    expect(compiled.querySelector('.odds-row strong')?.textContent).toBe('1%');

    compiled.querySelectorAll<HTMLButtonElement>('.remove-button')[1]?.click();
    fixture.detectChanges();
    expect(compiled.querySelector('.odds-row strong')?.textContent).toBe('1%');
  });

  it('should immediately consume each draw, update odds, and announce a wishlist hit', async () => {
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    const random = vi.spyOn(Math, 'random').mockReturnValue(0);

    compiled.querySelector<HTMLButtonElement>('.wishlist-action')?.click();
    fixture.detectChanges();
    compiled.querySelector<HTMLButtonElement>('.quick-draw-button')?.click();
    fixture.detectChanges();
    expect(compiled.querySelector('.draw-notices')?.textContent).toContain('Wishlist hit');
    expect(compiled.querySelector('.deck-option-count')?.textContent).toContain('100 left');
    expect(compiled.querySelector('.odds-row strong')?.textContent).toBe('0%');
    expect(compiled.querySelector('.drawn-chance')?.textContent).toContain('1%');

    expect(compiled.querySelectorAll('.drawn-tag').length).toBe(1);

    compiled.querySelector<HTMLButtonElement>('.quick-draw-button')?.click();
    fixture.detectChanges();
    expect(compiled.querySelector('.drawn-card-center h3')?.textContent).not.toBe('Absorb Corruption');
    expect(compiled.querySelector('.drawn-chance')?.textContent).toContain('1%');
    expect(compiled.querySelector('.draw-notices')).toBeNull();
    expect(compiled.querySelector('.hit-button, .miss-button')).toBeNull();
    random.mockRestore();
  });

  it('should announce red-flag draws and allow a fresh shuffle', async () => {
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    const random = vi.spyOn(Math, 'random').mockReturnValue(0);

    compiled.querySelector<HTMLButtonElement>('.red-action')?.click();
    fixture.detectChanges();
    compiled.querySelector<HTMLButtonElement>('.quick-draw-button')?.click();
    fixture.detectChanges();

    expect(compiled.querySelector('.draw-notices')?.textContent).toContain('Red flag drawn');

    compiled.querySelector<HTMLButtonElement>('.reset-button')?.click();
    fixture.detectChanges();
    expect(compiled.querySelector('.deck-option-count')?.textContent).toContain('101 cards');
    expect(compiled.querySelector('.red-odds strong')?.textContent).toBe('1%');
    expect(compiled.querySelector('.reset-button')).toBeNull();
    random.mockRestore();
  });

  it('should draw 1, 2, 3, 4, and 6 power cards without replacement', () => {
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    const random = vi.spyOn(Math, 'random').mockReturnValue(0);

    for (let index = 0; index < 5; index++) {
      compiled.querySelectorAll<HTMLButtonElement>('.quick-draw-button')[index]?.click();
      fixture.detectChanges();
    }

    expect(compiled.querySelectorAll('.card-row-drawn').length).toBe(16);
    expect(compiled.querySelectorAll('.drawn-card').length).toBe(6);
    expect(compiled.querySelector('.deck-option-count')?.textContent).toContain('85 left');
    expect(compiled.querySelector('.drawn-chance')?.textContent).toContain('7%');

    random.mockRestore();
  });

  it('should show the probability of hitting a marked card for each batch size', () => {
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;

    compiled.querySelector<HTMLButtonElement>('.wishlist-action')?.click();
    fixture.detectChanges();

    expect(compiled.querySelectorAll<HTMLButtonElement>('.quick-draw-button')[4]?.textContent)
      .toContain('♡ 6%');
  });

  it('should support a custom power draw and restrict other decks to one card', () => {
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    const random = vi.spyOn(Math, 'random').mockReturnValue(0);
    const input = compiled.querySelector<HTMLInputElement>('#custom-draw-count');

    expect(input).not.toBeNull();
    input!.value = '7';
    input!.dispatchEvent(new Event('input'));
    fixture.detectChanges();
    compiled.querySelector<HTMLButtonElement>('.custom-draw button')?.click();
    fixture.detectChanges();

    expect(compiled.querySelectorAll('.drawn-card').length).toBe(7);
    expect(compiled.querySelector('.deck-option-count')?.textContent).toContain('94 left');

    compiled.querySelectorAll<HTMLButtonElement>('.deck-option')[2]?.click();
    fixture.detectChanges();
    expect(compiled.querySelectorAll('.quick-draw-button').length).toBe(0);
    compiled.querySelector<HTMLButtonElement>('.draw-button')?.click();
    fixture.detectChanges();
    expect(compiled.querySelectorAll('.drawn-card').length).toBe(1);

    random.mockRestore();
  });

  it('should cap custom power draws at 10 cards', () => {
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    const input = compiled.querySelector<HTMLInputElement>('#custom-draw-count');

    expect(input).not.toBeNull();
    expect(input!.max).toBe('10');
    input!.value = '11';
    input!.dispatchEvent(new Event('input'));
    fixture.detectChanges();

    expect(input!.value).toBe('10');
    compiled.querySelector<HTMLButtonElement>('.custom-draw button')?.click();
    fixture.detectChanges();
    expect(compiled.querySelectorAll('.drawn-card').length).toBe(10);
    expect(compiled.querySelector('.drawn-cards')?.classList.contains('fanned-cards')).toBe(true);
    expect([...compiled.querySelectorAll<HTMLElement>('.drawn-card')].every((card) =>
      card.style.getPropertyValue('--fan-angle'),
    )).toBe(true);
  });

  it('should persist blacklisted cards and keep them out after a reset', () => {
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;

    compiled.querySelectorAll<HTMLButtonElement>('.deck-option')[2]?.click();
    fixture.detectChanges();
    const numinousRow = [...compiled.querySelectorAll<HTMLElement>('.card-row')].find((row) =>
      row.textContent?.includes('Numinous Crisis'),
    );
    expect(numinousRow).toBeDefined();
    numinousRow?.querySelector<HTMLButtonElement>('.remove-button')?.click();
    fixture.detectChanges();

    expect(compiled.querySelector('.deck-heading-copy p')?.textContent).toContain('61 remaining');
    expect(numinousRow?.textContent).toContain('Removed');
    expect(localStorage.getItem('si-helper-blacklist')).toContain('numinous-crisis');

    const restoredFixture = TestBed.createComponent(App);
    restoredFixture.detectChanges();
    const restoredCompiled = restoredFixture.nativeElement as HTMLElement;
    restoredCompiled.querySelectorAll<HTMLButtonElement>('.deck-option')[2]?.click();
    restoredFixture.detectChanges();
    expect(restoredCompiled.querySelector('.deck-heading-copy p')?.textContent).toContain('61 remaining');
    expect(
      [...restoredCompiled.querySelectorAll<HTMLElement>('.card-row')].find((row) =>
        row.textContent?.includes('Numinous Crisis'),
      )?.textContent,
    ).toContain('Removed');

    compiled.querySelector<HTMLButtonElement>('.session-reset-button')?.click();
    fixture.detectChanges();
    compiled.querySelectorAll<HTMLButtonElement>('.deck-option')[2]?.click();
    fixture.detectChanges();
    const restoredRow = [...compiled.querySelectorAll<HTMLElement>('.card-row')].find((row) =>
      row.textContent?.includes('Numinous Crisis'),
    );
    expect(compiled.querySelector('.deck-heading-copy p')?.textContent).toContain('61 remaining');
    expect(restoredRow?.textContent).toContain('Removed');
  });

  it('should include Slave Rebellion only when the French adversary is selected', () => {
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;

    compiled.querySelectorAll<HTMLButtonElement>('.deck-option')[2]?.click();
    fixture.detectChanges();
    const slaveRebellionRow = [...compiled.querySelectorAll<HTMLElement>('.card-row')].find((row) =>
      row.textContent?.includes('Slave Rebellion'),
    );
    expect(slaveRebellionRow?.textContent).toContain('French only');
    expect(slaveRebellionRow?.querySelector('.card-probability')?.textContent).toContain('—');
    expect(compiled.querySelector('.deck-heading-copy p')?.textContent).toContain('62 remaining');

    compiled.querySelector<HTMLInputElement>('.adversary-toggle input')?.click();
    fixture.detectChanges();
    expect(slaveRebellionRow?.textContent).not.toContain('French only');
    expect(slaveRebellionRow?.querySelector('.card-probability')?.textContent).toContain('2%');
    expect(compiled.querySelector('.deck-heading-copy p')?.textContent).toContain('63 remaining');
  });

  it('should automatically recycle drawn cards when the pile is exhausted, excluding taken cards', () => {
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    const random = vi.spyOn(Math, 'random').mockReturnValue(0);

    compiled.querySelectorAll<HTMLButtonElement>('.deck-option')[3]?.click();
    fixture.detectChanges();
    const fearRows = [...compiled.querySelectorAll<HTMLElement>('.card-row')];
    fearRows[1]?.querySelector<HTMLButtonElement>('.wishlist-action')?.click();
    for (const row of fearRows.slice(2)) {
      row.querySelector<HTMLButtonElement>('.remove-button')?.click();
    }
    fixture.detectChanges();
    expect(compiled.querySelector('.deck-heading-copy p')?.textContent).toContain('2 remaining');

    compiled.querySelector<HTMLButtonElement>('.draw-button')?.click();
    fixture.detectChanges();
    expect(compiled.querySelector('.drawn-card-center h3')?.textContent).toContain('Avoid the Dahan');
    compiled.querySelector<HTMLButtonElement>('.drawn-take-button')?.click();
    fixture.detectChanges();
    compiled.querySelector<HTMLButtonElement>('.proceed-button')?.click();
    fixture.detectChanges();

    compiled.querySelector<HTMLButtonElement>('.draw-button')?.click();
    fixture.detectChanges();
    expect(compiled.querySelector('.drawn-card-center h3')?.textContent).toContain('Belief Takes Root');
    compiled.querySelector<HTMLButtonElement>('.proceed-button')?.click();
    fixture.detectChanges();
    expect(compiled.querySelector<HTMLButtonElement>('.draw-button')?.disabled).toBe(false);
    expect(compiled.querySelector('.odds-row strong')?.textContent).toBe('100%');

    compiled.querySelector<HTMLButtonElement>('.draw-button')?.click();
    fixture.detectChanges();
    expect(compiled.querySelector('.drawn-card-center h3')?.textContent).toContain('Belief Takes Root');
    expect(compiled.querySelector('.draw-notices')?.textContent).toContain('Wishlist hit');
    expect(compiled.querySelector('.deck-heading-copy p')?.textContent).toContain('0 remaining');
    expect(compiled.querySelectorAll('.card-row-drawn').length).toBe(2);
    expect(
      [...compiled.querySelectorAll<HTMLElement>('.card-row')].find((row) =>
        row.textContent?.includes('Avoid the Dahan'),
      )?.textContent,
    ).toContain('Taken');
    random.mockRestore();
  });

  it('should keep taken cards out after shuffling and reset every deck for a new session', () => {
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;

    const random = vi.spyOn(Math, 'random').mockReturnValue(0);
    compiled.querySelector<HTMLButtonElement>('.quick-draw-button')?.click();
    fixture.detectChanges();
    expect(compiled.querySelector('.take-button')).not.toBeNull();
    compiled.querySelector<HTMLButtonElement>('.drawn-take-button')?.click();
    fixture.detectChanges();
    expect(compiled.querySelector('.deck-option-count')?.textContent).toContain('100 left');
    expect(compiled.querySelector('.taken-tag')?.textContent).toContain('Taken');
    expect(compiled.querySelector('.drawn-take-button')?.textContent).toContain('Taken');

    compiled.querySelector<HTMLButtonElement>('.reset-button')?.click();
    fixture.detectChanges();
    expect(compiled.querySelector('.deck-option-count')?.textContent).toContain('100 left');
    expect(compiled.querySelectorAll('.card-row-drawn').length).toBe(0);
    expect(compiled.querySelector('.taken-tag')?.textContent).toContain('Taken');

    compiled.querySelectorAll<HTMLButtonElement>('.deck-option')[1]?.click();
    fixture.detectChanges();
    compiled.querySelectorAll<HTMLButtonElement>('.remove-button')[0]?.click();
    compiled.querySelectorAll<HTMLButtonElement>('.wishlist-action')[1]?.click();
    fixture.detectChanges();
    compiled.querySelector<HTMLButtonElement>('.session-reset-button')?.click();
    fixture.detectChanges();

    expect(compiled.querySelector('#deck-title')?.textContent).toContain('Minor Power');
    expect(compiled.querySelector('.deck-option-count')?.textContent).toContain('101 left');
    expect(compiled.querySelectorAll('.deck-option-count')[1]?.textContent).toContain('77 left');
    expect(compiled.querySelectorAll('.taken-tag').length).toBe(0);
    expect(compiled.querySelectorAll('.removed-tag').length).toBe(0);
    expect(compiled.querySelectorAll('.wishlist-tag').length).toBe(0);
    random.mockRestore();
  });

  it('should clear the drawn reveal on proceed without returning cards to the deck', () => {
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    const random = vi.spyOn(Math, 'random').mockReturnValue(0);

    compiled.querySelector<HTMLButtonElement>('.quick-draw-button')?.click();
    fixture.detectChanges();
    expect(compiled.querySelectorAll('.drawn-card').length).toBe(1);
    compiled.querySelector<HTMLButtonElement>('.proceed-button')?.click();
    fixture.detectChanges();

    expect(compiled.querySelectorAll('.drawn-card').length).toBe(0);
    expect(compiled.querySelector('.proceed-button')).toBeNull();
    expect(compiled.querySelectorAll('.card-row-drawn').length).toBe(1);
    expect(compiled.querySelector('.deck-option-count')?.textContent).toContain('100 left');

    compiled.querySelector<HTMLButtonElement>('.quick-draw-button')?.click();
    fixture.detectChanges();
    expect(compiled.querySelectorAll('.drawn-card').length).toBe(1);
    expect(compiled.querySelector('.drawn-card-center h3')?.textContent).not.toContain('Absorb Corruption');
    random.mockRestore();
  });
});

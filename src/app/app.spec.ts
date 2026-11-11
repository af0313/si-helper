import { TestBed } from '@angular/core/testing';
import { App } from './app';
import { vi } from 'vitest';

describe('App', () => {
  beforeEach(async () => {
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

  it('should render the five custom placeholder decks in draw order', async () => {
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('header')).toBeNull();
    expect(compiled.querySelector('.page-heading')).toBeNull();
    expect(compiled.querySelectorAll('.deck-option').length).toBe(5);
    expect([...compiled.querySelectorAll('.deck-option-name')].map((item) => item.textContent?.trim()))
      .toEqual(['Minor Power', 'Major Power', 'Event', 'Fear', 'Invader']);
    expect(compiled.querySelectorAll('.deck-option-count')[0]?.textContent).toContain('24 cards');
    expect(compiled.querySelectorAll('.deck-option-count')[1]?.textContent).toContain('18 cards');
  });

  it('should update next-draw odds when a card is wishlisted or removed', async () => {
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;

    expect(compiled.querySelector('.odds-row strong')?.textContent).toBe('0%');
    compiled.querySelector<HTMLButtonElement>('.wishlist-action')?.click();
    fixture.detectChanges();
    expect(compiled.querySelector('.odds-row strong')?.textContent).toBe('4%');

    compiled.querySelectorAll<HTMLButtonElement>('.remove-button')[1]?.click();
    fixture.detectChanges();
    expect(compiled.querySelector('.odds-row strong')?.textContent).toBe('4%');
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
    expect(compiled.querySelector('.deck-option-count')?.textContent).toContain('23 left');
    expect(compiled.querySelector('.odds-row strong')?.textContent).toBe('0%');
    expect(compiled.querySelector('.drawn-chance')?.textContent).toContain('4%');

    expect(compiled.querySelectorAll('.drawn-tag').length).toBe(1);

    compiled.querySelector<HTMLButtonElement>('.quick-draw-button')?.click();
    fixture.detectChanges();
    expect(compiled.querySelector('.drawn-card-center h3')?.textContent).not.toBe('Gentle current');
    expect(compiled.querySelector('.drawn-chance')?.textContent).toContain('4%');
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
    expect(compiled.querySelector('.deck-option-count')?.textContent).toContain('24 cards');
    expect(compiled.querySelector('.red-odds strong')?.textContent).toBe('4%');
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
    expect(compiled.querySelector('.deck-option-count')?.textContent).toContain('8 left');
    expect(compiled.querySelector('.drawn-chance')?.textContent).toContain('43%');

    random.mockRestore();
  });

  it('should show the probability of hitting a marked card for each batch size', () => {
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;

    compiled.querySelector<HTMLButtonElement>('.wishlist-action')?.click();
    fixture.detectChanges();

    expect(compiled.querySelectorAll<HTMLButtonElement>('.quick-draw-button')[4]?.textContent)
      .toContain('♡ 25%');
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
    expect(compiled.querySelector('.deck-option-count')?.textContent).toContain('17 left');

    compiled.querySelectorAll<HTMLButtonElement>('.deck-option')[2]?.click();
    fixture.detectChanges();
    expect(compiled.querySelectorAll('.quick-draw-button').length).toBe(0);
    compiled.querySelector<HTMLButtonElement>('.draw-button')?.click();
    fixture.detectChanges();
    expect(compiled.querySelectorAll('.drawn-card').length).toBe(1);

    random.mockRestore();
  });
});

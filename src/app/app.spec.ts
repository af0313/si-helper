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

  it('should render the five custom placeholder deck types', async () => {
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('h1')?.textContent).toContain('Keep track of your draws.');
    expect(compiled.querySelectorAll('.deck-option').length).toBe(5);
    expect([...compiled.querySelectorAll('.deck-option-name')].map((item) => item.textContent?.trim()))
      .toEqual(['Invader', 'Event', 'Fear', 'Major Power', 'Minor Power']);
  });

  it('should update next-draw odds when a card is wishlisted or removed', async () => {
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;

    expect(compiled.querySelector('.odds-row strong')?.textContent).toBe('0%');
    compiled.querySelector<HTMLButtonElement>('.wishlist-action')?.click();
    fixture.detectChanges();
    expect(compiled.querySelector('.odds-row strong')?.textContent).toBe('10%');

    compiled.querySelectorAll<HTMLButtonElement>('.remove-button')[1]?.click();
    fixture.detectChanges();
    expect(compiled.querySelector('.odds-row strong')?.textContent).toBe('11%');
  });

  it('should consume drawn cards, update odds, and announce a wishlist hit', async () => {
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    const random = vi.spyOn(Math, 'random').mockReturnValue(0);

    compiled.querySelector<HTMLButtonElement>('.wishlist-action')?.click();
    fixture.detectChanges();
    compiled.querySelector<HTMLButtonElement>('.draw-button')?.click();
    fixture.detectChanges();
    expect(compiled.querySelector('.draw-notice')?.textContent).toContain('Wishlist hit');
    expect(compiled.querySelector('.deck-option-count')?.textContent).toContain('9 left');
    expect(compiled.querySelector('.odds-row strong')?.textContent).toBe('0%');
    expect(compiled.querySelector('.drawn-chance')?.textContent).toContain('10%');

    compiled.querySelector<HTMLButtonElement>('.miss-button')?.click();
    fixture.detectChanges();
    expect(compiled.querySelector('.stat-pill strong')?.textContent).toBe('0');
    expect(compiled.querySelectorAll('.drawn-tag').length).toBe(1);

    compiled.querySelector<HTMLButtonElement>('.draw-button')?.click();
    fixture.detectChanges();
    expect(compiled.querySelector('.drawn-card-center h3')?.textContent).not.toBe('Coastal scouts');
    expect(compiled.querySelector('.drawn-chance')?.textContent).toContain('11%');
    random.mockRestore();
  });

  it('should announce red-flag draws and allow a fresh shuffle', async () => {
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    const random = vi.spyOn(Math, 'random').mockReturnValue(0);

    compiled.querySelector<HTMLButtonElement>('.red-action')?.click();
    fixture.detectChanges();
    compiled.querySelector<HTMLButtonElement>('.draw-button')?.click();
    fixture.detectChanges();

    expect(compiled.querySelector('.draw-notice')?.textContent).toContain('Red flag drawn');
    compiled.querySelector<HTMLButtonElement>('.hit-button')?.click();
    fixture.detectChanges();
    expect(compiled.querySelector('.stat-pill strong')?.textContent).toBe('1');

    compiled.querySelector<HTMLButtonElement>('.reset-button')?.click();
    fixture.detectChanges();
    expect(compiled.querySelector('.deck-option-count')?.textContent).toContain('10 left');
    expect(compiled.querySelector('.red-odds strong')?.textContent).toBe('10%');
    expect(compiled.querySelector('.reset-button')).toBeNull();
    random.mockRestore();
  });
});

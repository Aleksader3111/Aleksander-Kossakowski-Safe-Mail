import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { evaluateEmailPriority } from './prioritizer';
import { parseDocumentFromEmail } from './documentParser';

describe('JARVIS Mail Intelligence - Pure Logic Tests', () => {
  it('TEST J1: Sąd Rejonowy wezwanie otrzymuje priorytet P0', () => {
    const priority = evaluateEmailPriority({
      id: 'court-test',
      subject: 'Sąd Rejonowy dla Warszawy-Śródmieścia – Wezwanie na rozprawę sygn. II K 142/26',
      from: 'sekretariat@warszawa.sr.gov.pl',
      bodySnippet: 'Posiedzenie w sprawie odbędzie się w dniu 15 listopada 2026 r. o godz. 10:30 w sali 204. Stawiennictwo obowiązkowe.',
      fullBody: 'Sąd Rejonowy wzywa Pana do osobistego stawiennictwa w charakterze świadka.',
      category: 'INSTYTUCJE',
      overallRisk: 5,
    });

    assert.equal(priority.level, 'P0');
    assert.equal(priority.requiresAction, true);
    assert.ok(priority.reason.includes('P0'));
  });

  it('TEST J2: Pilne zapytanie biznesowe od klienta z terminem na dziś otrzymuje priorytet P1', () => {
    const priority = evaluateEmailPriority({
      id: 'biz-urgent',
      subject: 'PILNE: Prośba o przesłanie kosztorysu do końca dnia',
      from: 'klient@partner.pl',
      bodySnippet: 'Prosimy o pilne przesłanie poprawionego kosztorysu ASAP do dzisiaj do godz. 17:00.',
      category: 'OSOBISTE',
      overallRisk: 10,
    });

    assert.equal(priority.level, 'P1');
    assert.equal(priority.requiresReply, true);
  });

  it('TEST J3: Newsletter otrzymuje priorytet P3 lub P4 i nie wymaga pilnej akcji', () => {
    const priority = evaluateEmailPriority({
      id: 'newsletter-test',
      subject: 'Tygodnik Tech #42',
      from: 'redakcja@technews.pl',
      bodySnippet: 'Sprawdź najważniejsze wiadomości ze świata technologii w tym tygodniu.',
      category: 'NEWSLETTERY',
      overallRisk: 0,
    });

    assert.ok(priority.level === 'P3' || priority.level === 'P4');
    assert.equal(priority.requiresAction, false);
  });

  it('TEST J4: Wykryty phishing otrzymuje priorytet P4 (kwarantanna/zablokowany)', () => {
    const priority = evaluateEmailPriority({
      id: 'phish-test',
      subject: 'Twoje konto bankowe zostało zablokowane',
      from: 'security@pkobp-fake.net',
      bodySnippet: 'Zaloguj się natychmiast, aby odblokować środki.',
      category: 'PHISHING',
      overallRisk: 95,
    });

    assert.equal(priority.level, 'P4');
  });

  it('TEST J5: Parser dokumentów rozpoznaje sygnaturę sądową z wezwania', () => {
    const doc = parseDocumentFromEmail({
      id: 'court-doc-test',
      subject: 'Sąd Rejonowy – Wezwanie na posiedzenie sygn. II K 142/26',
      from: 'sekretariat@warszawa.sr.gov.pl',
      bodySnippet: 'Dotyczy sprawy o sygn. akt II K 142/26 w sali 204.',
    });

    assert.ok(doc !== null);
    assert.equal(doc?.type, 'SĄDOWY');
    assert.ok(doc?.docNumber?.includes('II K 142/26'));
  });

  it('TEST J6: Parser dokumentów rozpoznaje fakturę VAT i kwotę płatności', () => {
    const doc = parseDocumentFromEmail({
      id: 'invoice-doc-test',
      subject: 'Faktura VAT nr 104/2026 za usługi hostingowe',
      from: 'rozliczenia@hosting.pl',
      bodySnippet: 'W załączeniu przesyłamy fakturę VAT nr 104/2026. Kwota do zapłaty: 149.99 PLN. Termin płatności: 10 listopada 2026 r.',
    });

    assert.ok(doc !== null);
    assert.equal(doc?.type, 'FAKTURA');
    assert.ok(doc?.amount?.includes('149.99') || doc?.amount?.includes('PLN'));
  });
});

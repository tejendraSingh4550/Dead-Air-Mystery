import { CommonModule } from '@angular/common';
import { Component, computed, OnDestroy, signal } from '@angular/core';

type TranscriptLine = { time: string; text: string; clue?: string; evidence?: string };
type Tape = { id: string; title: string; date: string; length: string; source: string; transcript: TranscriptLine[] };
type Evidence = { id: string; title: string; detail: string; icon: string; tag: string };

const TAPES: Tape[] = [
  { id: 'last-call', title: 'The last call', date: '14 OCT · 11:17 PM', length: '00:42', source: 'ON-AIR RECORDING', transcript: [
    { time: '00:04', text: 'If anyone is still listening… the north light is out again.', clue: 'North light is out', evidence: 'blackout' },
    { time: '00:16', text: 'That bell. It should not be ringing. There is no wind tonight.', clue: 'The bell rang with no wind', evidence: 'bell' },
    { time: '00:28', text: 'Tell Ellis I found the ledger. He knows what happened in 1987.', clue: 'Mira found an old ledger', evidence: 'ledger' },
    { time: '00:37', text: '…someone is in the booth with me.', clue: 'A second person was there', evidence: 'second-voice' },
  ] },
  { id: 'maintenance', title: 'Maintenance log', date: '14 OCT · 10:51 PM', length: '00:31', source: 'STATION ARCHIVE', transcript: [
    { time: '00:03', text: 'Backup transmitter disconnected. Sign-off: E. Ward.', clue: 'Ellis signed off the transmitter', evidence: 'access-log' },
    { time: '00:14', text: 'The north light circuit was manually cut at 10:49 PM.', clue: 'The light was cut by hand', evidence: 'manual-cut' },
    { time: '00:23', text: 'Key 04 returned to the cabinet. No other keys logged out.', clue: 'Key 04 was returned', evidence: 'key-four' },
  ] },
  { id: 'weather', title: 'Weather band', date: '14 OCT · 11:40 PM', length: '00:26', source: 'COASTAL WEATHER SERVICE', transcript: [
    { time: '00:02', text: 'Clear skies over Greywick. Visibility: nine miles.', clue: 'The sky was clear', evidence: 'clear-skies' },
    { time: '00:12', text: 'No storm activity recorded in the northern channel.', clue: 'No storm caused the blackout', evidence: 'no-storm' },
    { time: '00:20', text: 'Wind speed: two knots. Sea state: calm.', clue: 'The sea was calm', evidence: 'calm-sea' },
  ] },
];

const EVIDENCE: Evidence[] = [
  { id: 'blackout', title: 'The blackout', detail: 'Mira says the north light went out before her final call.', icon: '◉', tag: 'AUDIO · 11:17 PM' },
  { id: 'bell', title: 'The impossible bell', detail: 'The bell rang with no wind. Someone pulled it from inside.', icon: '♧', tag: 'AUDIO · 11:17 PM' },
  { id: 'ledger', title: 'The 1987 ledger', detail: 'Mira found something Ellis did not want anyone to read.', icon: '▤', tag: 'AUDIO · 11:17 PM' },
  { id: 'second-voice', title: 'A second person', detail: 'A quiet breath is audible in the booth before the tape cuts.', icon: '⌁', tag: 'AUDIO · 11:17 PM' },
  { id: 'access-log', title: 'Ellis signed the log', detail: 'E. Ward disconnected the backup transmitter at 10:51 PM.', icon: '▧', tag: 'STATION LOG' },
  { id: 'manual-cut', title: 'Manual light cut', detail: 'The lighthouse circuit was switched off by hand.', icon: 'ϟ', tag: 'STATION LOG' },
  { id: 'key-four', title: 'Key 04', detail: 'The lighthouse key was supposedly returned before the call.', icon: '⚿', tag: 'STATION LOG' },
  { id: 'no-storm', title: 'No storm', detail: 'The coast was clear. The weather could not have caused the outage.', icon: '☼', tag: 'WEATHER BAND' },
];

@Component({
  selector: 'app-root', standalone: true, imports: [CommonModule],
  templateUrl: './app.html', styleUrl: './app.css',
})
export class App implements OnDestroy {
  protected readonly tapes = TAPES;
  protected readonly evidenceList = EVIDENCE;
  protected readonly view = signal<'case' | 'evidence' | 'people'>('case');
  protected readonly tapeId = signal('last-call');
  protected readonly found = signal<string[]>([]);
  protected readonly picked = signal<string[]>([]);
  protected readonly connected = signal(false);
  protected readonly playing = signal(false);
  protected readonly progress = signal(0);
  protected readonly ending = signal('');
  protected readonly activeTape = computed(() => TAPES.find((t) => t.id === this.tapeId())!);
  protected readonly playbackDuration = computed(() => Number(this.activeTape().length.split(':')[1] || 42));
  protected readonly evidence = computed(() => EVIDENCE.filter((e) => this.found().includes(e.id)));
  protected readonly progressPct = computed(() => Math.min(100, Math.round(this.found().length / 8 * 100)));
  protected readonly canAccuse = computed(() => this.connected() && this.found().length >= 4);
  private playback?: number;

  constructor() {
    try {
      const saved = localStorage.getItem('dead-air-case-07');
      if (saved) {
        const data = JSON.parse(saved);
        this.found.set(Array.isArray(data.found) ? data.found.filter((id: string) => EVIDENCE.some((e) => e.id === id)) : []);
        this.connected.set(data.connected === true);
        this.ending.set(typeof data.ending === 'string' ? data.ending : '');
      }
    } catch { /* Start a new case if browser storage is unavailable. */ }
  }

  protected selectTape(id: string) { this.stopPlayback(); this.tapeId.set(id); this.progress.set(0); }
  protected togglePlayback() {
    if (this.playing()) { this.stopPlayback(); return; }
    this.playing.set(true);
    this.playback = window.setInterval(() => {
      const next = this.progress() + 1;
      if (next >= this.playbackDuration()) { this.progress.set(0); this.stopPlayback(); }
      else this.progress.set(next);
    }, 1000);
  }
  private stopPlayback() { this.playing.set(false); if (this.playback !== undefined) { window.clearInterval(this.playback); this.playback = undefined; } }
  ngOnDestroy() { this.stopPlayback(); }

  protected collect(line: TranscriptLine) {
    if (!line.evidence || this.found().includes(line.evidence)) return;
    this.found.update((items) => [...items, line.evidence!]); this.save();
  }
  protected isFound(line: TranscriptLine) { return !!line.evidence && this.found().includes(line.evidence); }
  protected selectEvidence(id: string) {
    this.picked.update((items) => items.includes(id) ? items.filter((item) => item !== id) : items.length < 2 ? [...items, id] : [items[1], id]);
  }
  protected connectEvidence() {
    const selected = this.picked();
    const pairWorks = selected.includes('access-log') && selected.includes('no-storm');
    if (pairWorks) { this.connected.set(true); this.save(); }
  }
  protected accuse(name: string) {
    if (name === 'Ellis Ward') this.ending.set('correct');
    else this.ending.set('wrong');
    this.save();
  }
  protected resetCase() {
    this.stopPlayback(); this.found.set([]); this.picked.set([]); this.connected.set(false); this.ending.set(''); this.progress.set(0);
    try { localStorage.removeItem('dead-air-case-07'); } catch { /* In-memory reset still works. */ }
    this.view.set('case'); this.tapeId.set('last-call');
  }
  private save() {
    try { localStorage.setItem('dead-air-case-07', JSON.stringify({ found: this.found(), connected: this.connected(), ending: this.ending() })); } catch { /* The case can still be played without storage. */ }
  }
}

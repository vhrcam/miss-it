import {PlaybackReporter, Snapshot} from '../src/playback/PlaybackReporter';

const flush = () =>
  new Promise<void>((resolve) => setTimeout(() => resolve(), 0));

function setup(
  snapshot: Snapshot = {
    positionSec: 12.34,
    durationSec: 734.17,
    state: 'playing',
  },
) {
  const statuses: string[] = [];
  let cues = [{startSec: 10, endSec: 12, text: 'Hello'}];
  const reporter = new PlaybackReporter({
    apiUrl: 'http://miss-it.test',
    deviceKey: 'key',
    householdId: 'demo',
    contentId: 'tears-of-steel',
    title: 'Tears of Steel',
    snapshot: () => snapshot,
    takeCues: () => {
      const taken = cues;
      cues = [];
      return taken;
    },
    onStatus: (status) => statuses.push(status),
  });
  return {reporter, statuses};
}

const bodies = (mock: jest.Mock) =>
  mock.mock.calls.map(([, init]) => JSON.parse(init.body));

describe('PlaybackReporter', () => {
  afterEach(() => {
    delete (globalThis as any).fetch;
  });

  it('posts the playback contract', async () => {
    const fetchMock = jest.fn().mockResolvedValue({ok: true, status: 204});
    (globalThis as any).fetch = fetchMock;
    const {reporter, statuses} = setup();

    reporter.report('play');
    await flush();

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe('http://miss-it.test/v1/playback');
    expect(init.headers.Authorization).toBe('Bearer key');
    expect(JSON.parse(init.body)).toEqual({
      householdId: 'demo',
      contentId: 'tears-of-steel',
      title: 'Tears of Steel',
      durationSec: 734.2,
      positionSec: 12.3,
      state: 'playing',
      event: 'play',
      sentAt: expect.any(Number),
      cues: [{startSec: 10, endSec: 12, text: 'Hello'}],
    });
    expect(statuses).toEqual(['connected']);
  });

  it('sends one update at a time, in order', async () => {
    let finish = () => {};
    const fetchMock = jest
      .fn()
      .mockImplementationOnce(
        () =>
          new Promise(
            (resolve) => (finish = () => resolve({ok: true, status: 204})),
          ),
      )
      .mockResolvedValue({ok: true, status: 204});
    (globalThis as any).fetch = fetchMock;
    const {reporter} = setup();

    reporter.report('play');
    reporter.report('pause');
    await flush();
    expect(fetchMock).toHaveBeenCalledTimes(1);

    finish();
    await flush();
    expect(bodies(fetchMock).map((body) => body.event)).toEqual([
      'play',
      'pause',
    ]);
  });

  it('keeps cues from a failed send for the next one', async () => {
    const fetchMock = jest
      .fn()
      .mockRejectedValueOnce(new Error('offline'))
      .mockResolvedValue({ok: true, status: 204});
    (globalThis as any).fetch = fetchMock;
    const {reporter, statuses} = setup();

    reporter.report('tick');
    await flush();
    reporter.report('tick');
    await flush();

    const [first, second] = bodies(fetchMock);
    expect(first.cues).toHaveLength(1);
    expect(second.cues).toEqual(first.cues);
    expect(statuses).toEqual(['offline', 'connected']);
  });

  it('drops cues the server rejected as invalid', async () => {
    const fetchMock = jest
      .fn()
      .mockResolvedValueOnce({ok: false, status: 400})
      .mockResolvedValue({ok: true, status: 204});
    (globalThis as any).fetch = fetchMock;
    const {reporter} = setup();

    reporter.report('tick');
    await flush();
    reporter.report('tick');
    await flush();

    expect(bodies(fetchMock)[1].cues).toEqual([]);
  });
});

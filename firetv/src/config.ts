import tearsOfSteelCaptions from './captions/tearsOfSteel';

// The Vega Virtual Device reaches the Mac it runs on at 10.0.2.2.
export const rewind = {
  apiUrl: 'http://10.0.2.2:8787',
  deviceKey: 'dev-device-key',
  householdId: 'demo',
};

// The Fire TV media player only streams over HTTPS, so the film comes
// straight from Blender's mirrors. If one fails, the next one takes over.
const MIRRORS = [
  'https://mirrors.dotsrc.org/blender/blender-demo/movies/ToS',
  'https://ftp.nluug.nl/pub/graphics/blender/demo/movies/ToS',
  'https://ftp.halifax.rwth-aachen.de/blender/demo/movies/ToS',
];

export const film = {
  contentId: 'tears-of-steel',
  title: 'Tears of Steel',
  sources: MIRRORS.map((mirror) => `${mirror}/tears_of_steel_720p.mov`),
  captions: tearsOfSteelCaptions,
};

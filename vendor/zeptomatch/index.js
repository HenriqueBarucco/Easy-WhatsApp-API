const SEP_PATTERN = '[\\\\/]';
const SEGMENT_PATTERN = '[^\\\\/]*';

const cache = new Map();

const normalizePath = (value) => (value ?? '').replace(/\\+/g, '/');

const escapeRegex = (value) => value.replace(/[|\\{}()[\]^$+*?.]/g, '\\$&');

const globToRegex = (glob) => {
  let pattern = '';
  for (let index = 0; index < glob.length; index += 1) {
    const char = glob[index];
    const nextChar = glob[index + 1];

    if (char === '*') {
      if (nextChar === '*') {
        const nextNext = glob[index + 2];
        const consumesSep = nextNext === '/' || nextNext === '\\';
        pattern += consumesSep ? `${SEP_PATTERN}?` : '.*';
        if (consumesSep) {
          index += 2;
        } else {
          index += 1;
        }
      } else {
        pattern += SEGMENT_PATTERN;
      }
      continue;
    }

    if (char === '?') {
      pattern += '[^\\\\/]';
      continue;
    }

    if (char === '/') {
      pattern += SEP_PATTERN;
      continue;
    }

    pattern += escapeRegex(char);
  }

  return pattern || '.*';
};

const compile = (glob) => {
  const key = glob;
  if (!cache.has(key)) {
    const normalizedGlob = normalizePath(glob);
    const source = globToRegex(normalizedGlob);
    cache.set(key, new RegExp(`^${source}(?:${SEP_PATTERN})?$`, 's'));
  }

  return cache.get(key);
};

const match = (glob, target) => {
  if (glob == null) {
    return false;
  }

  const normalizedTarget = normalizePath(target);

  if (Array.isArray(glob)) {
    return glob.some((pattern) => match(pattern, normalizedTarget));
  }

  const regex = compile(glob);
  return regex.test(normalizedTarget);
};

match.compile = compile;
match.clearCache = () => cache.clear();

module.exports = match;

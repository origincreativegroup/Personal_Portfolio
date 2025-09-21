import { renderToStream } from '@builder.io/qwik/server';
import Root from './root.js';

export default function (opts: Parameters<typeof renderToStream>[0]) {
  return renderToStream(<Root />, {
    manifest: opts.manifest,
    base: opts.base,
  });
}

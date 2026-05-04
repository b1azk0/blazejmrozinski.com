import { test } from 'node:test';
import assert from 'node:assert/strict';
import { getWebSiteNode, SITE_URL } from '../src/lib/jsonld.ts';

test('getWebSiteNode includes a SearchAction potentialAction', () => {
  const node = getWebSiteNode();

  assert.ok(node.potentialAction, 'WebSite node missing potentialAction');
  assert.equal(node.potentialAction['@type'], 'SearchAction');

  const target = node.potentialAction.target;
  assert.equal(target['@type'], 'EntryPoint');
  assert.equal(
    target.urlTemplate,
    `${SITE_URL}/search/?q={search_term_string}`,
  );

  assert.equal(
    node.potentialAction['query-input'],
    'required name=search_term_string',
  );
});

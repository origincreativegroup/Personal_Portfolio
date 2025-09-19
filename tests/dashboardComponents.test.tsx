import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import {
  AssetPreviewList,
  DeliverablePreviewList,
  FreshnessBadge,
  computeFreshness,
  type ApiAssetPreview,
  type ApiDeliverablePreview,
  type ApiProject,
} from '../src/pages/DashboardPage.tsx';

describe('dashboard UI building blocks', () => {
  it('renders asset previews from data returned by the API', () => {
    const assets: ApiAssetPreview[] = [
      {
        id: 'asset-1',
        label: 'hero.png',
        relativePath: 'assets/images/hero.png',
        type: 'image',
        updatedAt: new Date('2024-06-01T10:00:00Z').toISOString(),
      },
      {
        id: 'asset-2',
        label: 'case-study.pdf',
        relativePath: 'assets/docs/case-study.pdf',
        type: 'document',
        updatedAt: new Date('2024-06-02T12:00:00Z').toISOString(),
      },
    ];

    const markup = renderToStaticMarkup(
      <AssetPreviewList assets={assets} title="Assets (2)" />,
    );

    assert.match(markup, /hero\.png/);
    assert.match(markup, /case-study\.pdf/);
  });

  it('renders deliverables and freshness indicators', () => {
    const deliverables: ApiDeliverablePreview[] = [
      {
        id: 'del-1',
        label: 'final.zip',
        relativePath: 'deliverables/final.zip',
        format: 'zip',
        updatedAt: new Date('2024-07-01T08:00:00Z').toISOString(),
      },
    ];

    const project: ApiProject = {
      id: 'proj-1',
      slug: 'proj-1',
      title: 'Filesystem bridge',
      summary: 'Sync demo',
      organization: 'Acme',
      workType: 'Design',
      year: 2024,
      tags: ['sync'],
      highlights: ['bridge'],
      syncStatus: 'clean',
      lastSyncedAt: new Date('2024-07-04T10:00:00Z').toISOString(),
      fsLastModified: new Date('2024-07-05T12:00:00Z').toISOString(),
      metadataUpdatedAt: null,
      briefUpdatedAt: null,
      assetCount: 2,
      deliverableCount: 1,
      assetPreviews: [],
      deliverablePreviews: [],
    };

    const freshness = computeFreshness(project);
    assert.strictEqual(freshness, 'filesystem-updated');

    const badge = renderToStaticMarkup(<FreshnessBadge project={project} />);
    assert.match(badge, /Filesystem newer/);

    const listMarkup = renderToStaticMarkup(
      <DeliverablePreviewList deliverables={deliverables} />,
    );
    assert.match(listMarkup, /final\.zip/);
  });
});

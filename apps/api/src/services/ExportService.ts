import PDFDocument from 'pdfkit';
import type { ProjectT, TemplateT } from '@portfolioforge/schemas';
import type { AnyBlockT } from '@portfolioforge/schemas';

const BRAND_PURPLE = '#5a3cf4';
const BRAND_LAVENDER = '#cbc0ff';
const BRAND_TEXT = '#1a1a1a';

export class ExportService {
  async generatePdf(project: ProjectT, template?: TemplateT): Promise<Buffer> {
    const doc = new PDFDocument({ size: 'A4', margin: 48 });
    const chunks: Buffer[] = [];
    doc.on('data', (chunk) => chunks.push(chunk as Buffer));
    doc.on('error', (error) => {
      throw error;
    });

    doc.fontSize(24).fillColor(BRAND_PURPLE).text(project.title, { continued: false });
    if (project.summary) {
      doc.moveDown().fontSize(12).fillColor(BRAND_TEXT).text(project.summary);
    }

    doc.moveDown();
    doc.fillColor(BRAND_PURPLE).fontSize(14).text('Project Blocks');
    renderBlocks(doc, project.blocks);

    if (template) {
      doc.addPage();
      doc.fillColor(BRAND_PURPLE).fontSize(14).text(`Template Layout: ${template.name}`);
      template.slots.forEach((slot) => {
        doc.fillColor(BRAND_TEXT).fontSize(12).text(`• ${slot}`);
      });
    }

    doc.end();
    return await new Promise<Buffer>((resolve) => {
      doc.on('end', () => resolve(Buffer.concat(chunks)));
    });
  }

  renderPublicHtml(project: ProjectT, template?: TemplateT) {
    const head = `<!doctype html><html lang="en"><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width, initial-scale=1"/><title>${
      project.title
    }</title><meta name="description" content="${project.summary ?? ''}"/><style>${publicStyles}</style></head><body>`;
    const footer = '</body></html>';
    const body = [`<header class="hero"><h1>${project.title}</h1>${project.summary ? `<p>${project.summary}</p>` : ''}</header>`];
    body.push('<section class="blocks">');
    for (const block of project.blocks) {
      body.push(renderBlockHtml(block));
    }
    body.push('</section>');
    if (template) {
      body.push(`<aside class="template-info"><h2>Template: ${template.name}</h2><ul>${template.slots
        .map((slot) => `<li>${slot}</li>`)
        .join('')}</ul></aside>`);
    }
    return head + body.join('') + footer;
  }
}

const renderBlocks = (doc: PDFKit.PDFDocument, blocks: AnyBlockT[]) => {
  blocks
    .slice()
    .sort((a, b) => a.order - b.order)
    .forEach((block) => {
      doc.moveDown();
      doc.fillColor(BRAND_LAVENDER).fontSize(12).text(block.type.toUpperCase());
      doc.fillColor(BRAND_TEXT);
      switch (block.type) {
        case 'text':
          doc.fontSize(block.variant === 'heading' ? 16 : block.variant === 'quote' ? 12 : 11).text(block.content);
          break;
        case 'media':
          doc.fontSize(11).text(`Media (${block.media.kind}): ${block.media.url}`);
          if (block.caption) doc.text(`Caption: ${block.caption}`);
          break;
        case 'timeline':
          block.items.forEach((item) => {
            doc.text(`${item.label}: ${item.start}${item.end ? ` → ${item.end}` : ''}${item.note ? ` — ${item.note}` : ''}`);
          });
          break;
        case 'chart':
          doc.text(`Chart ${block.kind} with labels: ${block.labels.join(', ')}`);
          block.series.forEach((series) => {
            doc.text(`${series.name}: ${series.data.join(', ')}`);
          });
          break;
        case 'impact':
          doc.text(`Problem: ${block.problem}`);
          doc.text(`Solution: ${block.solution}`);
          doc.text(`Outcomes: ${block.outcomes.join('; ')}`);
          if (block.metrics) {
            Object.entries(block.metrics).forEach(([key, value]) => {
              doc.text(`${key}: ${value}`);
            });
          }
          break;
      }
    });
};

const publicStyles = `body{font-family:system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:white;color:#1a1a1a;margin:0;padding:0;}header.hero{padding:3rem 1.5rem;border-bottom:4px solid ${BRAND_PURPLE};background:white;}header.hero h1{text-transform:lowercase;font-size:2.5rem;margin:0;color:${BRAND_PURPLE};}header.hero p{max-width:720px;font-size:1.125rem;}section.blocks{padding:2rem 1.5rem;display:grid;gap:1.5rem;}section.blocks article{border:1px solid ${BRAND_LAVENDER};border-radius:1.5rem;padding:1.25rem;background:white;}section.blocks h2{text-transform:uppercase;font-size:.85rem;color:${BRAND_PURPLE};letter-spacing:.08em;margin:0 0 .5rem;}section.blocks p{margin:.25rem 0;font-size:1rem;}aside.template-info{padding:2rem 1.5rem;background:${BRAND_LAVENDER};color:${BRAND_TEXT};}aside.template-info h2{text-transform:uppercase;letter-spacing:.1em;font-size:1rem;}`;

const renderBlockHtml = (block: AnyBlockT) => {
  switch (block.type) {
    case 'text':
      return `<article><h2>text</h2><p>${block.content}</p></article>`;
    case 'media':
      return `<article><h2>media</h2><p>${block.media.kind}: <a href="${block.media.url}">${block.media.url}</a></p>${
        block.caption ? `<p>${block.caption}</p>` : ''
      }</article>`;
    case 'timeline':
      return `<article><h2>timeline</h2><ul>${block.items
        .map((item) => `<li>${item.label}: ${item.start}${item.end ? ` → ${item.end}` : ''}</li>`)
        .join('')}</ul></article>`;
    case 'chart':
      return `<article><h2>chart</h2><p>${block.kind} chart with ${block.labels.length} labels.</p></article>`;
    case 'impact':
      return `<article><h2>impact</h2><p>Problem: ${block.problem}</p><p>Solution: ${block.solution}</p><p>Outcomes: ${block.outcomes.join(
        '; '
      )}</p></article>`;
    default:
      return `<article><h2>${block.type}</h2></article>`;
  }
};

export const exportService = new ExportService();

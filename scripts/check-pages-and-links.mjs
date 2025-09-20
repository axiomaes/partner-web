// scripts/check-pages-and-links.mjs
// Requisitos: npm i fast-glob esbuild htmlparser2
import fg from 'fast-glob';
import fs from 'fs';
import path from 'path';
import {parseDocument} from 'htmlparser2';

const ROOT = process.cwd();
const PAGES_DIR = path.join(ROOT, 'src', 'pages');

// --- utilidades ---
const exts = ['.js','.jsx','.ts','.tsx'];
const isPageFile = (f) => exts.includes(path.extname(f).toLowerCase());
const toUnix = (p) => p.split(path.sep).join('/');

// Convierte ruta de archivo de Pages Router a URL
function filePathToRoute(fp) {
  const rel = toUnix(path.relative(PAGES_DIR, fp));
  if (rel.startsWith('api/')) return null; // ignorar API routes
  if (['_app','_document','_error','404','500'].some(n => rel === `${n}.tsx` || rel === `${n}.js`)) return null;

  let url = '/' + rel.replace(/\.(js|jsx|ts|tsx)$/, '');
  url = url.replace(/\/index$/, '');          // /about/index -> /about
  url = url.replace(/\/?index\/?$/, '/');     // index -> /
  return url.startsWith('//') ? url.slice(1) : url;
}

// Extrae hrefs internos (que empiecen con /) de archivos TSX/JSX/MD/HTML
function extractInternalHrefs(code) {
  const hrefs = new Set();

  // heurística rápida en JSX/TSX: buscar href="..."
  const jsxHrefRe = /href\s*=\s*{?\s*["'`]([^"'`]+)["'`]\s*}?/g;
  let m;
  while ((m = jsxHrefRe.exec(code))) {
    const href = m[1];
    if (href.startsWith('/')) hrefs.add(href.split('#')[0]);
  }

  // muy básico: también intenta parsear como HTML (cubre <a> en MD/HTML)
  try {
    const doc = parseDocument(code);
    const queue = [doc];
    while (queue.length) {
      const node = queue.pop();
      if (!node) break;
      if (node.attribs && node.attribs.href && node.attribs.href.startsWith('/')) {
        hrefs.add(node.attribs.href.split('#')[0]);
      }
      if (node.children) queue.push(...node.children);
    }
  } catch {}
  return Array.from(hrefs);
}

function normalizeRoute(r){
  // quita trailing slash salvo la raíz
  if (r.length > 1 && r.endsWith('/')) return r.slice(0, -1);
  return r;
}

(async () => {
  if (!fs.existsSync(PAGES_DIR)) {
    console.error(`No existe ${PAGES_DIR}. ¿Seguro que usas Pages Router y la carpeta es src/pages?`);
    process.exit(2);
  }

  // 1) Construye el mapa de rutas reales desde src/pages
  const files = await fg('**/*.{js,jsx,ts,tsx}', {cwd: PAGES_DIR, dot:false});
  const routeToFiles = new Map();

  for (const rel of files) {
    const abs = path.join(PAGES_DIR, rel);
    const route = filePathToRoute(abs);
    if (!route) continue;
    const norm = normalizeRoute(route);
    if (!routeToFiles.has(norm)) routeToFiles.set(norm, []);
    routeToFiles.get(norm).push(toUnix(rel));
  }

  // 2) Detecta duplicadas (múltiples archivos para la misma ruta)
  const duplicates = [];
  for (const [route, arr] of routeToFiles) {
    if (arr.length > 1) duplicates.push({route, files: arr});
  }

  // 3) Extrae hrefs internos del código para validar contra rutas reales
  const codeFiles = await fg(['src/**/*.{ts,tsx,js,jsx,md,mdx,html}'], {cwd: ROOT, dot:false, ignore: ['**/node_modules/**']});
  const internalHrefs = new Set();
  for (const rel of codeFiles) {
    const abs = path.join(ROOT, rel);
    try {
      const code = fs.readFileSync(abs, 'utf8');
      extractInternalHrefs(code).forEach(h => internalHrefs.add(normalizeRoute(h)));
    } catch {}
  }

  // 4) Genera el set de rutas válidas (incluye dinámicas: las representamos por patrón)
  // Pages dinámicas: /products/[id] -> patrón /products/*
  const validRoutes = new Set([...routeToFiles.keys()]);
  const dynamicPatterns = [...routeToFiles.keys()]
    .filter(r => r.includes('['))
    .map(r => r.replace(/\[\.{3}[^\]]+\]/g, '.*')       // [...slug] -> .*
                .replace(/\[[^\]]+\]/g, '[^/]+')        // [id] -> [^/]+
                .replace(/\//g, '\\/'));                // escapar slashes

  const broken = [];
  for (const href of internalHrefs) {
    if (href === '/') { continue; }
    if (validRoutes.has(href)) continue;

    // probar contra patrones dinámicos
    const matchesDynamic = dynamicPatterns.some(pat => {
      const re = new RegExp(`^${pat}$`);
      return re.test(href);
    });

    if (!matchesDynamic) {
      broken.push(href);
    }
  }

  // 5) Reporte
  const sep = '—'.repeat(60);
  console.log(sep);
  console.log('Rutas totales encontradas en src/pages:', routeToFiles.size);
  console.log('Duplicadas:', duplicates.length);
  duplicates.forEach(d => {
    console.log(`  [DUP] ${d.route} -> ${d.files.join(', ')}`);
  });

  console.log(sep);
  console.log('Links internos rotos detectados:', broken.length);
  broken.slice(0, 200).forEach(h => console.log('  [404?]', h));
  if (broken.length > 200) console.log(`  ...y ${broken.length-200} más`);

  console.log(sep);
  console.log('Sugerencias rápidas:');
  if (duplicates.length) {
    console.log(' - Elimina/renombra los archivos que colisionan por la misma ruta (e.g. usa solo "about.tsx" o "about/index.tsx").');
  }
  if (broken.length) {
    console.log(' - Revisa los href listados y crea la página correspondiente o corrige el enlace.');
  }
})();

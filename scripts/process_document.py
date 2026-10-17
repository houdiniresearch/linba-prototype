import json, sys, subprocess
from pathlib import Path
from pypdf import PdfReader

source, output = Path(sys.argv[1]).resolve(), Path(sys.argv[2]).resolve()
output.mkdir(parents=True, exist_ok=True)
if source.suffix.lower() == '.pptx':
    profile = (output / 'office-profile').as_uri()
    subprocess.run(['soffice', '-env:UserInstallation='+profile, '--headless', '--convert-to', 'pdf', '--outdir', str(output), str(source)], check=True, capture_output=True, timeout=70)
    pdf = output / (source.stem + '.pdf')
else:
    pdf = source
reader = PdfReader(pdf)
if reader.is_encrypted:
    raise ValueError('Şifreli PDF yüklenemez.')
if not 1 <= len(reader.pages) <= 80:
    raise ValueError('Sunum 1-80 slayt içermelidir.')
pages = []
for i, page in enumerate(reader.pages, 1):
    text = page.extract_text() or ''
    lines = [line.strip() for line in text.splitlines() if line.strip()]
    width, height = float(page.mediabox.width), float(page.mediabox.height)
    pages.append({'number': i, 'title': (lines[0][:100] if lines else f'Slayt {i}'), 'text': text[:22000], 'image': f'page-{i:02d}.png', 'ratio': width / max(height, 1)})
subprocess.run(['pdftoppm', '-scale-to', '1600', '-png', str(pdf), str(output/'page')], check=True, capture_output=True, timeout=100)
# Poppler pads page numbers according to page count, not a fixed width.
for page in pages:
    matches = [p for p in output.glob('page-*.png') if int(p.stem.split('-')[-1]) == page['number']]
    if not matches:
        raise ValueError('Slayt görüntüsü hazırlanamadı.')
    page['image'] = matches[0].name
print(json.dumps(pages, ensure_ascii=False))

from pathlib import Path
import base64,hashlib,json,zipfile,io,subprocess
base=Path(__file__).resolve().parents[1]
r=base/'releases/0.5.3'
m=json.loads((r/'manifest.json').read_text(encoding='utf-8'))
data=base64.b64decode((r/'package.b64').read_text().strip(),validate=True)
assert hashlib.sha256(data).hexdigest()==m['sha256']
allowed={'index.html','protecao.js','sw.js','README.md','aion-version.json'}
assert {f['path'] for f in m['files']}==allowed
with zipfile.ZipFile(io.BytesIO(data)) as z:
 assert set(z.namelist())==allowed and len(z.namelist())==len(allowed)
 assert z.testzip() is None
 for f in m['files']:
  payload=z.read(f['path'])
  assert len(payload)==f['bytes'] and hashlib.sha256(payload).hexdigest()==f['sha256']
  assert payload==(base/'app'/f['path']).read_bytes()
 assert json.loads(z.read('aion-version.json'))['version']==m['version']=='0.5.3'
 assert b'content="0.5.3"' in z.read('index.html')
for p in (base/'app').glob('*.js'):subprocess.run(['node','--check',str(p)],check=True)
print('PASS package allowlist, CRC, SHA256, source identity, version and JS syntax')

"""AION local loopback server with versioned data snapshots. Python 3 stdlib only."""
import argparse
import hashlib
import json
import os
import re
import sys
import tempfile
import uuid
from datetime import datetime, timezone
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import urlsplit

APP_DIR = Path(__file__).resolve().parent
BASE_DIR = APP_DIR.parent
DATA_DIR = BASE_DIR / '_backups_dados'
MAX_SIZE = 3_000_000
MAX_FILES = 300

def validate_notes(data):
    if not isinstance(data,dict) or data.get('version')!=1 or not isinstance(data.get('items'),list) or len(data['items'])>500:
        raise ValueError('anotacoes invalidas')
    seen=set()
    for n in data['items']:
        if not isinstance(n,dict) or not isinstance(n.get('id'),str) or not re.fullmatch(r'[a-zA-Z0-9_-]{1,80}',n['id']) or n['id'] in seen:
            raise ValueError('id invalido')
        seen.add(n['id'])
        if not isinstance(n.get('title'),str) or not 1<=len(n['title'])<=120 or not isinstance(n.get('text'),str) or len(n['text'])>10000 or n.get('kind') not in ('note','reminder') or type(n.get('pinned')) is not bool or type(n.get('done')) is not bool:
            raise ValueError('conteudo invalido')
        if not isinstance(n.get('date'),str) or (n['date'] and not re.fullmatch(r'\d{4}-\d{2}-\d{2}',n['date'])) or not isinstance(n.get('updatedAt'),str):
            raise ValueError('data invalida')
    return data

def note_files():
    return sorted((BASE_DIR/'_backups_anotacoes').glob('AION-Notas-*.json'),reverse=True)

def backup_notes(data):
    data=validate_notes(data)
    canonical=json.dumps(data,ensure_ascii=False,sort_keys=True,separators=(',',':')).encode('utf-8')
    if len(canonical)>MAX_SIZE:raise ValueError('anotacoes excedem limite')
    digest=hashlib.sha256(canonical).hexdigest()
    files=note_files()
    if files:
        try:
            if json.loads(files[0].read_text(encoding='utf-8')).get('sha256')==digest:return {'status':'sem alteracoes'}
        except (OSError,ValueError):pass
    folder=BASE_DIR/'_backups_anotacoes';folder.mkdir(exist_ok=True)
    payload={'savedAt':datetime.now(timezone.utc).isoformat(),'sha256':digest,'data':data}
    name='AION-Notas-'+datetime.now(timezone.utc).strftime('%Y%m%d-%H%M%S-%f')+'-'+uuid.uuid4().hex[:8]+'.json'
    fd,tmp=tempfile.mkstemp(prefix='.notes-',suffix='.tmp',dir=folder)
    try:
        with os.fdopen(fd,'w',encoding='utf-8') as stream:
            json.dump(payload,stream,ensure_ascii=False,indent=2);stream.flush();os.fsync(stream.fileno())
        os.replace(tmp,folder/name)
    finally:
        if os.path.exists(tmp):os.unlink(tmp)
    return {'status':'salvo'}

def materials():
    root = (BASE_DIR / '_materiais_estudo').resolve()
    try:
        active = json.loads((root / 'ativo.json').read_text(encoding='utf-8'))
        folder = (root / active['pasta']).resolve()
        if not folder.is_relative_to(root) or folder == root:
            raise ValueError('pasta invalida')
        catalog = json.loads((folder / 'catalogo.json').read_text(encoding='utf-8'))
        result = []
        for item in catalog['materiais']:
            ident = item['id']
            if not re.fullmatch(r'[a-zA-Z0-9_-]{1,80}', ident):
                raise ValueError('id invalido')
            file = (folder / item['copia']).resolve()
            copies = (folder / 'copias').resolve()
            if not copies.is_relative_to(folder) or not file.is_relative_to(copies) or file.suffix.lower() != '.pdf':
                raise ValueError('arquivo invalido')
            result.append((dict(id=ident, titulo=item['titulo'], area=item['area'], assunto=item['assunto'], disponivel=file.is_file()), file))
        return result
    except FileNotFoundError:
        return []

def validate(data):
    if not isinstance(data, dict) or data.get('version') != 2:
        raise ValueError('versao invalida')
    tasks = data.get('tasks')
    sessions = data.get('sessions')
    focus = data.get('focusSessions')
    if not all(isinstance(x, list) for x in (tasks,sessions,focus)) or any(len(x)>10000 for x in (tasks,sessions)) or len(focus)>200:
        raise ValueError('listas invalidas')
    areas = ('estudos','projetos','trabalho')
    for t in tasks:
        if not isinstance(t,dict) or not isinstance(t.get('id'),str) or not isinstance(t.get('name'),str) or not 0<len(t['name'])<=90 or t.get('type') not in areas or type(t.get('done')) is not bool:
            raise ValueError('tarefa invalida')
        if t.get('dueDate') and (not isinstance(t['dueDate'],str) or not re.fullmatch(r'\d{4}-\d{2}-\d{2}',t['dueDate'])):
            raise ValueError('data de tarefa invalida')
    for s in sessions:
        if not isinstance(s,dict) or not isinstance(s.get('id'),str) or not isinstance(s.get('subject'),str) or not 0<len(s['subject'])<=70 or not isinstance(s.get('date'),str) or not re.fullmatch(r'\d{4}-\d{2}-\d{2}',s['date']):
            raise ValueError('sessao invalida')
        if type(s.get('total')) is not int or not 1<=s['total']<=1000 or type(s.get('correct')) is not int or not 0<=s['correct']<=s['total']:
            raise ValueError('pontos invalidos')
    for f in focus:
        if not isinstance(f,dict) or f.get('area') not in areas or type(f.get('minutes')) not in (int,float) or not 0<f['minutes']<=180 or not isinstance(f.get('date'),str):
            raise ValueError('foco invalido')
    return {'version':2,'tasks':tasks,'sessions':sessions,'focusSessions':focus}


def all_backups():
    return sorted(DATA_DIR.glob('AION-Dados-*.json'), reverse=True) if DATA_DIR.exists() else []


def backup(data):
    normalized = validate(data)
    canonical = json.dumps(normalized,ensure_ascii=False,sort_keys=True,separators=(',',':')).encode('utf-8')
    if len(canonical)>MAX_SIZE: raise ValueError('backup excede o limite')
    digest=hashlib.sha256(canonical).hexdigest()
    files=all_backups()
    if files:
        try:
            if json.loads(files[0].read_text(encoding='utf-8')).get('sha256')==digest:
                return {'status':'sem alteracoes','file':files[0].name}
        except (OSError,ValueError): pass
    DATA_DIR.mkdir(parents=True,exist_ok=True)
    name='AION-Dados-'+datetime.now(timezone.utc).strftime('%Y%m%d-%H%M%S-%f')+'-'+uuid.uuid4().hex[:8]+'.json'
    payload={'savedAt':datetime.now(timezone.utc).isoformat(),'sha256':digest,'data':normalized}
    fd,tmp=tempfile.mkstemp(prefix='.aion-',suffix='.tmp',dir=DATA_DIR)
    try:
        with os.fdopen(fd,'w',encoding='utf-8') as f:
            json.dump(payload,f,ensure_ascii=False,indent=2)
            f.flush();os.fsync(f.fileno())
        os.replace(tmp,DATA_DIR/name)
    finally:
        if os.path.exists(tmp):os.unlink(tmp)
    # Conservative retention: 300 snapshots, never delete newest.
    for p in all_backups()[MAX_FILES:]:
        try: p.unlink()
        except OSError: pass
    return {'status':'salvo','file':name}

class Handler(SimpleHTTPRequestHandler):
    def __init__(self,*args,**kwargs): super().__init__(*args,directory=str(APP_DIR),**kwargs)
    def _headers(self,code=200,size=None):
        self.send_response(code)
        self.send_header('Content-Type','application/json; charset=utf-8')
        self.send_header('Cache-Control','no-store')
        self.send_header('X-Content-Type-Options','nosniff')
        if size is not None:self.send_header('Content-Length',str(size))
        self.end_headers()
    def send_json(self,obj,code=200):
        b=json.dumps(obj,ensure_ascii=False).encode('utf-8')
        self._headers(code,len(b));self.wfile.write(b)
    def allowed(self):
        # Reject cross-origin browser requests, including null origin.
        origin=self.headers.get('Origin')
        return not origin or origin in ('http://127.0.0.1:'+str(self.server.server_port),'http://localhost:'+str(self.server.server_port))
    def do_GET(self):
        path=urlsplit(self.path).path
        if path=='/api/notes/latest':
            if not self.allowed():self.send_json({'error':'origem negada'},403);return
            files=note_files()
            if not files:self.send_json({'error':'sem anotacoes'},404);return
            try:self.send_json(json.loads(files[0].read_text(encoding='utf-8')))
            except (OSError,ValueError):self.send_json({'error':'backup ilegivel'},500)
        elif path=='/api/materials' or path.startswith('/api/materials/'):
            if not self.allowed():self.send_json({'error':'origem negada'},403);return
            try:
                items=materials()
                if path=='/api/materials':
                    self.send_json({'materials':[item for item,file in items]});return
                match=re.fullmatch(r'/api/materials/([a-zA-Z0-9_-]{1,80})/file',path)
                found=next((file for item,file in items if match and item['id']==match[1]),None)
                if not found or not found.is_file():self.send_json({'error':'material nao encontrado'},404);return
                with found.open('rb') as stream:
                    self.send_response(200)
                    self.send_header('Content-Type','application/pdf')
                    self.send_header('Content-Length',str(os.fstat(stream.fileno()).st_size))
                    self.send_header('Cache-Control','no-store')
                    self.send_header('X-Content-Type-Options','nosniff')
                    self.end_headers()
                    self.copyfile(stream,self.wfile)
            except (OSError,ValueError,KeyError,TypeError):self.send_json({'error':'biblioteca indisponivel'},500)
        elif path=='/api/status':
            self.send_json({'ok':True,'dataBackupCount':len(all_backups()),'mode':'local-only','notesSupported':True})
        elif path=='/api/backups':
            self.send_json({'files':[{'name':p.name,'bytes':p.stat().st_size} for p in all_backups()[:30]]})
        elif path=='/api/backup/latest':
            files=all_backups()
            if not files: self.send_json({'error':'sem backups'},404);return
            try:self.send_json(json.loads(files[0].read_text(encoding='utf-8')))
            except (ValueError,OSError):self.send_json({'error':'backup ilegivel'},500)
        elif path.startswith('/api/'):
            self.send_json({'error':'nao encontrado'},404)
        else:
            super().do_GET()
    def do_POST(self):
        path=urlsplit(self.path).path
        if path not in ('/api/backup','/api/notes'):self.send_json({'error':'nao encontrado'},404);return
        if not self.allowed() or self.headers.get('Content-Type','').split(';')[0].strip().lower()!='application/json':
            self.send_json({'error':'origem ou tipo de conteudo negado'},403);return
        try:
            n=int(self.headers.get('Content-Length','0'))
            if n<2 or n>MAX_SIZE:self.send_json({'error':'tamanho invalido'},413);return
            raw=self.rfile.read(n)
            result=(backup_notes if path=='/api/notes' else backup)(json.loads(raw.decode('utf-8')))
            self.send_json(result)
        except (ValueError,UnicodeDecodeError,json.JSONDecodeError) as e:
            self.send_json({'error':str(e)},400)
        except OSError:
            self.send_json({'error':'falha ao gravar disco'},500)
    def end_headers(self):
        # Prevent framing the local dashboard from other websites.
        self.send_header('X-Frame-Options','DENY')
        self.send_header('Referrer-Policy','no-referrer')
        super().end_headers()

if __name__=='__main__':
    p=argparse.ArgumentParser()
    p.add_argument('--port',type=int,default=5500)
    args=p.parse_args()
    if not (1024<=args.port<=65535):p.error('porta invalida')
    server=ThreadingHTTPServer(('127.0.0.1',args.port),Handler)
    print(f'AION servidor protegido: http://127.0.0.1:{args.port}/',flush=True)
    try:server.serve_forever()
    except KeyboardInterrupt:pass
    finally:server.server_close()

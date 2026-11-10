"""Start the local AION server, then open the existing Edge app/profile."""
import ctypes
import json
import msvcrt
import os
from pathlib import Path
import socket
import subprocess
import sys
import time
import urllib.request
from datetime import datetime

BASE = Path(__file__).resolve().parent.parent
LOGS = BASE / '_automacao_logs'
PORT = 5500
URL = f'http://127.0.0.1:{PORT}/'

def ready():
    try:
        with urllib.request.urlopen(URL + 'api/status', timeout=2) as response:
            status = json.load(response)
        return status.get('ok') is True and status.get('mode') == 'local-only'
    except (OSError, ValueError):
        return False

def log(message):
    with (LOGS / 'atalho.log').open('a', encoding='utf-8') as stream:
        stream.write(datetime.now().isoformat() + ' | ' + message + '\n')

def main():
    LOGS.mkdir(exist_ok=True)
    server = BASE / 'aion-dashboard-v05' / 'servidor_aion.py'
    edge = BASE / '_automacao' / 'AION-Edge.lnk'
    if not server.is_file() or not edge.is_file():
        raise RuntimeError('Arquivos de inicializacao do AION ausentes.')
    with (LOGS / 'atalho.lock').open('a+b') as lock:
        lock.seek(0, 2)
        if lock.tell() == 0:
            lock.write(b'0')
            lock.flush()
        deadline = time.monotonic() + 30
        while True:
            try:
                lock.seek(0)
                msvcrt.locking(lock.fileno(), msvcrt.LK_NBLCK, 1)
                break
            except OSError:
                if time.monotonic() >= deadline:
                    raise RuntimeError('Outra inicializacao ainda esta em andamento.')
                time.sleep(0.2)
        try:
            if not ready():
                with socket.socket() as probe:
                    probe.bind(('127.0.0.1', PORT))
                with (LOGS / 'servidor-saida.log').open('ab') as out, (LOGS / 'servidor-erros.log').open('ab') as err:
                    process = subprocess.Popen(
                        [sys.executable, str(server), '--port', str(PORT)],
                        cwd=server.parent, stdin=subprocess.DEVNULL,
                        stdout=out, stderr=err,
                        creationflags=subprocess.CREATE_NO_WINDOW,
                    )
                deadline = time.monotonic() + 20
                while not ready():
                    if process.poll() is not None or time.monotonic() >= deadline:
                        raise RuntimeError('O servidor nao iniciou. Confira os logs do AION.')
                    time.sleep(0.2)
                log('Servidor iniciado e API validada.')
            else:
                log('Servidor existente validado; nenhuma segunda instancia criada.')
        finally:
            lock.seek(0)
            msvcrt.locking(lock.fileno(), msvcrt.LK_UNLCK, 1)
    os.startfile(str(edge))
    log('Aplicativo Edge solicitado no perfil original.')

if __name__ == '__main__':
    try:
        main()
    except Exception as exc:
        try:
            log('ERRO: ' + str(exc))
        except OSError:
            pass
        ctypes.windll.user32.MessageBoxW(None, 'Nao foi possivel abrir o AION.\n' + str(exc), 'AION Dashboard', 16)
        sys.exit(1)

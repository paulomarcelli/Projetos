"""Lê e regrava um .pck do Godot 4 (formato 2), trocando/adicionando/removendo arquivos."""
import struct, hashlib, sys

def ler(caminho):
    d = open(caminho, 'rb').read()
    assert d[:4] == b'GDPC'
    ver, ma, mi, pa, flags = struct.unpack_from('<5I', d, 4)
    file_base, = struct.unpack_from('<Q', d, 24)
    pos = 32 + 16 * 4
    n, = struct.unpack_from('<I', d, pos); pos += 4
    ents = []
    for _ in range(n):
        l, = struct.unpack_from('<I', d, pos); pos += 4
        nome = d[pos:pos + l].rstrip(b'\0').decode(); pos += l
        off, tam = struct.unpack_from('<QQ', d, pos); pos += 16
        md5 = d[pos:pos + 16]; pos += 16
        fl, = struct.unpack_from('<I', d, pos); pos += 4
        ents.append([nome, d[file_base + off: file_base + off + tam], fl])
    return (ver, ma, mi, pa, flags), ents

def gravar(caminho, cab, ents):
    ver, ma, mi, pa, flags = cab
    tab = b''
    for nome, dados, fl in ents:
        nb = nome.encode()
        pad = (4 - len(nb) % 4) % 4
        tab += struct.pack('<I', len(nb) + pad) + nb + b'\0' * pad + b'\0' * 32 + b'\0' * 4  # placeholders
    cab_tam = 32 + 64 + 4 + len(tab)
    base = (cab_tam + 31) // 32 * 32
    corpo = b''; tab = b''
    for nome, dados, fl in ents:
        off = len(corpo)
        nb = nome.encode(); pad = (4 - len(nb) % 4) % 4
        tab += struct.pack('<I', len(nb) + pad) + nb + b'\0' * pad + struct.pack('<QQ', off, len(dados)) + hashlib.md5(dados).digest() + struct.pack('<I', fl)
        corpo += dados + b'\0' * ((32 - len(dados) % 32) % 32)
    h = b'GDPC' + struct.pack('<5I', ver, ma, mi, pa, flags) + struct.pack('<Q', base) + b'\0' * 64 + struct.pack('<I', len(ents)) + tab
    h += b'\0' * (base - len(h))
    open(caminho, 'wb').write(h + corpo)

if __name__ == '__main__':
    cab, ents = ler(sys.argv[1])
    print(cab, len(ents))
    for e in ents:
        if 'scripts/' in e[0]: print(e[0], len(e[1]), e[2])

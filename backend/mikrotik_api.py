#!/usr/bin/python3
# -*- coding: utf-8 -*-
"""
MikroTik API implementation based on official documentation
Uses the binary protocol over TCP socket (port 8728/8729)
"""
import socket
import ssl
import hashlib
import binascii
import sys

class MikroTikAPI:
    """MikroTik API implementation using binary protocol"""
    
    def __init__(self):
        self.sk = None
        self.currenttag = 0

    def connect(self, host, username, password, secure=False, port=None):
        """Connect to MikroTik router and login"""
        try:
            # Set default port based on secure flag
            if port is None:
                port = 8729 if secure else 8728
            
            # Create socket connection
            self.sk = self._open_socket(host, port, secure)
            
            # Perform login
            if not self._login(username, password):
                return False, "Login failed - invalid credentials"
            
            return True, "Connected successfully"
            
        except Exception as e:
            return False, f"Connection error: {str(e)}"

    def _open_socket(self, host, port, secure=False):
        """Open TCP socket to MikroTik router"""
        res = socket.getaddrinfo(host, port, socket.AF_UNSPEC, socket.SOCK_STREAM)
        af, socktype, proto, canonname, sockaddr = res[0]
        skt = socket.socket(af, socktype, proto)
        skt.settimeout(10)  # Set timeout
        
        if secure:
            s = ssl.wrap_socket(skt, ssl_version=ssl.PROTOCOL_TLSv1_2)
        else:
            s = skt
            
        s.connect(sockaddr)
        return s

    def _login(self, username, password):
        """Perform login using MikroTik API protocol"""
        try:
            # Send login command with credentials
            for reply, attrs in self._talk(["/login", f"=name={username}", f"=password={password}"]):
                if reply == '!trap':
                    return False
                elif reply == '!done':
                    return True
            return False
        except Exception:
            return False

    def get_address_lists(self):
        """Get firewall address lists"""
        try:
            result = []
            for reply, attrs in self._talk(["/ip/firewall/address-list/print"]):
                if reply == '!re':
                    # Convert attributes to expected format
                    item = {
                        '.id': attrs.get('=.id', ''),
                        'list': attrs.get('=list', ''),
                        'address': attrs.get('=address', ''),
                        'comment': attrs.get('=comment', ''),
                        'timeout': attrs.get('=timeout', ''),
                        'disabled': attrs.get('=disabled') == 'true',
                        'dynamic': attrs.get('=dynamic') == 'true'
                    }
                    result.append(item)
            return result
        except Exception as e:
            print(f"Error getting address lists: {e}")
            return []

    def get_firewall_rules(self):
        """Get firewall filter rules"""
        try:
            result = []
            for reply, attrs in self._talk(["/ip/firewall/filter/print"]):
                if reply == '!re':
                    # Convert attributes to expected format
                    rule = {
                        '.id': attrs.get('=.id', ''),
                        'chain': attrs.get('=chain', ''),
                        'action': attrs.get('=action', ''),
                        'src-address': attrs.get('=src-address', ''),
                        'dst-address': attrs.get('=dst-address', ''),
                        'src-port': attrs.get('=src-port', ''),
                        'dst-port': attrs.get('=dst-port', ''),
                        'protocol': attrs.get('=protocol', ''),
                        'comment': attrs.get('=comment', ''),
                        'disabled': attrs.get('=disabled') == 'true',
                        'src-address-list': attrs.get('=src-address-list', ''),
                        'dst-address-list': attrs.get('=dst-address-list', '')
                    }
                    result.append(rule)
            return result
        except Exception as e:
            print(f"Error getting firewall rules: {e}")
            return []

    def _talk(self, words):
        """Send command and receive response"""
        if self._write_sentence(words) == 0:
            return
        
        r = []
        while True:
            i = self._read_sentence()
            if len(i) == 0:
                continue
                
            reply = i[0]
            attrs = {}
            
            for w in i[1:]:
                j = w.find('=', 1)
                if j == -1:
                    attrs[w] = ''
                else:
                    attrs[w[:j]] = w[j+1:]
                    
            r.append((reply, attrs))
            if reply == '!done':
                return r

    def _write_sentence(self, words):
        """Write sentence (list of words) to socket"""
        ret = 0
        for w in words:
            self._write_word(w)
            ret += 1
        self._write_word('')  # Empty word terminates sentence
        return ret

    def _read_sentence(self):
        """Read sentence from socket"""
        r = []
        while True:
            w = self._read_word()
            if w == '':
                return r
            r.append(w)

    def _write_word(self, w):
        """Write word to socket"""
        self._write_len(len(w))
        self._write_str(w)

    def _read_word(self):
        """Read word from socket"""
        return self._read_str(self._read_len())

    def _write_len(self, l):
        """Write length encoding to socket"""
        if l < 0x80:
            self._write_byte((l).to_bytes(1, sys.byteorder))
        elif l < 0x4000:
            l |= 0x8000
            self._write_byte(((l >> 8) & 0xFF).to_bytes(1, sys.byteorder))
            self._write_byte((l & 0xFF).to_bytes(1, sys.byteorder))
        elif l < 0x200000:
            l |= 0xC00000
            self._write_byte(((l >> 16) & 0xFF).to_bytes(1, sys.byteorder))
            self._write_byte(((l >> 8) & 0xFF).to_bytes(1, sys.byteorder))
            self._write_byte((l & 0xFF).to_bytes(1, sys.byteorder))
        elif l < 0x10000000:
            l |= 0xE0000000
            self._write_byte(((l >> 24) & 0xFF).to_bytes(1, sys.byteorder))
            self._write_byte(((l >> 16) & 0xFF).to_bytes(1, sys.byteorder))
            self._write_byte(((l >> 8) & 0xFF).to_bytes(1, sys.byteorder))
            self._write_byte((l & 0xFF).to_bytes(1, sys.byteorder))
        else:
            self._write_byte((0xF0).to_bytes(1, sys.byteorder))
            self._write_byte(((l >> 24) & 0xFF).to_bytes(1, sys.byteorder))
            self._write_byte(((l >> 16) & 0xFF).to_bytes(1, sys.byteorder))
            self._write_byte(((l >> 8) & 0xFF).to_bytes(1, sys.byteorder))
            self._write_byte((l & 0xFF).to_bytes(1, sys.byteorder))

    def _read_len(self):
        """Read length encoding from socket"""
        c = ord(self._read_str(1))
        
        if (c & 0x80) == 0x00:
            pass
        elif (c & 0xC0) == 0x80:
            c &= ~0xC0
            c <<= 8
            c += ord(self._read_str(1))
        elif (c & 0xE0) == 0xC0:
            c &= ~0xE0
            c <<= 8
            c += ord(self._read_str(1))
            c <<= 8
            c += ord(self._read_str(1))
        elif (c & 0xF0) == 0xE0:
            c &= ~0xF0
            c <<= 8
            c += ord(self._read_str(1))
            c <<= 8
            c += ord(self._read_str(1))
            c <<= 8
            c += ord(self._read_str(1))
        elif (c & 0xF8) == 0xF0:
            c = ord(self._read_str(1))
            c <<= 8
            c += ord(self._read_str(1))
            c <<= 8
            c += ord(self._read_str(1))
            c <<= 8
            c += ord(self._read_str(1))
            
        return c

    def _write_str(self, s):
        """Write string to socket"""
        n = 0
        while n < len(s):
            r = self.sk.send(bytes(s[n:], 'UTF-8'))
            if r == 0:
                raise RuntimeError("Connection closed by remote end")
            n += r

    def _write_byte(self, b):
        """Write bytes to socket"""
        n = 0
        while n < len(b):
            r = self.sk.send(b[n:])
            if r == 0:
                raise RuntimeError("Connection closed by remote end")
            n += r

    def _read_str(self, length):
        """Read string from socket"""
        ret = ''
        while len(ret) < length:
            s = self.sk.recv(length - len(ret))
            if s == b'':
                raise RuntimeError("Connection closed by remote end")
            
            # Handle non-ASCII bytes
            if any(b >= 128 for b in s):
                return s.decode('utf-8', 'replace')
            
            ret += s.decode('utf-8', 'replace')
        return ret

    def disconnect(self):
        """Close connection"""
        if self.sk:
            self.sk.close()
            self.sk = None
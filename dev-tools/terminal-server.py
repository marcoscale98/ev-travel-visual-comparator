#!/usr/bin/env python3
import json
import time
from http.server import HTTPServer, SimpleHTTPRequestHandler
from urllib.parse import urlparse, parse_qs
import threading

class ConsoleLogHandler(SimpleHTTPRequestHandler):
    def do_POST(self):
        if self.path == '/api/console-log':
            content_length = int(self.headers['Content-Length'])
            post_data = self.rfile.read(content_length)
            
            try:
                log_data = json.loads(post_data.decode('utf-8'))
                timestamp = time.strftime('%H:%M:%S', time.localtime(log_data['timestamp'] / 1000))
                level = log_data['level'].upper()
                message = log_data['message']
                
                # Format and print to terminal
                print(f"[{timestamp}] {level}: {message}")
                
                self.send_response(200)
                self.send_header('Content-Type', 'application/json')
                self.send_header('Access-Control-Allow-Origin', '*')
                self.end_headers()
                self.wfile.write(b'{"status": "ok"}')
                
            except Exception as e:
                print(f"Error processing log: {e}")
                self.send_response(400)
                self.end_headers()
        else:
            super().do_POST()
    
    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'POST, GET, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()

if __name__ == '__main__':
    server = HTTPServer(('localhost', 8000), ConsoleLogHandler)
    print("Console streaming server running on http://localhost:8000")
    print("JavaScript console logs will appear here in real-time!")
    print("-" * 50)
    server.serve_forever()
#!/usr/bin/env python3
"""
Native messaging host for Claude Browser Agent
Provides file system access to the Chrome extension
"""

import sys
import json
import struct
import base64
import os
import mimetypes
import logging

# Set up logging
logging.basicConfig(
    filename=os.path.join(os.path.dirname(__file__), 'native-host.log'),
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)

def read_message():
    """Read a message from Chrome extension"""
    try:
        # Read message length (first 4 bytes)
        raw_length = sys.stdin.buffer.read(4)
        if not raw_length:
            return None

        message_length = struct.unpack('@I', raw_length)[0]

        # Read the message
        message = sys.stdin.buffer.read(message_length).decode('utf-8')
        return json.loads(message)
    except Exception as e:
        logging.error(f"Error reading message: {e}")
        return None

def send_message(message):
    """Send a message to Chrome extension"""
    try:
        encoded_message = json.dumps(message).encode('utf-8')
        message_length = len(encoded_message)

        # Write message length
        sys.stdout.buffer.write(struct.pack('@I', message_length))

        # Write message
        sys.stdout.buffer.write(encoded_message)
        sys.stdout.buffer.flush()
    except Exception as e:
        logging.error(f"Error sending message: {e}")

def get_file(filepath):
    """Read a file and return base64 encoded data"""
    try:
        if not os.path.exists(filepath):
            return {
                'error': f'File not found: {filepath}'
            }

        # Read file
        with open(filepath, 'rb') as f:
            file_data = f.read()

        # Encode to base64
        encoded_data = base64.b64encode(file_data).decode('utf-8')

        # Get mime type
        mime_type, _ = mimetypes.guess_type(filepath)
        if not mime_type:
            mime_type = 'application/octet-stream'

        return {
            'data': encoded_data,
            'filename': os.path.basename(filepath),
            'mimeType': mime_type,
            'size': len(file_data)
        }
    except Exception as e:
        logging.error(f"Error reading file {filepath}: {e}")
        return {
            'error': str(e)
        }

def write_file(filepath, data_base64):
    """Write base64 encoded data to a file"""
    try:
        # Decode base64
        file_data = base64.b64decode(data_base64)

        # Ensure directory exists
        os.makedirs(os.path.dirname(filepath), exist_ok=True)

        # Write file
        with open(filepath, 'wb') as f:
            f.write(file_data)

        return {
            'success': True,
            'path': filepath,
            'size': len(file_data)
        }
    except Exception as e:
        logging.error(f"Error writing file {filepath}: {e}")
        return {
            'error': str(e)
        }

def list_files(directory, pattern='*'):
    """List files in a directory"""
    try:
        import glob

        if not os.path.exists(directory):
            return {
                'error': f'Directory not found: {directory}'
            }

        search_path = os.path.join(directory, pattern)
        files = glob.glob(search_path)

        file_list = []
        for filepath in files:
            if os.path.isfile(filepath):
                stat = os.stat(filepath)
                file_list.append({
                    'path': filepath,
                    'name': os.path.basename(filepath),
                    'size': stat.st_size,
                    'modified': stat.st_mtime
                })

        return {
            'files': file_list,
            'count': len(file_list)
        }
    except Exception as e:
        logging.error(f"Error listing files in {directory}: {e}")
        return {
            'error': str(e)
        }

def main():
    """Main loop"""
    logging.info("Native messaging host started")

    while True:
        try:
            # Read message from extension
            message = read_message()
            if message is None:
                break

            logging.info(f"Received message: {message.get('type', 'unknown')}")

            # Handle message type
            msg_type = message.get('type')

            if msg_type == 'getFile':
                response = get_file(message.get('path'))
                send_message(response)

            elif msg_type == 'writeFile':
                response = write_file(
                    message.get('path'),
                    message.get('data')
                )
                send_message(response)

            elif msg_type == 'listFiles':
                response = list_files(
                    message.get('directory'),
                    message.get('pattern', '*')
                )
                send_message(response)

            elif msg_type == 'ping':
                send_message({'pong': True})

            else:
                send_message({
                    'error': f'Unknown message type: {msg_type}'
                })

        except Exception as e:
            logging.error(f"Error in main loop: {e}")
            send_message({'error': str(e)})

    logging.info("Native messaging host stopped")

if __name__ == '__main__':
    main()

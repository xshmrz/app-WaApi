# WhatsApp Web API Server

This project provides a simple Express.js server integrated with the WhatsApp Web.js library, allowing you to interact
with WhatsApp Web. It includes endpoints for generating QR codes, sending messages, sending group messages, and checking
client status. The server ensures the assigned port is available, freeing it if necessary.

## Features

- **QR Code Generation**: Generates and serves QR codes for WhatsApp Web authentication.
- **Message Sending**: Sends messages to specified phone numbers.
- **Group Message Sending**: Sends messages to WhatsApp groups by group ID.
- **Status Check**: Provides information on the authentication and readiness status of the WhatsApp client.
- **Port Management**: Ensures the server port is available, automatically freeing it if in use.

## Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/xshmrz/app-WaApi.git
   cd app-WaApi
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the server:
   ```bash
   node server.js
   ```

## Endpoints

### 1. QR Code Generation

**GET** `/create/qr`

- Generates a QR code for WhatsApp Web authentication.
- Response:
    - If QR code is available: Displays a QR code image.
    - If client is ready: Returns client info (e.g., name, platform).

### 2. Send Message

**GET** `/send/message`

- Sends a message to a specified phone number.
- Query Parameters:
    - `to` (string): Recipient's phone number in international format (e.g., `905xxxxxxxxx`).
    - `message` (string): The message to send.
- Response:
    - Success: `{ message: 'Message sent successfully.' }`
    - Error: `{ error: 'Error message' }`

### 3. Send Group Message

**GET** `/send/group-message`

- Sends a message to a specified WhatsApp group.
- Query Parameters:
    - `groupId` (string): Group ID of the WhatsApp group.
    - `message` (string): The message to send.
- Response:
    - Success: `{ message: 'Message sent successfully to the group.' }`
    - Error: `{ error: 'Error message' }`

### 4. Client Status

**GET** `/status`

- Provides the status of the WhatsApp client.
- Response:
    - `isAuthenticated` (boolean): Whether the client is authenticated.
    - `isReady` (boolean): Whether the client is ready.
    - `message` (string): Human-readable status message.

## Prerequisites

- Node.js (v14 or higher)
- npm

## Dependencies

- **express**: For creating the server.
- **qrcode**: For generating QR codes.
- **whatsapp-web.js**: For interacting with WhatsApp Web.
- **child_process**: For managing ports.
- **net**: For checking port availability.

## License

This project is licensed under the [MIT License](LICENSE).

## Author

Developed by [Xshmrz](https://www.instagram.com/xshmrz/).

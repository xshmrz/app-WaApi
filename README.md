### Headless Multi Session Whatsapp Gateway NodeJS

Easy Setup Headless Multi Session Whatsapp Gateway With NodeJs

- Support Multi device
- Support Multi Session / Multi Phone Number
- Send Text Message
- Send Image
- Send Document

### Install and Running

### 1. Clone The Project

```bash
  git clone https://github.com/xshmrz/app-WaApi.git
```

### 2. Go To The Project Directory

```bash
  cd app-WaApi
```

### 3. Install Dependencies

```bash
  npm install
```

### 4. Start The Server

```bash
  npm run start
```

### 5. Open On Browser & Start Scan QR

```
http://localhost:5001/session/start?session=MySession
```

### 6. Sending First Message

```
http://localhost:5001/message/send-text?session=MySession&to=90XXXXXXXXXX&text=Hello
```

### Using Axios

```js
// Send Text

axios.post("http://localhost:5001/message/send-text", {
  session   : "MySession",
  to        : "90XXXXXXXXXX",
  text      : "Hello World",
});

// Send Image

axios.post("http://localhost:5001/message/send-image", {
  session   : "MySession",
  to        : "90XXXXXXXXXX",
  text      : "Hello World",
  image_url : "https://placehold.co/600x400",
});
```

# Headless Multi Session Whatsapp Gateway NodeJS

Easy Setup Headless Multi Session Whatsapp Gateway With NodeJs

- Support Multi device
- Support Multi Session / Multi Phone Number
- Send Text Message
- Send Image
- Send Document

## Install and Running

#### 1. Clone The Project

```bash
  git clone https://github.com/xshmrz/app-WaApi.git
```

#### 2. Go To The Project Directory

```bash
  cd app-WaApi
```

#### 3. Install Dependencies

```bash
  npm install
```

#### 4. Start The Server

```bash
  npm run start
```

#### 5. Open On Browser & Start Scan QR

```
http://localhost:5001/session/start?session=mysession
```

#### 6. Sending First Message

```
http://localhost:5001/message/send-text?session=mysession&to=90XXXXXXXXXX&text=Hello
```

## Api Reference

#### Add New Session

```
  GET /session/start?session=NEW_SESSION_NAME
  or
  POST /session/start
```

| Parameter | Type     | Description                            |
| :-------- | :------- | :------------------------------------- |
| `session` | `string` | **Required**. Create Your Session Name |

#### Send Text Message

```
  POST /message/send-text
```

| Body      | Type     | Description                                                              |
| :-------- | :------- | :----------------------------------------------------------------------- |
| `session` | `string` | **Required**. Session Name You Have Created                              |
| `to`      | `string` | **Required**. Receiver Phone Number with Country Code (e.g: 62812345678) |
| `text`    | `string` | **Required**. Text Message                                               |

#### Send Image

```
  POST /message/send-image
```

| Body        | Type     | Description                                                              |
| :---------- | :------- | :----------------------------------------------------------------------- |
| `session`   | `string` | **Required**. Session Name You Have Created                              |
| `to`        | `string` | **Required**. Receiver Phone Number with Country Code (e.g: 62812345678) |
| `text`      | `string` | **Required**. Caption Massage                                            |
| `image_url` | `string` | **Required**. URL Image                                                  |

#### Send Document

```
  POST /message/send-document
```

| Body            | Type     | Description                                                              |
| :-------------- | :------- | :----------------------------------------------------------------------- |
| `session`       | `string` | **Required**. Session Name You Have Created                              |
| `to`            | `string` | **Required**. Receiver Phone Number with Country Code (e.g: 62812345678) |
| `text`          | `string` | **Required**. Caption Massage                                            |
| `document_url`  | `string` | **Required**. Document URL                                               |
| `document_name` | `string` | **Required**. Document Name                                              |

#### Delete session

```
  GET /session/logout?session=SESSION_NAME
```

| Parameter | Type     | Description                            |
| :-------- | :------- | :------------------------------------- |
| `session` | `string` | **Required**. Create Your Session Name |

#### Get All Session ID

```
  GET /session
```

## Examples

### Using Axios

```js
// send text
axios.post("http://localhost:5001/message/send-text", {
  session: "mysession",
  to: "62812345678",
  text: "hello world",
});

// send image
axios.post("http://localhost:5001/message/send-image", {
  session: "mysession",
  to: "62812345678",
  text: "hello world",
  image_url: "https://placehold.co/600x400",
});
```

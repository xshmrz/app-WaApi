import {Hono}                    from "hono";
import {logger}                  from "hono/logger";
import {cors}                    from "hono/cors";
import {serve}                   from "@hono/node-server";
import moment                    from "moment";
import {env}                     from "./env";
import {globalErrorMiddleware}   from "./middlewares/error.middleware";
import {notFoundMiddleware}      from "./middlewares/notfound.middleware";
import {createSessionController} from "./controllers/session";
import {createMessageController} from "./controllers/message";
import * as whastapp             from "wa-multi-session";

const app = new Hono();

app.use(
	logger((...params) => {
		params.map((e) => console.log(`${moment().toISOString()} | ${e}`));
	})
);
app.use(cors());
app.use('*', async (c, next) => {
	// @ts-ignore
	if (c.req.headers['x-forwarded-proto'] !== 'https') {
		// @ts-ignore
		return c.redirect(`https://${c.req.headers.host}${c.req.url}`, 301);
	}
	await next();
});

app.onError(globalErrorMiddleware);
app.notFound(notFoundMiddleware);

/**
 * Session Routes
 */
app.route("/session", createSessionController());

/**
 * Message Routes
 */
app.route("/message", createMessageController());

const port = env.PORT;

serve(
	{
		fetch: app.fetch,
		port,
	},
	(info) => {
		console.log(`Server is running on https://localhost:${info.port}`);
	}
);

whastapp.onConnected((session) => {
	console.log(`session: '${session}' connected`);
});

whastapp.loadSessionsFromStorage();

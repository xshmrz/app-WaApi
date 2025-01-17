import {Hono}                from "hono";
import {createKeyMiddleware} from "../middlewares/key.middleware";
import {customValidator}     from "../middlewares/validation.middleware";
import {z}                   from "zod";
import * as whatsapp         from "wa-multi-session";
import {HTTPException}       from "hono/http-exception";

export const createMessageController = () => {
	const app = new Hono();

	// Schema for validating message payload
	const sendMessageSchema = z.object({
		session: z.string(),
		to     : z.string(),
		message: z.string(),
	});

	// Route to send a text message (POST method)
	app.post(
		"/send-text",
		createKeyMiddleware(), // Middleware for key validation
		customValidator("json", sendMessageSchema), // Middleware for schema validation
		async (context) => {
			const payload       = context.req.valid("json"); // Extract validated payload
			const sessionExists = whatsapp.getSession(payload.session); // Check if the session exists
			if (!sessionExists) {
				throw new HTTPException(400, {
					message: "Session does not exist",
				});
			}


			const response = await whatsapp.sendTextMessage({
				// @ts-ignore
				session: payload.session,
				to     : payload.to,
				message: payload.message,
			});

			return context.json({data: response}); // Return the response as JSON
		}
	);

	// Route to send a text message (GET method)
	app.get(
		"/send-text",
		createKeyMiddleware(),
		customValidator("query", sendMessageSchema),
		async (context) => {
			const payload       = context.req.valid("query");
			const sessionExists = whatsapp.getSession(payload.session);
			if (!sessionExists) {
				throw new HTTPException(400, {
					message: "Session does not exist",
				});
			}

			const response = await whatsapp.sendTextMessage({
				// @ts-ignore
				session: payload.session,
				to     : payload.to,
				message: payload.message,
			});

			return context.json({data: response});
		}
	);

	// Route to send an image message
	app.post(
		"/send-image",
		createKeyMiddleware(),
		customValidator(
			"json",
			sendMessageSchema.merge(
				z.object({
					image: z.string(), // Additional field for image URL
				})
			)
		),
		async (context) => {
			const payload       = context.req.valid("json");
			const sessionExists = whatsapp.getSession(payload.session);
			if (!sessionExists) {
				throw new HTTPException(400, {
					message: "Session does not exist",
				});
			}

			const response = await whatsapp.sendImage({
				// @ts-ignore
				session: payload.session,
				to     : payload.to,
				message: payload.message,
				image  : payload.image,
			});

			return context.json({data: response});
		}
	);

	// Route to send a document
	app.post(
		"/send-document",
		createKeyMiddleware(),
		customValidator(
			"json",
			sendMessageSchema.merge(
				z.object({
					image   : z.string(), // Field for document URL
					filename: z.string(), // Field for document name
				})
			)
		),
		async (context) => {
			const payload       = context.req.valid("json");
			const sessionExists = whatsapp.getSession(payload.session);
			if (!sessionExists) {
				throw new HTTPException(400, {
					message: "Session does not exist",
				});
			}

			const response = await whatsapp.sendDocument({
				// @ts-ignore
				session : payload.session,
				to      : payload.to,
				message : payload.message,
				media   : payload.image,
				filename: payload.filename,
			});

			return context.json({data: response});
		}
	);

	return app;
};

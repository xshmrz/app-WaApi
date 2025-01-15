import * as whatsapp         from "wa-multi-session"; // Library for managing WhatsApp sessions
import {Hono}                from "hono"; // Hono web framework
import {customValidator}     from "../middlewares/validation.middleware"; // Custom validation middleware
import {z}                   from "zod"; // Schema-based validation library
import {createKeyMiddleware} from "../middlewares/key.middleware"; // Middleware for key validation
import {toDataURL}           from "qrcode"; // Library for generating QR codes
import {HTTPException}       from "hono/http-exception"; // Class for handling HTTP exceptions

// Function to create session management controller
export const createSessionController = () => {
	const app = new Hono(); // Initialize a new Hono application

	// Endpoint to list all sessions
	app.get("/", createKeyMiddleware(), async (c) => {
		const sessions = whatsapp.getAllSession();
		return c.json({data: sessions}); // Return all existing sessions
	});

	// Schema definition for starting a session
	const startSessionSchema = z.object({
		session: z.string().min(1, "Session name is required"), // "session" field is required and must be a non-empty string
	});

	// Function to handle session start logic
	// @ts-ignore
	const startSession = async (session) => {
		return new Promise<string | null>(async (resolve, reject) => {
			try {

				await whatsapp.startSession(session, {
					// @ts-ignore
					timeout    : 0, // Disable timeout
					onConnected: () => resolve(null), // Resolve with null when connected
					onQRUpdated: (qr) => resolve(qr), // Resolve with QR code when updated
				});
			} catch (error) {
				reject(error);
			}
		});
	};

	// Endpoint to start a new session (POST)
	app.post(
		"/start",
		createKeyMiddleware(),
		customValidator("json", startSessionSchema), // Validate incoming JSON data against the schema
		async (c) => {
			const payload = c.req.valid("json"); // Get validated JSON data

			// Check if the session already exists
			if (whatsapp.getSession(payload.session)) {
				throw new HTTPException(400, {message: "Session already exists"}); // Throw error if session exists
			}

			// Start session and get QR code if available
			const qr = await startSession(payload.session);

			// Return QR code or connection success message
			return c.json({
				data: qr ? {qr} : {message: "Connected"},
			});
		}
	);

	// Endpoint to start a new session (GET, QR visualization)
	app.get(
		"/start",
		createKeyMiddleware(),
		customValidator("query", startSessionSchema), // Validate query parameters against the schema
		async (c) => {
			const payload = c.req.valid("query"); // Get validated query parameters

			// Check if the session already exists
			if (whatsapp.getSession(payload.session)) {
				throw new HTTPException(400, {message: "Session already exists"});
			}

			// Start session and get QR code if available
			const qr = await startSession(payload.session);

			// Visualize the QR code as an HTML page if available
			if (qr) {
				const qrImage = await toDataURL(qr);
				return c.html(`
          <div id="qrcode">
            <img src="${qrImage}" alt="QR Code" />
          </div>
        `);
			}

			// Return a connection success message
			return c.json({
				data: {message: "Connected"},
			});
		}
	);

	// Endpoint to log out a session
	app.all("/logout", createKeyMiddleware(), async (c) => {
		const session = c.req.query("session") || (await c.req.json()).session || "";
		if (!session) {
			throw new HTTPException(400, {message: "Session name is required"});
		}

		await whatsapp.deleteSession(session); // Delete the specified session
		return c.json({data: "Session successfully logged out"});
	});

	return app; // Return the application
};

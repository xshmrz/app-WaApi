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
		return c.json({
			data: whatsapp.getAllSession(), // Return all existing sessions
		});
	});

	// Schema definition for starting a session
	const startSessionSchema = z.object({
		session: z.string(), // "session" field is required and must be a string
	});

	// Endpoint to start a new session (POST)
	app.post(
		"/start",
		createKeyMiddleware(), // Key validation middleware
		customValidator("json", startSessionSchema), // Validate incoming JSON data against the schema
		async (c) => {
			const payload = c.req.valid("json"); // Get validated JSON data

			// Check if the session already exists
			const isExist = whatsapp.getSession(payload.session);
			if (isExist) {
				throw new HTTPException(400, {
					message: "Session already exist", // Throw error if session exists
				});
			}

			// Generate a QR code or get connection status
			const qr = await new Promise<string | null>(async (resolve) => {
				await whatsapp.startSession(payload.session, {
					onConnected() {
						resolve(null); // Return null when connected
					},
					onQRUpdated(qr) {
						resolve(qr); // Return QR code when updated
					},
				});
			});

			// Return QR code if available
			if (qr) {
				return c.json({
					qr: qr, // Return the QR code as JSON
				});
			}

			// Return a connection success message
			return c.json({
				data: {
					message: "Connected",
				},
			});
		}
	);

	// Endpoint to start a new session (GET, QR visualization)
	app.get(
		"/start",
		createKeyMiddleware(), // Key validation middleware
		customValidator("query", startSessionSchema), // Validate query parameters against the schema
		async (c) => {
			const payload = c.req.valid("query"); // Get validated query parameters

			// Check if the session already exists
			const isExist = whatsapp.getSession(payload.session);
			if (isExist) {
				throw new HTTPException(400, {
					message: "Session already exist", // Throw error if session exists
				});
			}

			// Generate a QR code or get connection status
			const qr = await new Promise<string | null>(async (resolve) => {
				await whatsapp.startSession(payload.session, {
					onConnected() {
						resolve(null); // Return null when connected
					},
					onQRUpdated(qr) {
						resolve(qr); // Return QR code when updated
					},
				});
			});

			// Visualize the QR code as an HTML page if available
			if (qr) {
				return c.render(`
					<div id="qrcode"></div>

					<script type="text/javascript">
						let qr = '${await toDataURL(qr)}'
						let image = new Image()
						image.src = qr
						document.body.appendChild(image)
					</script>
				`);
			}

			// Return a connection success message
			return c.json({
				data: {
					message: "Connected",
				},
			});
		}
	);

	// Endpoint to log out a session
	app.all("/logout", createKeyMiddleware(), async (c) => {
		await whatsapp.deleteSession(
			c.req.query().session || (await c.req.json()).session || "" // Get session name from query or body
		);
		return c.json({
			data: "success", // Return success message
		});
	});

	return app; // Return the application
};

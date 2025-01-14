import {ErrorHandler}     from "hono";
import {HTTPException}    from "hono/http-exception";
import {StatusCode}       from "hono/utils/http-status";
import {ApplicationError} from "../errors";
import {env}              from "../env";

export const globalErrorMiddleware: ErrorHandler = (err, c) => {
	// HTTPException Handling
	if (err instanceof HTTPException && err.message) {
		return c.json(
			{
				message: err.message,
			},
			err.status
		);
	}

	// ApplicationError Handling
	if (ApplicationError.isApplicationError(err)) {
		// @ts-ignore
		return c.json(err.getResponseMessage(), err.code as StatusCode);
	}

	// Log the error for debugging
	console.error("APP ERROR:", err);

	// Default error message for production
	const defaultErrorMessage =
		      env.NODE_ENV === "PRODUCTION"
			      ? "Something went wrong, please try again later!"
			      : err.message;

	// Return generic error response
	return c.json({message: defaultErrorMessage}, 500);
};

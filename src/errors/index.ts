export class ApplicationError extends Error {
	baseName = "ApplicationError";
	code     = 500;

	constructor(message: string) {
		super(message);
		this.name = "ApplicationError";
	}

	getResponseMessage = () => ({
		message: this.message,
	});

	static isApplicationError = (error: any): error is ApplicationError =>
		error instanceof ApplicationError || error.baseName === "ApplicationError";
}

import "dotenv/config";
import {z} from "zod";

export const env = z
.object({
	NODE_ENV: z.enum(["DEVELOPMENT", "PRODUCTION"]).default("DEVELOPMENT"),
	KEY     : z.string().default(""),
	PORT    : z
	.string()
	.default("5001")
	.transform((port) => Number(port)),
})
.parse(process.env);

import { z } from "zod";

export const isUUID = z.uuid({error: "invalid id format"})
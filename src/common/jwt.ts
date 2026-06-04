import jwt from "jsonwebtoken";

import { env } from "../config/env";

type JwtPayloadInput = {
  sub: string;
  email: string;
  role: string;
};

export const signAccessToken = (payload: JwtPayloadInput) => {
  return jwt.sign(payload, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN as jwt.SignOptions["expiresIn"],
  });
};

export const verifyAccessToken = (token: string) => {
  return jwt.verify(token, env.JWT_SECRET) as JwtPayloadInput;
};

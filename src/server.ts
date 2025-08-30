import express from 'express';

import type { Application, Request, Response } from 'express';
import dotenv from 'dotenv';

dotenv.config();

const app: Application = express();
const PORT = process.env.PORT || 8080;

app.use(express.json());

app.get('/', (_req: Request, res: Response) => {
    res.send('Hello, TypeScript + Express!');
});

app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});
